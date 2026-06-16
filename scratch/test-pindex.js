const axios = require('axios');

async function test() {
  const url = 'https://open.neis.go.kr/hub/hisTimetable';
  const params = {
    Type: 'json',
    ATPT_OFCDC_SC_CODE: 'J10',
    SD_SCHUL_CODE: '7531328',
    GRADE: 2,
    CLASS_NM: 3,
    ALL_TI_YMD: '20260608',
    pIndex: 2,
    pSize: 5
  };

  try {
    const res = await axios.get(url, { params });
    console.log('pIndex: 2, Response:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
