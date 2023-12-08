import moment, {
  Duration,
  DurationInputArg2,
  ISO_8601,
  Moment,
  MomentFormatSpecification,
} from 'moment';
import { stripWikiLinkBrackets } from './string.utils';

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
        let format = `${hour}:${min}`;
        if (sec !== '') format += `:${sec}`;
        if (hour === 'h') format += ' a';
        formats.push(format);
      })
    )
  );
  return formats;
})();

/**
 * @summary Checks for case-insensitive date format of 'ISO-8601'
 * @param {string} format
 * @returns {boolean}
 */
export const isFormatIso8601 = (
  format: string | MomentFormatSpecification
): boolean => (format as string).toLowerCase() === 'iso-8601';

/**
 * @summary Returns a date string from the provided input
 * @param {string} input
 * @param {string} prefixToStrip
 * @param {string} suffixToStrip
 * @returns {string}
 */
export const getDateString = (
  input: string,
  prefixToStrip: string,
  suffixToStrip: string
) => {
  if (!prefixToStrip && !suffixToStrip) return input;

  let dateString = input;
  if (dateString.startsWith('^')) dateString = dateString.slice(1);
  if (prefixToStrip) {
    const regex = new RegExp(`^(${prefixToStrip})`, 'gm');
    if (regex.test(dateString)) dateString = dateString.replace(regex, '');
  }
  if (suffixToStrip) {
    const regex = new RegExp(`^(${suffixToStrip})`, 'gm');
    if (regex.test(dateString)) dateString = dateString.replace(regex, '');
  }
  return dateString;
};

/**
 * @summary Returns the numeric value specified for a duration
 * @param {string} duration
 * @param {string[]} units
 * @returns {number}
 */
export const getValueFromDuration = (
  duration: string,
  units: string[]
): number => {
  if (!duration || !units || units.length === 0) return null;

  const pattern = `^(?<value>[0-9]+)(${units.join('|')})$`;

  const regex = new RegExp(pattern, 'gm');
  const match = regex.exec(duration);
  if (
    match &&
    typeof match.groups !== 'undefined' &&
    typeof match.groups.value !== 'undefined'
  ) {
    const value = parseFloat(match.groups.value);
    if (Number.isNumber(value) && !Number.isNaN(value)) {
      return value;
    }
  }
  return null;
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
    { name: 'years', units: years },
    { name: 'months', units: months },
    { name: 'weeks', units: weeks },
    { name: 'days', units: days },
    { name: 'hours', units: hours },
    { name: 'minutes', units: minutes },
    { name: 'seconds', units: seconds },
  ];

  const isNegative = duration.startsWith('-');
  const isPositive = duration.startsWith('+');
  if (isNegative || isPositive) duration = duration.substring(1);

  for (const format of formats) {
    let value = getValueFromDuration(duration, format.units);
    if (value !== null) {
      if (isNegative) value *= -1;
      const d = window.moment
        .duration(0)
        .add(value, format.name as DurationInputArg2);
      return d;
    }
  }
  return null;
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
  const duration = parseDuration(date);
  let d = null;
  if (duration && window.moment.isDuration(duration)) {
    d = getToday(format);
    d = d.add(duration);
    if (d && d.isValid()) return d;
  }
  return null;
};

/**
 * @summary Parses a date string as a Moment object
 * @param {string} date
 * @param {MomentFormatSpecification} format
 * @returns {Moment}
 */
export const toMoment = (
  date: string,
  format: MomentFormatSpecification
): Moment => {
  const f = isFormatIso8601(format) ? ISO_8601 : format;
  const input = stripWikiLinkBrackets(date);
  return window.moment(input, f, true).startOf('day'); // strip time
};

/**
 * @summary Converts a date string to a Moment object
 * @param {Moment} date
 * @param {string} format
 * @returns
 */
export const dateToString = (date: Moment, format: string): string => {
  if (typeof date === 'undefined' || date === null) return null;
  return isFormatIso8601(format) ? date.format() : date.format(format);
};

/**
 * @summary
 * @param {number} unixTime
 * @param {format} format
 * @returns {Moment}
 */
export const getDateFromUnixTime = (unixTime: number, format: string): Moment =>
  toMoment(dateToString(window.moment(unixTime), format), format);

/**
 * @summary
 * @param format
 * @returns {Moment}
 */
export const getToday = (format: string): Moment => {
  const today = window.moment();
  const strToday = dateToString(today, format);
  return toMoment(strToday, format);
};
