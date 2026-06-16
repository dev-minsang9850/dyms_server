// dyms-server/scratch/test-comcigan-raw.js
const axios = require('axios');

async function test() {
  const schoolCode = 53316; // 덕영고등학교
  const queryStr = `73629_${schoolCode}_0_`;
  const base64Query = Buffer.from(queryStr).toString('base64');
  const url = `http://comci.net:4082/36179_T?${base64Query}`;

  try {
    console.log('Fetching from URL:', url);
    const res = await axios.get(url);
    let text = res.data;
    const lastBrace = text.lastIndexOf('}');
    if (lastBrace !== -1) {
      text = text.substring(0, lastBrace + 1);
    }
    const rawData = JSON.parse(text);
    console.log('School Name:', rawData['학교명']);
    console.log('Teachers Count:', rawData['교사수']);
    console.log('Subjects Sample:', rawData['자료492']?.slice(0, 10));
    console.log('Timetable Data Structure exists:', !!rawData['자료147']);
  } catch (e) {
    console.error('Error fetching raw:', e.message);
  }
}
test();
