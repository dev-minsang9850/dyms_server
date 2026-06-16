const axios = require('axios');

async function testNeis() {
  const NEIS_BASE_URL = 'https://open.neis.go.kr/hub';
  const officeCode = 'J10';
  const schoolCode = '7531328';
  const date = '20260609'; // Tuesday
  
  // Fetch Page 1
  const params1 = {
    Type: 'json',
    ATPT_OFCDC_SC_CODE: officeCode,
    SD_SCHUL_CODE: schoolCode,
    GRADE: 2,
    CLASS_NM: 3,
    ALL_TI_YMD: date,
    pIndex: 1,
    pSize: 5
  };

  // Fetch Page 2
  const params2 = {
    Type: 'json',
    ATPT_OFCDC_SC_CODE: officeCode,
    SD_SCHUL_CODE: schoolCode,
    GRADE: 2,
    CLASS_NM: 3,
    ALL_TI_YMD: date,
    pIndex: 2,
    pSize: 5
  };

  try {
    const [res1, res2] = await Promise.all([
      axios.get(`${NEIS_BASE_URL}/hisTimetable`, { params: params1 }),
      axios.get(`${NEIS_BASE_URL}/hisTimetable`, { params: params2 })
    ]);

    let combined = [];

    if (res1.data.hisTimetable && res1.data.hisTimetable[1]) {
      combined = combined.concat(res1.data.hisTimetable[1].row);
    }
    if (res2.data.hisTimetable && res2.data.hisTimetable[1]) {
      combined = combined.concat(res2.data.hisTimetable[1].row);
    }

    console.log(`Successfully merged. Total periods: ${combined.length}`);
    combined.forEach(r => {
      console.log(`  ${r.PERIO}교시: ${r.ITRT_CNTNT}`);
    });
  } catch (e) {
    console.error('Error:', e.message);
  }
}

testNeis();
