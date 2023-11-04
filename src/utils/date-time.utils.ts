import moment, { ISO_8601 } from 'moment';
import Duration = moment.Duration;
import DurationInputArg2 = moment.DurationInputArg2;
import Moment = moment.Moment;
import MomentFormatSpecification = moment.MomentFormatSpecification;

export type TMoment = (() => Moment) & typeof moment;

export const getMoment = (moment?: TMoment): TMoment => {
  try {
    return window.moment;
  } catch (error) {
    return moment;
  }
};

// HH: 2-digits hours (24 hour time) from 0 to 23, H:, 2-digits hours (24 hour time) from 0 to 23 without leading 0
// hh: 2-digits hours (12 hour time), h: 2-digits hours (12 hour time) without leading 0
// a/A: am or pm
const hours = ['HH', 'H', 'hh', 'h'];
// mm: 2-digits minutes, m: 2-digits minutes without leading zero
const mins = ['mm', 'm'];
// ss: 2-digits seconds, s: 2-digits seconds without leading zero
// can be empty
const secs = ['ss', 's', ''];

export const timeFormats = ((): string[] => {
  const formats: string[] = [];
  hours.forEach((hour) =>
    mins.forEach((min) =>
      secs.forEach((sec) => {
        let fmt = `${hour}:${min}`;
        if (sec !== '') fmt += `:${sec}`;
        if (hour === 'h') fmt += ' a';
        formats.push(fmt);
      })
    )
  );
  return formats;
})();

/**
 * @summary Returns a date string from the provided input
 * @param {string} input
 * @param {string} prefixToStrip
 * @param {string} suffixToStrip
 * @returns {string}
 */
export const getDateStringFromInputString = (
  input: string,
  prefixToStrip: string,
  suffixToStrip: string
) => {
  if (!prefixToStrip && !suffixToStrip) return input;

  let dateString = input;
  if (dateString.startsWith('^')) dateString = dateString.slice(1);
  if (prefixToStrip) {
    const pattern = '^(' + prefixToStrip + ')';
    const regex = new RegExp(pattern, 'gm');
    if (regex.test(dateString)) dateString = dateString.replace(regex, '');
  }
  if (suffixToStrip) {
    const pattern = '(' + suffixToStrip + ')$';
    const regex = new RegExp(pattern, 'gm');
    if (regex.test(dateString)) dateString = dateString.replace(regex, '');
  }
  return dateString;
};

/**
 * @summary
 * @param duration
 * @param units
 * @param removePattern
 * @returns {[number, string]}
 */
export const extractValueFromDurationString = (
  duration: string,
  units: string[],
  removePattern: boolean = true
): { value: number; duration: string } => {
  if (!duration || !units || units.length === 0)
    return { value: null, duration };

  const pattern = `^(?<value>[0-9]+)(${units.join('|')}')$`;
  const regex = new RegExp(pattern, 'gm');
  const match = regex.exec(duration);
  if (
    match &&
    typeof match.groups !== 'undefined' &&
    typeof match.groups.value !== 'undefined'
  ) {
    const value = parseFloat(match.groups.value);
    if (Number.isNumber(value) && !Number.isNaN(value)) {
      if (removePattern) duration = duration.replace(regex, ''); // TODO Why is this here?
      return { value, duration };
    }
  }
  return { value: null, duration }; // TODO duration isn't used anywhere. Do we need to return it?
};

/**
 * @summary
 * @param {string} duration
 * @returns {Duration}
 */
export const parseDuration = (duration: string): Duration => {
  if (!duration) return null;

  // Duration string formats:
  const years = ['year', 'years', 'Y', 'y'];
  const months = ['month', 'months', 'M']; // Note: m will conflict with minute!!!
  const weeks = ['week', 'weeks', 'W', 'w'];
  const days = ['day', 'days', 'D', 'd'];
  const hours = ['hour', 'hours', 'H', 'h'];
  const minutes = ['minute', 'minutes', 'm']; // Note: M will conflict with month!!!
  const seconds = ['second', 'seconds', 'S', 's'];

  const formats = [
    { unit: 'years', units: years },
    { unit: 'months', units: months },
    { unit: 'weeks', units: weeks },
    { unit: 'days', units: days },
    { unit: 'hours', units: hours },
    { unit: 'minutes', units: minutes },
    { unit: 'seconds', units: seconds },
  ];

  let hasValue = false;

  const isNegative = duration.startsWith('-');
  const isPositive = duration.startsWith('+');
  if (isNegative || isPositive) duration = duration.substring(1);

  const mDuration = window.moment.duration(0);

  formats.forEach((format) => {
    let { value } = extractValueFromDurationString(duration, format.units);
    if (value !== null) {
      if (isNegative) value *= -1;
      mDuration.add(value, format.unit as DurationInputArg2);
      hasValue = true;
    }
  });

  // [value, duration] = extractValueFromDurationString(duration, years);
  // if (value !== null) {
  //   if (isNegative) value *= -1;
  //   mDuration.add(value, 'years');
  //   hasValue = true;
  // }

  // [value, duration] = extractValueFromDurationString(duration, months);
  // if (value !== null) {
  //   if (isNegative) value *= -1;
  //   mDuration.add(value, 'months');
  //   hasValue = true;
  // }

  // [value, duration] = extractValueFromDurationString(duration, weeks);
  // if (value !== null) {
  //   if (isNegative) value *= -1;
  //   mDuration.add(value, 'weeks');
  //   hasValue = true;
  // }

  // [value, duration] = extractValueFromDurationString(duration, days);
  // if (value !== null) {
  //   if (isNegative) value *= -1;
  //   mDuration.add(value, 'days');
  //   hasValue = true;
  // }

  // [value, duration] = extractValueFromDurationString(duration, hours);
  // if (value !== null) {
  //   if (isNegative) value *= -1;
  //   mDuration.add(value, 'hours');
  //   hasValue = true;
  // }

  // [value, duration] = extractValueFromDurationString(duration, minutes);
  // if (value !== null) {
  //   if (isNegative) value *= -1;
  //   mDuration.add(value, 'minutes');
  //   hasValue = true;
  // }

  // [value, duration] = extractValueFromDurationString(duration, seconds);
  // if (value !== null) {
  //   if (isNegative) value *= -1;
  //   mDuration.add(value, 'seconds');
  //   hasValue = true;
  // }

  return hasValue ? mDuration : null;
};

/**
 * @summary Returns a Moment object
 * @param {string} date
 * @param {string} format
 * @returns {Moment}
 */
export const getDateByDurationToToday = (
  date: string,
  format: string
): Moment => {
  let mDate = null;
  const duration = parseDuration(date);
  if (duration && window.moment.isDuration(duration)) {
    mDate = getDateToday(format);
    mDate = mDate.add(duration);
    if (mDate && mDate.isValid()) return mDate;
  }
  return mDate;
};

/**
 * @summary Parses a date string as a Moment object
 * @param {string} date
 * @param {MomentFormatSpecification} format
 * @returns {Moment}
 */
export const stringToDate = (
  date: string,
  format: MomentFormatSpecification
): Moment => {
  const mFormat =
    (format as string).toLowerCase() === 'iso-8601' ? ISO_8601 : format;

  const input =
    date.length > 4 && date.startsWith('[[') && date.endsWith(']]')
      ? date.substring(2, date.length - 2)
      : date;
  return window.moment(input, mFormat, true).startOf('day'); // strip time
};

/**
 * @summary Converts a date string to a Moment object
 * @param {Moment} date
 * @param {string} format
 * @returns
 */
export const dateToString = (date: Moment, format: string): string => {
  if (typeof date === 'undefined' || date === null) return null;
  if (format.toLowerCase() === 'iso-8601') return date.format();
  return date.format(format);
};

/**
 * @summary
 * @param {number} unixTime
 * @param {format} format The
 * @returns {Moment}
 */
export const getDateFromUnixTime = (
  unixTime: number,
  format: string
): Moment => {
  const m = window.moment;
  const date = m(unixTime);
  const strDate = dateToString(date, format);
  return stringToDate(strDate, format);
};

/**
 * @summary
 * @param format
 * @returns {Moment}
 */
export const getDateToday = (format: string): Moment => {
  const today = window.moment('');
  const strToday = dateToString(today, format);
  return stringToDate(strToday, format);
};
