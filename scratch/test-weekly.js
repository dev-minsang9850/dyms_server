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
  console.log('Weekly dates:', weeklyDates);
  const NEIS_BASE_URL = 'https://open.neis.go.kr/hub';
  const officeCode = 'J10';
  const schoolCode = '7531328';
  const grade = 2;
  const classVal = 3;

  for (const date of weeklyDates) {
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
      console.log(`Date: ${date} -> Status: ${res.status}`);
      if (res.data.hisTimetable) {
        console.log(`  Count: ${res.data.hisTimetable[1].row.length}`);
      } else {
        console.log(`  No timetable data (RESULT: ${JSON.stringify(res.data.RESULT || res.data)})`);
      }
    } catch (e) {
      console.error(`  Error for date ${date}:`, e.message);
    }
  }
}

test();
