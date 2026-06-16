// dyms-server/scratch/search-comci-code.js
const axios = require('axios');

async function test() {
  const keyword = '%B4%FA%BF%B5%B0%ED'; // "덕영고"
  const queryStr = `73629_search(${keyword})_0_`;
  const base64Query = Buffer.from(queryStr).toString('base64');
  const url = `http://comci.net:4082/36179_T?${base64Query}`;

  try {
    const res = await axios.get(url);
    console.log('Raw Comcigan Search Result:', res.data);
  } catch (e) {
    console.error('Error searching:', e.message);
  }
}
test();
