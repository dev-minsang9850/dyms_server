// dyms-server/scratch/test-comcigan-parser.js
const axios = require('axios');

function _calcTeacherViaSTT(data, separator) {
  let teacherNo = -1;
  if (separator == 100) {
    teacherNo = Math.floor(data / separator);
  } else {
    teacherNo = data % separator;
  }
  return teacherNo;
}

function _calcSubjectViaSTT(data, separator) {
  let subjectIndex = -1;
  if (separator == 100) {
    subjectIndex = data % separator;
  } else {
    subjectIndex = Math.floor(data / separator);
  }
  return subjectIndex % separator;
}

async function test() {
  const schoolCode = 53316; // 덕영고등학교
  const queryStr = `73629_${schoolCode}_0_`;
  const base64Query = Buffer.from(queryStr).toString('base64');
  const url = `http://comci.net:4082/36179_T?${base64Query}`;

  try {
    const res = await axios.get(url);
    let text = res.data;
    const lastBrace = text.lastIndexOf('}');
    if (lastBrace !== -1) {
      text = text.substring(0, lastBrace + 1);
    }
    const rawData = JSON.parse(text);

    const dataModel = {
      separator: rawData['분리'],
      teachers: rawData['자료446'],
      originalTimeTable: rawData['자료481'],
      subjects: rawData['자료492'],
      nowTimeTable: rawData['자료147'],
    };

    console.log('Separator:', dataModel.separator);

    const grade = 2;
    const classroomNo = 3;
    const weekdayString = ['일', '월', '화', '수', '목', '금', '토'];

    const results = {};

    for (let weekday = 1; weekday <= 5; weekday++) {
      const dayLabel = weekdayString[weekday];
      results[dayLabel] = [];
      
      const todayData = dataModel.nowTimeTable[grade][classroomNo][weekday];
      const originalData = dataModel.originalTimeTable[grade][classroomNo][weekday];
      
      // periods in comcigan start from index 1 (period 1 to 7/8)
      for (let period = 1; period < todayData.length; period++) {
        const periodData = todayData[period];
        const originalPeriodData = originalData[period];
        
        let subjectName = '-';
        let teacherName = '';
        let isChanged = false;

        if (periodData > 100) {
          isChanged = periodData !== originalPeriodData;
          const teacherIdx = _calcTeacherViaSTT(periodData, dataModel.separator);
          const subjectIdx = _calcSubjectViaSTT(periodData, dataModel.separator);
          subjectName = dataModel.subjects[subjectIdx] || '-';
          teacherName = dataModel.teachers[teacherIdx] || '';
        }
        
        results[dayLabel].push({
          period,
          subject: subjectName,
          teacher: teacherName,
          isChanged
        });
      }
    }

    console.log('Parsed Timetable for 2-3:', JSON.stringify(results, null, 2));

  } catch (e) {
    console.error('Error:', e);
  }
}

test();
