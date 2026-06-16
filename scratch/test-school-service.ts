import axios from 'axios';

function _calcSubjectViaSTT(data: number, separator: number): number {
  let subjectIndex = -1;
  if (separator == 100) {
    subjectIndex = data % separator;
  } else {
    subjectIndex = Math.floor(data / separator);
  }
  return subjectIndex % separator;
}

async function getWeeklyTimetable(grade: number, classVal: number): Promise<any> {
  const days = ['월', '화', '수', '목', '금'];
  const timetableData: { [key: string]: string[] } = {};

  try {
    const schoolCode = 53316;
    const queryStr = `73629_${schoolCode}_0_`;
    const base64Query = Buffer.from(queryStr).toString('base64');
    const url = `http://comci.net:4082/36179_T?${base64Query}`;

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
      subjects: rawData['자료492'],
      nowTimeTable: rawData['자료147'],
    };

    for (let weekday = 1; weekday <= 5; weekday++) {
      const dayLabel = days[weekday - 1];
      const periods = Array(7).fill('-');
      
      if (dataModel.nowTimeTable[grade] && dataModel.nowTimeTable[grade][classVal]) {
        const todayData = dataModel.nowTimeTable[grade][classVal][weekday];
        if (todayData) {
          for (let period = 1; period < todayData.length && period <= 7; period++) {
            const periodData = todayData[period];
            let subjectName = '-';

            if (periodData > 100) {
              const subjectIdx = _calcSubjectViaSTT(periodData, dataModel.separator);
              subjectName = dataModel.subjects[subjectIdx] || '-';
            }
            
            periods[period - 1] = subjectName;
          }
        }
      }
      
      timetableData[dayLabel] = periods;
    }

    return timetableData;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

getWeeklyTimetable(2, 3).then(console.log);
