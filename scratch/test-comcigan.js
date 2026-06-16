// dyms-server/scratch/test-comcigan.js
const Timetable = require('comcigan-parser');
const timetable = new Timetable();

async function test() {
  try {
    await timetable.init();
    const schoolList = await timetable.search('덕영고');
    console.log('School List:', schoolList);
    
    if (schoolList.length > 0) {
      const school = schoolList[0];
      console.log('Found School:', school);
      
      // Set school code
      timetable.setSchool(school.code);
      const result = await timetable.getTimetable();
      
      // Grade 2, Class 3 is index 2 and 3
      console.log('Timetable Result for Grade 2, Class 3:', JSON.stringify(result[2][3], null, 2));
    }
  } catch (e) {
    console.error('Error in comcigan parser:', e);
  }
}
test();
