const axios = require('axios');

async function test() {
  const url = 'https://open.neis.go.kr/hub/hisTimetable';
  const params = {
    Type: 'json',
    ATPT_OFCDC_SC_CODE: 'J10',
    SD_SCHUL_CODE: '7531328',
    GRADE: 2,
    CLASS_NM: 5,
    ALL_TI_YMD: '20260608',
  };

  try {
    const res = await axios.get(url, { params });
    if (res.data.hisTimetable) {
      console.log('Class 5, Row count:', res.data.hisTimetable[1].row.length);
      res.data.hisTimetable[1].row.forEach(r => {
        console.log(`  ${r.PERIO}교시: ${r.ITRT_CNTNT} (${r.DDDEP_NM})`);
      });
    } else {
      console.log('No data:', res.data);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
