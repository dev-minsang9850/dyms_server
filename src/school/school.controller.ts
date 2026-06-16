import { Controller, Get, Post, Body, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { SchoolService } from './school.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PushService } from '../push/push.service';
import { UsersService } from '../users/users.service';

@Controller('school')
@UseGuards(JwtAuthGuard)
export class SchoolController {
  constructor(
    private readonly schoolService: SchoolService,
    private readonly pushService: PushService,
    private readonly usersService: UsersService,
  ) {}

  @Get('meals')
  async getMeals() {
    return this.schoolService.getMeals();
  }

  @Get('notices')
  async getNotices() {
    return this.schoolService.getNotices();
  }

  @Post('notices')
  async createNotice(@Req() req: any, @Body() body: { title: string; content: string; tag: string }) {
    const user = req.user;
    if (!user.isApproved) {
      throw new UnauthorizedException('승인된 사용자만 작성할 수 있습니다.');
    }
    if (user.role !== 'teacher' && !user.isAdmin) {
      throw new UnauthorizedException('선생님 또는 관리자만 공지사항을 작성할 수 있습니다.');
    }
    
    // 현재 날짜 포맷팅 (YYYY.MM.DD)
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

    const newNotice = await this.schoolService.createNotice({
      title: body.title,
      content: body.content,
      tag: body.tag || '공지',
      date: dateStr,
    });

    // FCM/Expo Push Notification to all users
    const allUsers = await this.usersService.findAll();
    const pushTokens = allUsers.map(u => u.pushToken).filter(t => !!t) as string[];
    if (pushTokens.length > 0) {
      await this.pushService.broadcastNotice(
        pushTokens,
        `[새 공지사항] ${newNotice.title}`,
        newNotice.content.length > 30 ? newNotice.content.substring(0, 30) + '...' : newNotice.content,
        { noticeId: newNotice.id, type: 'notice' }
      );
    }

    return newNotice;
  }

  @Get('timetable')
  async getTimetable(
    @Query('grade') grade?: string,
    @Query('class') classVal?: string,
  ) {
    // 값이 없을 경우 디폴트 2학년 3반 조회
    const g = grade ? parseInt(grade, 10) : 2;
    const c = classVal ? parseInt(classVal, 10) : 3;
    return this.schoolService.getWeeklyTimetable(g, c);
  }
}
