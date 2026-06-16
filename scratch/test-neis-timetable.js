// dyms-server/scratch/test-neis-timetable.js
const axios = require('axios');

const officeCode = 'J10'; // 경기도교육청
const schoolCode = '7531328'; // 덕영고등학교

async function test() {
  const date = '20260615'; // Monday
  const testGrade = 2;

  console.log(`\n=== Scanning classes 1 to 10 for Grade 2 on ${date} ===`);
  for (let cl = 1; cl <= 10; cl++) {
    try {
      const res = await axios.get('https://open.neis.go.kr/hub/hisTimetable', {
        params: {
          Type: 'json',
          ATPT_OFCDC_SC_CODE: officeCode,
          SD_SCHUL_CODE: schoolCode,
          GRADE: testGrade,
          CLASS_NM: String(cl),
          ALL_TI_YMD: date,
        }
      });
      if (res.data.hisTimetable) {
        const rows = res.data.hisTimetable[1].row;
        const dept = rows[0].DDDEP_NM;
        const subjects = rows.map(r => `${r.PERIO}교시: ${r.ITRT_CNTNT}`).join(', ');
        console.log(`반 ${cl} (${dept}): ${subjects}`);
      } else {
        console.log(`반 ${cl}: 데이터 없음 - ${JSON.stringify(res.data)}`);
      }
    } catch (e) {
      console.error(`반 ${cl} 에러:`, e.message);
    }
  }
}

test();
