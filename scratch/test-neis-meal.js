// scratch/test-neis-meal.js
const axios = require('axios');

const NEIS_BASE_URL = 'https://open.neis.go.kr/hub';
const officeCode = 'J10'; // 경기도교육청
const schoolCode = '7531328'; // 덕영고등학교

async function run() {
  const dates = ['20260608', '20260609', '20260610']; // Mon, Tue, Wed of next week
  console.log(`Querying meals for dates: ${dates.join(', ')}`);

  for (const date of dates) {
    const params = {
      Type: 'json',
      ATPT_OFCDC_SC_CODE: officeCode,
      SD_SCHUL_CODE: schoolCode,
      MLSV_YMD: date,
    };
    try {
      const url = `${NEIS_BASE_URL}/mealServiceDietInfo`;
      console.log(`GET ${url} with params`, params);
      const res = await axios.get(url, { params });
      console.log(`Response for ${date}:`, JSON.stringify(res.data, null, 2));
    } catch (err) {
      console.error(`Error for ${date}:`, err.message);
    }
  }

  // Also test timetable for Grade 2, Class 3
  try {
    const timeUrl = `${NEIS_BASE_URL}/hisTimetable`;
    const timeParams = {
      Type: 'json',
      ATPT_OFCDC_SC_CODE: officeCode,
      SD_SCHUL_CODE: schoolCode,
      GRADE: 2,
      CLASS_NM: 3,
      ALL_TI_YMD: '20260608', // Monday
    };
    console.log(`GET ${timeUrl} with params`, timeParams);
    const res = await axios.get(timeUrl, { params: timeParams });
    console.log('Timetable Response:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Timetable error:', err.message);
  }
}

run();
