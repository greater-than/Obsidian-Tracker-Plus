import moment, {
  Duration,
  ISO_8601,
  Moment,
  MomentFormatSpecification,
} from 'moment';

export type TMoment = (() => Moment) & typeof moment;

export const getMoment = (moment?: TMoment): TMoment => {
  let ret;
  try {
    ret = window.moment;
  } catch (error) {
    ret = moment;
  }
  return ret;
};

export const timeFormats = ((): string[] => {
  // HH: 2-digits hours (24 hour time) from 0 to 23, H:, 2-digits hours (24 hour time) from 0 to 23 without leading 0
  // hh: 2-digits hours (12 hour time), h: 2-digits hours (12 hour time) without leading 0
  // a/A: am or pm
  const fmtHours = ['HH', 'H', 'hh', 'h'];
  // mm: 2-digits minutes, m: 2-digits minutes without leading zero
  const fmtMins = ['mm', 'm'];
  // ss: 2-digits seconds, s: 2-digits seconds without leading zero
  // can be empty
  const fmtSecs = ['ss', 's', ''];

  const timeFormat = [];
  for (const fmtHour of fmtHours) {
    for (const fmtMin of fmtMins) {
      for (const fmtSec of fmtSecs) {
        let fmt = `${fmtHour}:${fmtMin}`;
        if (fmtSec !== '') {
          fmt += `:${fmtSec}`;
        }
        if (fmtHour === 'h') {
          fmt += ' a';
        }
        timeFormat.push(fmt);
      }
    }
  }
  return timeFormat;
})();

/**
 *
 * @param {string} inputString
 * @param {string} prefixToStrip
 * @param {string} suffixToStrip
 * @returns
 */
export const getDateStringFromInputString = (
  inputString: string,
  prefixToStrip: string,
  suffixToStrip: string
) => {
  if (!prefixToStrip && !suffixToStrip) return inputString;

  let dateString = inputString;
  if (dateString.startsWith('^')) dateString = dateString.slice(1);
  if (prefixToStrip) {
    const strRegex = '^(' + prefixToStrip + ')';
    const regex = new RegExp(strRegex, 'gm');
    if (regex.test(dateString)) dateString = dateString.replace(regex, '');
  }
  if (suffixToStrip) {
    const strRegex = '(' + suffixToStrip + ')$';
    const regex = new RegExp(strRegex, 'gm');
    if (regex.test(dateString)) dateString = dateString.replace(regex, '');
  }
  return dateString;
};

export const stringToDate = (
  strDate: string,
  dateFormat: MomentFormatSpecification,
  moment?: TMoment
): Moment => {
  const format =
    (dateFormat as string).toLowerCase() === 'iso-8601' ? ISO_8601 : dateFormat;

  const input =
    strDate.length > 4 && strDate.startsWith('[[') && strDate.endsWith(']]')
      ? strDate.substring(2, strDate.length - 2)
      : strDate;
  return getMoment(moment)(input, format, true).startOf('day'); // strip time
};

export const extractValueFromDurationString = (
  strDuration: string,
  units: Array<string>,
  removePattern: boolean = true
): [number, string] => {
  if (!strDuration || !units || units.length === 0) return [null, strDuration];

  const strRegex = `^(?<value>[0-9]+)(${units.join('|')}')$`;
  const regex = new RegExp(strRegex, 'gm');
  const match = regex.exec(strDuration);
  if (
    match &&
    typeof match.groups !== 'undefined' &&
    typeof match.groups.value !== 'undefined'
  ) {
    const value = parseFloat(match.groups.value);
    if (Number.isNumber(value) && !Number.isNaN(value)) {
      if (removePattern) strDuration = strDuration.replace(regex, '');
      return [value, strDuration];
    }
  }
  return [null, strDuration];
};

export const parseDuration = (
  durationString: string,
  moment?: TMoment
): Duration => {
  //duration string format:
  //year (years, y, Y),
  //month (months, M), // m will conflict with minute!!!
  //week (weeks, w, W),
  //day (days, d, D),
  //hour (hours, h, H),
  //minute (minutes, m), // M will conflict with month!!!
  //second (seconds, s, S)
  if (!durationString) return null;

  let hasValue = false;

  let negativeValue = false;
  if (durationString.startsWith('+')) {
    negativeValue = false;
    durationString = durationString.substring(1);
  }
  if (durationString.startsWith('-')) {
    negativeValue = true;
    durationString = durationString.substring(1);
  }

  const duration = getMoment(moment).duration(0);

  let yearValue = null;
  [yearValue, durationString] = extractValueFromDurationString(durationString, [
    'year',
    'years',
    'Y',
    'y',
  ]);
  if (yearValue !== null) {
    if (negativeValue) yearValue *= -1;
    duration.add(yearValue, 'years');
    hasValue = true;
  }

  let monthValue = null;
  [monthValue, durationString] = extractValueFromDurationString(
    durationString,
    ['month', 'months', 'M']
  );
  if (monthValue !== null) {
    if (negativeValue) monthValue *= -1;
    duration.add(monthValue, 'months');
    hasValue = true;
  }

  let weekValue = null;
  [weekValue, durationString] = extractValueFromDurationString(durationString, [
    'week',
    'weeks',
    'W',
    'w',
  ]);
  if (weekValue !== null) {
    if (negativeValue) weekValue *= -1;
    duration.add(weekValue, 'weeks');
    hasValue = true;
  }

  let dayValue = null;
  [dayValue, durationString] = extractValueFromDurationString(durationString, [
    'day',
    'days',
    'D',
    'd',
  ]);
  if (dayValue !== null) {
    if (negativeValue) dayValue *= -1;
    duration.add(dayValue, 'days');
    hasValue = true;
  }

  let hourValue = null;
  [hourValue, durationString] = extractValueFromDurationString(durationString, [
    'hour',
    'hours',
    'H',
    'h',
  ]);
  if (hourValue !== null) {
    if (negativeValue) hourValue *= -1;
    duration.add(hourValue, 'hours');
    hasValue = true;
  }

  let minuteValue = null;
  [minuteValue, durationString] = extractValueFromDurationString(
    durationString,
    ['minute', 'minutes', 'm']
  );
  if (minuteValue !== null) {
    if (negativeValue) minuteValue *= -1;
    duration.add(minuteValue, 'minutes');
    hasValue = true;
  }

  let secondValue = null;
  [secondValue, durationString] = extractValueFromDurationString(
    durationString,
    ['second', 'seconds', 'S', 's']
  );
  if (secondValue !== null) {
    if (negativeValue) secondValue *= -1;
    duration.add(secondValue, 'seconds');
    hasValue = true;
  }

  return hasValue ? duration : null;
};

export const getDateByDurationToToday = (
  startDate: string,
  dateFormat: string,
  moment?: TMoment
): Moment => {
  let date = null;
  const duration = parseDuration(startDate);
  if (duration && getMoment(moment).isDuration(duration)) {
    date = getDateToday(dateFormat);
    date = date.add(duration);
    if (date && date.isValid()) return date;
  }
  return date;
};

export const dateToString = (date: Moment, dateFormat: string): string => {
  if (typeof date === 'undefined' || date === null) return null;
  if (dateFormat.toLowerCase() === 'iso-8601') return date.format();
  return date.format(dateFormat);
};

export const getDateFromUnixTime = (
  unixTime: number,
  dateFormat: string,
  moment?: TMoment
): Moment => {
  const m = getMoment(moment);
  const date = m(unixTime);
  const strDate = dateToString(date, dateFormat);
  return stringToDate(strDate, dateFormat);
};

export const getDateToday = (dateFormat: string, moment?: TMoment): Moment => {
  const today = getMoment(moment)();
  const strToday = dateToString(today, dateFormat);
  return stringToDate(strToday, dateFormat);
};
