// scratch/search-school.js
const axios = require('axios');

async function run() {
  const url = 'https://open.neis.go.kr/hub/schoolInfo';
  const params = {
    Type: 'json',
    SCHUL_NM: '덕영고등학교',
  };
  try {
    const res = await axios.get(url, { params });
    console.log('School Info Response:', JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
