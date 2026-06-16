const axios = require('axios');

function getWeeklyDates() {
  const current = new Date();
  const week = [];
  const day = current.getDay();
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

async function test() {
  const weeklyDates = getWeeklyDates();
  const days = ['월', '화', '수', '목', '금'];
  const NEIS_BASE_URL = 'https://open.neis.go.kr/hub';
  const officeCode = 'J10';
  const schoolCode = '7531328';
  const grade = 2;
  const classVal = 3;

  for (let i = 0; i < weeklyDates.length; i++) {
    const date = weeklyDates[i];
    const dayLabel = days[i];
    const params = {
      Type: 'json',
      ATPT_OFCDC_SC_CODE: officeCode,
      SD_SCHUL_CODE: schoolCode,
      GRADE: grade,
      CLASS_NM: classVal,
      ALL_TI_YMD: date,
    };
    try {
      const res = await axios.get(`${NEIS_BASE_URL}/hisTimetable`, { params });
      let totalCount = 'N/A';
      if (res.data.hisTimetable && res.data.hisTimetable[0] && res.data.hisTimetable[0].head && res.data.hisTimetable[0].head[0]) {
        totalCount = res.data.hisTimetable[0].head[0].list_total_count;
      }
      console.log(`${dayLabel}요일 (${date}): list_total_count = ${totalCount}`);
    } catch (e) {
      console.error(`${dayLabel}요일 (${date}) Error:`, e.message);
    }
  }
}

test();
