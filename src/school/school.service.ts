import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { NoticeEntity } from './notice.entity';

export interface Notice {
  id: string;
  tag: '긴급' | '행사' | '공지' | string;
  date: string;
  title: string;
  content: string;
  linkUrl?: string;
}

export interface Meal {
  date: string;
  menu: string[];
  calories: string;
}

@Injectable()
export class SchoolService implements OnModuleInit {
  private readonly logger = new Logger('SchoolService');

  // NEIS API Constants for 덕영고등학교
  private readonly NEIS_BASE_URL = 'https://open.neis.go.kr/hub';

  private get officeCode(): string {
    return process.env.NEIS_OFFICE_CODE || 'J10'; // 기본값: 경기도교육청
  }

  private get schoolCode(): string {
    return process.env.NEIS_SCHOOL_CODE || '7531328'; // 기본값: 덕영고등학교
  }

  private get apiKey(): string | undefined {
    return process.env.NEIS_API_KEY;
  }

  constructor(
    @InjectRepository(NoticeEntity)
    private readonly noticeRepository: Repository<NoticeEntity>,
  ) {}

  async onModuleInit() {
    // 공지사항 초기화는 비어있게 둡니다. (더미 데이터 제거 완료)
    this.logger.log('SchoolService initialized');
  }

  async getNotices(): Promise<NoticeEntity[]> {
    return this.noticeRepository.find({
      order: {
        date: 'DESC',
      },
    });
  }

  async createNotice(notice: Omit<Notice, 'id'> & { id?: string }): Promise<NoticeEntity> {
    const newNotice = {
      ...notice,
      id: notice.id || require('uuid').v4(),
    };
    return this.noticeRepository.save(newNotice);
  }

  async updateNotice(id: string, updateData: Partial<Omit<Notice, 'id' | 'date'>>): Promise<NoticeEntity> {
    const notice = await this.noticeRepository.findOne({ where: { id } });
    if (!notice) {
      throw new Error('Notice not found');
    }
    
    // Update fields
    if (updateData.title !== undefined) notice.title = updateData.title;
    if (updateData.content !== undefined) notice.content = updateData.content;
    if (updateData.tag !== undefined) notice.tag = updateData.tag;
    if (updateData.linkUrl !== undefined) notice.linkUrl = updateData.linkUrl;

    return this.noticeRepository.save(notice);
  }

  // 나이스 오픈 API 급식 조회
  async getMeals(): Promise<Meal[]> {
    const today = new Date();
    const dates: string[] = [];
    
    // 오늘을 포함하여 향후 3일간의 급식 데이터 쿼리용 날짜 배열 생성
    for (let i = 0; i < 3; i++) {
      const target = new Date(today);
      target.setDate(today.getDate() + i);
      const yyyy = target.getFullYear();
      const mm = (target.getMonth() + 1).toString().padStart(2, '0');
      const dd = target.getDate().toString().padStart(2, '0');
      dates.push(`${yyyy}${mm}${dd}`);
    }

    try {
      // 3일치 데이터를 NEIS API에서 한 번에 쿼리 (범위 쿼리가 불가하므로 다중 요청 처리)
      const requests = dates.map(date => {
        const params: any = {
          Type: 'json',
          ATPT_OFCDC_SC_CODE: this.officeCode,
          SD_SCHUL_CODE: this.schoolCode,
          MLSV_YMD: date,
        };
        if (this.apiKey) {
          params.KEY = this.apiKey;
        }
        return axios.get(`${this.NEIS_BASE_URL}/mealServiceDietInfo`, { params });
      });

      const responses = await Promise.all(requests);
      const mealList: Meal[] = [];

      responses.forEach((res, index) => {
        const data = res.data;
        const dateStr = dates[index];
        const formattedDateLabel = this.formatDateLabel(dateStr, index);

        if (data.mealServiceDietInfo && data.mealServiceDietInfo[1] && data.mealServiceDietInfo[1].row) {
          const row = data.mealServiceDietInfo[1].row[0];
          // 알레르기 정보 제거 정규식
          const cleanMenu = row.DDISH_NM
            .replace(/<br\/>/g, '\n')
            .replace(/\([0-9\.]+\)/g, '')
            .split('\n')
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0);

          mealList.push({
            date: formattedDateLabel,
            menu: cleanMenu,
            calories: row.CAL_INFO || 'N/A'
          });
        } else {
          // 해당 날짜 급식 정보 없음 (주말/방학 등)
          mealList.push({
            date: formattedDateLabel,
            menu: ['급식 계획이 없는 날입니다.'],
            calories: '0 kcal'
          });
        }
      });

      return mealList;
    } catch (error) {
      this.logger.error('Error fetching meals from NEIS API', error);
      // Fallback
      return [
        {
          date: '오늘 (금)',
          menu: ['차조밥', '돈육김치찌개', '치킨가스 & 소스', '감자채볶음', '배추김치', '아이스 망고'],
          calories: '785 kcal'
        }
      ];
    }
  }

  // 실시간 시간표 파싱 헬퍼 함수
  private _calcTeacherViaSTT(data: any, separator: number): number {
    let teacherNo = -1;
    const numData = parseInt(String(data).replace(/[^0-9]/g, ''), 10);
    if (isNaN(numData)) return -1;
    if (separator == 100) {
      teacherNo = Math.floor(numData / separator);
    } else {
      teacherNo = numData % separator;
    }
    return teacherNo;
  }

  private _calcSubjectViaSTT(data: any, separator: number): number {
    let subjectIndex = -1;
    const numData = parseInt(String(data).replace(/[^0-9]/g, ''), 10);
    if (isNaN(numData)) return -1;
    if (separator == 100) {
      subjectIndex = numData % separator;
    } else {
      subjectIndex = Math.floor(numData / separator);
    }
    return subjectIndex % separator;
  }

  // 컴시간 알리미(comci.net)를 통한 실시간 시간표 조회 (월~금 주간 Grid 형태로 가공)
  async getWeeklyTimetable(grade: number, classVal: number): Promise<{ [key: string]: string[] }> {
    const days = ['월', '화', '수', '목', '금'];
    const timetableData: { [key: string]: string[] } = {};

    try {
      const schoolCode = 53316; // 덕영고등학교
      const queryStr = `73629_${schoolCode}_0_`;
      const base64Query = Buffer.from(queryStr).toString('base64');
      const url = `http://comci.net:4082/36179_T?${base64Query}`;

      const res = await axios.get(url);
      let text = res.data;
      const lastBrace = text.lastIndexOf('}');
      if (lastBrace !== -1) {
        text = text.substring(0, lastBrace + 1);
      }
      const rawData = JSON.parse(text);

      const dataModel = {
        separator: rawData['분리'],
        teachers: rawData['자료446'],
        subjects: rawData['자료492'],
        nowTimeTable: rawData['자료147'],
      };

      for (let weekday = 1; weekday <= 5; weekday++) {
        const dayLabel = days[weekday - 1];
        const periods = Array(7).fill('-');
        
        if (dataModel.nowTimeTable[grade] && dataModel.nowTimeTable[grade][classVal]) {
          const todayData = dataModel.nowTimeTable[grade][classVal][weekday];
          if (todayData) {
            for (let period = 1; period < todayData.length && period <= 7; period++) {
              const periodData = todayData[period];
              let subjectName = '-';

              const numPeriodData = parseInt(String(periodData).replace(/[^0-9]/g, ''), 10);
              if (!isNaN(numPeriodData) && numPeriodData > 100) {
                const subjectIdx = this._calcSubjectViaSTT(periodData, dataModel.separator);
                subjectName = dataModel.subjects[subjectIdx] || '-';
              }
              
              periods[period - 1] = subjectName;
            }
          }
        }
        
        timetableData[dayLabel] = periods;
      }

      return timetableData;
    } catch (error) {
      this.logger.error('Error fetching timetable from Comcigan API', error);
      return this.getFallbackTimetable(classVal, grade);
    }
  }

  async deleteNotice(id: string): Promise<void> {
    await this.noticeRepository.delete({ id });
  }

  // 학과별 더미 시간표 정의 (월~수: 6교시, 목~금: 7교시 교내 실제 시간표 패턴 반영)
  getFallbackTimetable(classVal: number, grade: number = 2): { [key: string]: string[] } {
    const appendGrade = (subject: string) => subject === '-' ? '-' : `${subject} (${grade}학년)`;

    let baseTimetable: { [key: string]: string[] };
    if (classVal === 1 || classVal === 2) {
      // 경영회계과
      baseTimetable = {
        '월': ['국어', '수학', '영어', '회계원리', '회계원리', '자율', '-'],
        '화': ['수학', '영어', '체육', '성공적인 직업생활', '성공적인 직업생활', '상업정보', '-'],
        '수': ['음악', '미술', '수학', '과학', '사무관리', '사무관리', '-'],
        '목': ['영어', '체육', '국어', '기업경영', '기업경영', '세무실무', '세무실무'],
        '금': ['회계정보', '원가회계', '수학', '영어', '회계원리', '상업정보', '자율'],
      };
    } else if (classVal === 3 || classVal === 4) {
      // 보건간호과
      baseTimetable = {
        '월': ['국어', '수학', '영어', '기초 간호 임상 실무', '기초 간호 임상 실무', '자율', '-'],
        '화': ['수학', '영어', '체육', '보건간호 기초', '보건간호 기초', '공중보건학', '-'],
        '수': ['음악', '미술', '수학', '과학', '간호의 기초', '간호의 기초', '-'],
        '목': ['영어', '체육', '국어', '기초 간호 임상 실무', '기초 간호 임상 실무', '해부생리학', '해부생리학'],
        '금': ['간호의 기초', '공중보건학', '수학', '영어', '기초 간호 임상 실무', '보건간호 기초', '자율'],
      };
    } else {
      // 빅데이터과 및 소프트웨어과 (기본값)
      baseTimetable = {
        '월': ['국어', '수학', '영어', '자료구조', '자료구조', '자율', '-'],
        '화': ['수학', '영어', '체육', 'DB', 'DB', '중국어', '-'],
        '수': ['음악', '미술', '수학', '과학', '네트워크', '네트워크', '-'],
        '목': ['영어', '체육', '국어', 'HTML5', 'HTML5', '앱 프로그래밍', '앱 프로그래밍'],
        '금': ['데이터베이스', '네트워크 기초', '수학', '영어', '자료구조', '웹 프로그래밍', '자율'],
      };
    }

    const modifiedTimetable: { [key: string]: string[] } = {};
    for (const day in baseTimetable) {
      modifiedTimetable[day] = baseTimetable[day].map(appendGrade);
    }
    return modifiedTimetable;
  }

  // 날짜 변환 헬퍼 (yyyyMMdd -> O월 O일 (요일))
  private formatDateLabel(dateStr: string, offset: number): string {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const y = parseInt(dateStr.substring(0, 4), 10);
    const m = parseInt(dateStr.substring(4, 6), 10) - 1;
    const d = parseInt(dateStr.substring(6, 8), 10);
    const dateObj = new Date(y, m, d);
    
    let prefix = '';
    if (offset === 0) prefix = '오늘 ';
    else if (offset === 1) prefix = '내일 ';

    return `${prefix}${m + 1}월 ${d}일 (${days[dateObj.getDay()]})`;
  }

  // 이번 주 월~금 날짜 리스트 구하기
  private getWeeklyDates(): string[] {
    const current = new Date();
    const week: string[] = [];
    const day = current.getDay();
    // 일요일(0)인 경우 지난주 월요일로 가는 걸 방지하기 위해 보정
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    
    for (let i = 0; i < 5; i++) {
      const d = new Date(current);
      d.setDate(diff + i);
      const yyyy = d.getFullYear();
      const mm = (d.getMonth() + 1).toString().padStart(2, '0');
      const dd = d.getDate().toString().padStart(2, '0');
      week.push(`${yyyy}${mm}${dd}`);
    }
    return week;
  }
}
