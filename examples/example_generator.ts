import * as fs from 'fs';
import * as moment from 'moment';
import * as path from 'path';

const root_folder = __dirname;
const subfolder = 'diary';
const dateFormat = 'YYYY-MM-DD';
const startDate = moment('2021-01-01', dateFormat);
const endDate = moment('2021-12-31', dateFormat);
let seed = 1;

const random = (): number => Math.floor(Math.sin(seed++) * 10000);

const randomIntFromInterval = (min: number, max: number): number =>
  Math.floor(random() * (max - min + 1) + min);

const randomFloatFromInterval = (min: number, max: number): number =>
  random() * (max - min + 1) + min;

// Check subfolder exists
const subfolderPath = path.join(root_folder, subfolder);
if (!fs.existsSync(subfolderPath)) {
  fs.mkdirSync(subfolderPath);
}

let dayCount = 0;
for (
  let curDate = startDate.clone();
  curDate <= endDate;
  curDate.add(1, 'days')
) {
  dayCount++;
  const fileName = curDate.format(dateFormat);
  const filePath = path.join(subfolderPath, fileName + '.md');

  const fh = fs.openSync(filePath, 'w+');

  let content: string = '';

  // frontmatter
  let frontmatter = '---\n';

  // front matter tags
  const weekday = curDate.weekday();
  if (weekday == 0 || weekday == 6) {
    frontmatter += 'tags: ' + '\n';
  } else {
    frontmatter += 'tags: ' + 'work_log' + ', ' + 'work_log2' + '\n';
  }
  // frontmatter mood
  const moodSymbols = ['😀', '🙂', '😐', '🙁', '😞'];
  const indMood = randomIntFromInterval(0, 4);
  frontmatter += 'mood: ' + moodSymbols[indMood] + '\n';

  // blood pressure
  let progress = dayCount;
  if (progress > 100) {
    progress = 100;
  }
  const systolicStart = 180;
  const diastolicStart = 120;
  const systolicEnd = 120;
  const diastolicEnd = 100;
  const systolicDeviation = randomIntFromInterval(-5, 5);
  const diastolicDeviation = randomIntFromInterval(-2, 2);
  const systolic =
    ((systolicEnd - systolicStart) * dayCount) / 100 +
    systolicStart +
    systolicDeviation;
  const diastolic =
    ((diastolicEnd - diastolicStart) * dayCount) / 100 +
    diastolicStart +
    diastolicDeviation;
  frontmatter += 'bloodPressure: ' + systolic + '/' + diastolic + '\n';
  frontmatter += 'bloodPressure1: ' + systolic + ', ' + diastolic + '\n';
  frontmatter += 'bloodPressure2: [' + systolic + ', ' + diastolic + ']' + '\n';

  frontmatter += 'bp:' + '\n';
  frontmatter += '    systolic: ' + systolic + '\n';
  frontmatter += '    diastolic: ' + diastolic + '\n';

  // clock-in clock-out, 24hr
  const time_clock_in =
    randomIntFromInterval(8, 10).toString() +
    ':' +
    randomIntFromInterval(0, 59).toString();
  const time_clock_out =
    randomIntFromInterval(16, 20).toString() +
    ':' +
    randomIntFromInterval(0, 59).toString();
  frontmatter += 'clock-in: ' + time_clock_in + '\n';
  frontmatter += 'clock-out: ' + time_clock_out + '\n';

  // sleep, 12hr + am/pm
  const time_in_bed =
    randomIntFromInterval(9, 11).toString() +
    ':' +
    randomIntFromInterval(0, 59).toString() +
    ' pm';
  const time_out_of_bed =
    randomIntFromInterval(5, 7).toString() +
    ':' +
    randomIntFromInterval(0, 59).toString() +
    ' am';
  frontmatter += 'sleep: ' + time_in_bed + '/' + time_out_of_bed + '\n';

  // deep value
  const deepValue = randomFloatFromInterval(0.0, 100.0);
  frontmatter += 'deepValue: ' + '\n';
  let indent = '    ';
  for (let ind = 0; ind < 5; ind++) {
    frontmatter += indent + 'very: ' + '\n';
    indent = indent + '    ';
  }
  frontmatter += indent + 'deep: ' + deepValue.toFixed(1) + '\n';

  // random character
  frontmatter += 'random-char: ' + String.fromCharCode(65 + indMood) + '\n';

  frontmatter += '---\n';
  content += frontmatter;

  content += '\n';

  // weight
  const weight = randomFloatFromInterval(60.0, 80.0);
  const tagWeight = '#weight:' + weight.toFixed(1) + 'kg';
  content += tagWeight + '\n';

  content += '\n';

  // exercise
  // pushup
  const numPushup = randomIntFromInterval(30, 50);
  const tagPushup = '#exercise-pushup:' + numPushup;
  content += tagPushup + '\n';
  //plank
  const numPlank = randomIntFromInterval(30, 120);
  const tagPlank = '#exercise-plank:' + numPlank + 'sec';
  content += tagPlank + '\n';

  content += '\n';

  // meditation
  const tagMeditation = '#meditation';
  const missedMeditation = randomIntFromInterval(0, 1);
  if (!missedMeditation) {
    content += tagMeditation + '\n';
  }

  content += '\n';

  // star
  const textStar = '⭐';
  const numStar = randomIntFromInterval(0, 5);
  content += textStar.repeat(numStar) + '\n';

  content += '\n';

  // clean up
  const tagCleanUp = '#clean-up';
  const doCleanUp = randomIntFromInterval(0, 5);
  if (doCleanUp === 1) {
    content += tagCleanUp + '\n';
  }

  content += '\n';

  // finance
  const tagFinanceBank1 = '#finance/bank1';
  const tagFinanceBank2 = '#finance/bank2';

  const expense = randomFloatFromInterval(2.0, 3.0);
  content += tagFinanceBank1 + ':-' + expense.toFixed(1) + 'USD' + '\n';

  if (dayCount % 30 == 0) {
    content += tagFinanceBank2 + ':' + '200USD' + '\n';
    content += tagFinanceBank2 + '/transfer:' + '-100USD' + '\n';
    content += tagFinanceBank1 + '/transfer:' + '100USD' + '\n';
  }

  content += '\n';

  // wiki links
  content += '[[todo_family|To-Do @Family]]' + '\n';
  content += '[[todo_work|To-Do @Work]]' + '\n';

  content += '\n';

  // searching text use regex
  const addEmail1 = randomIntFromInterval(0, 1);
  if (addEmail1) {
    content += 'obsidian-tracker@gmail.com' + '\n';
  }
  const addEmail2 = randomIntFromInterval(0, 1);
  if (addEmail2) {
    content += 'obsidian-tracker+1@gmail.com' + '\n';
  }
  const addEmail3 = randomIntFromInterval(0, 1);
  if (addEmail3) {
    content += 'obsidian-tracker@yahoo.com' + '\n';
  }

  content += '\n';

  const countWeightLifting = randomIntFromInterval(10, 20);
  const addWeightLifting = randomIntFromInterval(0, 5);
  if (addWeightLifting > 0) {
    content += 'weightlifting: ' + countWeightLifting + '\n';
  }

  content += '\n';

  const dataviewValue = randomIntFromInterval(0, 100);
  const dataviewValue1 = randomIntFromInterval(0, 50);
  const dataviewValue2 = randomIntFromInterval(50, 100);
  content += 'dataviewTarget:: ' + dataviewValue + '\n';
  content += '- Make Progress:: ' + dataviewValue1 + '\n';
  content += '- Make-Progress:: ' + dataviewValue2 + '\n';
  content += 'dataviewTarget1:: ' + dataviewValue + '/' + dataviewValue1 + '\n';
  content +=
    'dataviewTarget2:: ' + dataviewValue1 + ' @ ' + dataviewValue2 + '\n';
  content +=
    'dataviewTarget3:: ' + dataviewValue1 + ', ' + dataviewValue2 + '\n';

  content += '\n';

  // clock-in clock-out in dvField
  const seconds = dataviewValue1;
  content += 'clock-in:: ' + time_clock_in + ':' + seconds + '\n';
  content += 'clock-out:: ' + time_clock_out + ':' + seconds + '\n';

  content += '\n';

  // sleep in dvField
  content += 'sleep:: ' + time_in_bed + '/' + time_out_of_bed + '\n';

  content += '\n';

  const amplitude = 1.0;
  const period = 30; // how many days to complete a sin period
  const numSinValues = 9;
  const initPhaseShift = -1.0;
  const shiftPhase = 1.0;
  const sinValues: Array<string> = [];
  for (let ind = 0; ind < numSinValues; ind++) {
    const shift = initPhaseShift + ind * shiftPhase;
    const sinValue =
      amplitude * Math.sin(((2.0 * Math.PI) / period) * (dayCount + shift));
    sinValues.push(sinValue.toFixed(5));
  }

  const tagSin = '#sin';

  content += tagSin + ':' + sinValues.join('/') + '\n';

  content += '\n';

  const sinSquareValues: Array<string> = [];
  for (let ind = 0; ind < numSinValues; ind++) {
    const shift = initPhaseShift + ind * shiftPhase;
    const sinSquareValue =
      (amplitude * Math.sin(((2.0 * Math.PI) / period) * (dayCount + shift))) **
      2;
    sinSquareValues.push(sinSquareValue.toFixed(5));
  }

  const tagSinSquare = '#sinsquare';
  content += tagSinSquare + ':' + sinSquareValues.join('/') + '\n';

  content += '\n';

  // Tasks
  const taskSayLove = 'Say I love you';
  const missedSayLove = randomIntFromInterval(0, 1);
  if (!missedSayLove) {
    content += '- [x] ' + taskSayLove + '\n';
  } else {
    content += '- [ ] ' + taskSayLove + '\n';
  }

  content += '\n';

  fs.writeFileSync(fh, content);
  fs.closeSync(fh);
}
