// dyms-server/scratch/test-school-service.js
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { SchoolService } = require('../dist/school/school.service');

async function test() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const schoolService = app.get(SchoolService);

  try {
    console.log('--- Fetching weekly timetable for Grade 2, Class 3 ---');
    const timetable = await schoolService.getWeeklyTimetable(2, 3);
    console.log('Result:', JSON.stringify(timetable, null, 2));
  } catch (e) {
    console.error('Error in getWeeklyTimetable:', e);
  } finally {
    await app.close();
  }
}

test();
