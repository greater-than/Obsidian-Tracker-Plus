import {
  ArrayError,
  InputMismatchError,
  ParameterError,
  Reason,
  TrackerError,
  ValueError,
} from '../errors';
import { SearchTypeValues, YAxisLocationValues } from '../models/enums';
import { DateTimeUtils, NumberUtils, StringUtils } from '../utils';
import { isNullOrUndefined } from '../utils/object.utils';
import {
  INumberValueOptions,
  IStringValueOptions,
  TValueValidator,
} from './types';

/**
 * @summary Returns keys in an object
 * @description Only returns one level of keys
 * @param {object} obj
 * @returns {string[]}
 */
export const getKeys = (obj: object): string[] =>
  obj !== null ? Object.keys(obj) : [];

// TODO This check doesn't make a lot of sense.
// - Why should it matter if irrelevant properties are added to the code block?
/**
 * @summary Validates keys in the code block
 * @throws Throws a TrackerError if any of the keys is not in renderInfoKeys or allowedKeys
 * @param {string[]} keys
 * @param {string[]} renderInfoKeys
 * @param {string[]} allowedKeys
 */
export const validateKeys = (
  keys: string[],
  renderInfoKeys: string[],
  allowedKeys: string[]
): void => {
  keys.forEach((key): void => {
    if (!renderInfoKeys.includes(key) && !allowedKeys.includes(key))
      throw new TrackerError(`'${key}' is not an available key`);
  });
};

/**
 * @summary Returns a Moment object
 * @param {string} date
 * @param {string} format
 * @param {string} prefixToStrip
 * @param {string} suffixToStrip
 * @returns
 */
export const formatDate = (
  date: string,
  format: string,
  prefixToStrip: string,
  suffixToStrip: string
): moment.Moment => {
  if (typeof date === 'string') {
    if (/^([\-]?[0-9]+[\.][0-9]+|[\-]?[0-9]+)m$/.test(date)) {
      throw new TrackerError(
        `'m' for 'minute' is too small for '${date}', please use 'd' for 'day' or 'M' for month`
      );
    }
    const dateString = DateTimeUtils.getDateString(
      date,
      prefixToStrip,
      suffixToStrip
    );
    const dateAsMoment =
      DateTimeUtils.getDateByDurationToToday(dateString, format) ??
      DateTimeUtils.toMoment(dateString, format);

    if (!dateAsMoment || !dateAsMoment.isValid())
      throw new TrackerError(
        `Invalid date '${date}', the format may not match your dateFormat '${format}'`
      );
    return dateAsMoment;
  }
};

// ----------------
// Value Validators

/**
 * @summary Returns true if the searchType is valid
 * @param {string} searchType
 * @returns {boolean}
 */
export const isSearchTypeValid = (searchType: string): boolean =>
  SearchTypeValues.includes(searchType);

/**
 * @summary Returns true if the y-axis location is valid
 * @param {string} location
 * @returns {boolean}
 */
export const isYAxisLocationValid = (location: string): boolean =>
  YAxisLocationValues.includes(location);

// TODO Why does this function exist?
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const isColorValid = (_color: string): boolean => true;

// -------------
// Value Parsers

/**
 * @summary Returns a string array from a comma delimited string
 * @description Does not split on escaped commas (ex: '\,')
 * @param {string} input
 * @returns {string[]}
 */
export const splitByComma = (input: string): string[] => {
  // let split = input.split(/(?<!\\),/); // --> lookbehind not support in Safari for now
  const dummy = '::::::tracker::::::';
  const temp = input.split('\\,').join(dummy);
  const split = temp.split(',');
  for (let ind = 0; ind < split.length; ind++)
    split[ind] = split[ind].split(dummy).join(',');
  return split;
};

/**
 * @summary Converts input into an array of strings or numbers
 * @param {object | number | string} input
 * @returns {string[] | number[]}
 */
export const convertToArray = (
  input: object | number | string
): string[] | number[] => {
  if (Array.isArray(input)) return input;
  if (String.isString(input)) return splitByComma(input);
  if (Number.isNumber(input)) return [input];
  return null;
};

/**
 * @summary Returns a boolean array from the provided input property
 * @param {string} name
 * @param {T} input
 * @param {number} valueCount
 * @param {boolean} defaultValue
 * @param {boolean} allowInvalidValue
 * @returns {boolean[]}
 */
export const getBooleans = <T>(
  name: string,
  input: T,
  valueCount: number,
  defaultValue: boolean,
  allowInvalidValue: boolean
): Array<boolean> => {
  const booleans: boolean[] = [];
  let validValueCount = 0;

  while (valueCount > booleans.length) {
    booleans.push(defaultValue);
  }

  if (typeof input === 'undefined' || input === null) {
    // all defaultValue
  } else if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      if (input.length > valueCount) throw new InputMismatchError(name);
      if (input.length === 0) throw new ArrayError(name);

      for (let ind = 0; ind < booleans.length; ind++) {
        if (ind < input.length) {
          let curr = input[ind];
          let prev = null;
          if (ind > 0) {
            prev = input[ind - 1].trim();
          }
          if (typeof curr === 'string') {
            curr = curr.trim();
            if (curr === '')
              booleans[ind] = prev !== null ? prev : defaultValue;
            else throw new ValueError(name);
          } else if (typeof curr === 'boolean') {
            booleans[ind] = curr;
            validValueCount++;
          } else throw new ValueError(name);
        } else {
          // Exceeds the length of input, use prev value
          booleans[ind] =
            validValueCount > 0 ? input[input.length - 1] : defaultValue;
        }
      }
    }
  } else if (typeof input === 'string') {
    const values = splitByComma(input);
    if (values.length > 1) {
      if (values.length > valueCount) throw new InputMismatchError(name);

      for (let ind = 0; ind < booleans.length; ind++) {
        if (ind < values.length) {
          const curr = values[ind].trim();
          const prev =
            ind > 0 ? StringUtils.toBool(values[ind - 1].trim()) : null;

          if (curr === '') {
            booleans[ind] = prev !== null ? prev : defaultValue;
          } else {
            const currBool = StringUtils.toBool(curr);
            if (currBool === null) throw new ValueError(name);
            booleans[ind] = currBool;
            validValueCount++;
          }
        } else {
          // Exceeds the length of input, use prev value
          const last = StringUtils.toBool(values[values.length - 1].trim());
          booleans[ind] =
            validValueCount > 0 && last !== null ? last : defaultValue;
        }
      }
    } else {
      if (input === '') {
        // all defaultValue
      } else {
        const inputBool = StringUtils.toBool(input);
        if (inputBool === null) throw new ValueError(name);
        booleans[0] = inputBool;
        validValueCount++;
        for (let ind = 1; ind < booleans.length; ind++)
          booleans[ind] = inputBool;
      }
    }
  } else if (typeof input === 'boolean') {
    booleans[0] = input;
    validValueCount++;
    for (let ind = 1; ind < booleans.length; ind++) booleans[ind] = input;
  } else throw new ValueError(name);

  if (!allowInvalidValue && validValueCount === 0) throw new ValueError(name);

  return booleans;
};

/**
 * @summary Returns the input value as a string
 * @param {T} input
 * @param {string} defaultValue
 * @returns {string}
 */
export const getString = <T extends string | number>(
  input: T,
  defaultValue: string
): string => {
  if (typeof input === 'string') return StringUtils.replaceImgTagByAlt(input);
  else if (typeof input === 'number') return input.toString();
  return defaultValue;
};

/**
 * @summary Returns a string array from the provided input property
 * @param {string} name
 * @param {object | string | number} input
 * @param {Function} validator
 * @param {IStringValueOptions} options
 * @returns
 */
export const getStrings = <T extends object | string | number>(
  name: string,
  input: T,
  validator: TValueValidator,
  options: IStringValueOptions
): string[] => {
  const strings: string[] = [];
  const { valueCount, defaultValue, allowInvalidValue } = options;
  while (valueCount > strings.length) strings.push(defaultValue);
  if (isNullOrUndefined(input)) return strings;

  let validValueCount = 0;
  if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      if (input.length > valueCount) throw new InputMismatchError(name);
      if (input.length === 0) throw new ArrayError(name);

      strings.forEach((_item, index) => {
        if (index < input.length) {
          let curr = input[index];
          const prev = index > 0 ? input[index - 1].trim() : null;

          if (typeof curr === 'string') {
            curr = curr.trim();
            if (curr === '')
              strings[index] = prev !== null ? prev : defaultValue;
            else if (validator && !validator(curr)) throw new ValueError(name);
            else {
              strings[index] = curr;
              validValueCount++;
            }
          } else throw new ValueError(name);
        } else {
          // Exceeds the length of input, use prev value
          strings[index] =
            validValueCount > 0 ? input[input.length - 1].trim() : defaultValue;
        }
      });
    }
  } else if (typeof input === 'string') {
    const values = splitByComma(input);
    if (values.length > 1) {
      if (values.length > valueCount) throw new InputMismatchError(name);

      for (let ind = 0; ind < strings.length; ind++) {
        if (ind < values.length) {
          const curr = values[ind].trim();
          let prev = null;
          if (ind > 0) prev = values[ind - 1].trim();

          if (curr === '') strings[ind] = prev !== null ? prev : defaultValue;
          else if (validator && !validator(curr)) throw new ValueError(name);
          else {
            strings[ind] = curr;
            validValueCount++;
          }
        } else {
          // Exceeds the length of input, use prev value
          const last = values[values.length - 1].trim();
          strings[ind] =
            validValueCount > 0 ? (strings[ind] = last) : defaultValue;
        }
      }
    } else if (input !== '') {
      if (validator && !validator(input)) throw new ValueError(name);

      strings[0] = input;
      validValueCount++;
      for (let ind = 1; ind < strings.length; ind++) strings[ind] = input;
    }
  } else if (typeof input === 'number') {
    const strNumber = input.toString();
    if (validator && !validator(strNumber)) throw new ValueError(name);
    strings[0] = strNumber;
    validValueCount++;
    for (let ind = 1; ind < strings.length; ind++) strings[ind] = strNumber;
  } else throw new ValueError(name);

  if (!allowInvalidValue && validValueCount === 0) throw new ValueError(name);

  return strings.map((s) => StringUtils.replaceImgTagByAlt(s));
};

export const getStringArray = <T extends object | string | number>(
  name: string,
  input: T
): string[] => {
  if (isNullOrUndefined(input)) return [];
  if (typeof input === 'object' && Array.isArray(input)) {
    return input.map((value) => {
      if (typeof value === 'string')
        return StringUtils.replaceImgTagByAlt(value.trim());
    });
  } else if (typeof input === 'string') {
    if (input.trim() === '') throw new ParameterError(name, Reason.IS_EMPTY);
    return splitByComma(input).map((value) => {
      if (typeof value === 'string')
        return StringUtils.replaceImgTagByAlt(value.trim());
    });
  }
  throw new ParameterError(name);
};

/**
 * @summary Returns a number array from the provided input property
 * @param {string} name The name of the property in the tracker block
 * @param {any} input The value of the named property
 * @param {IValueOptions} options
 * @returns {number[]}
 */
export function getNumbers(
  name: string,
  input: object | number | string,
  options: INumberValueOptions
): Array<number> {
  const numbers: number[] = [];
  let validValueCount = 0;
  const { valueCount, defaultValue, allowInvalidValue } = options;
  while (valueCount > numbers.length) numbers.push(defaultValue);

  if (typeof input === 'undefined' || input === null) {
    // all defaultValue
  } else if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      if (input.length > valueCount) throw new InputMismatchError(name);
      if (input.length === 0) throw new ArrayError(name);

      for (let ind = 0; ind < numbers.length; ind++) {
        if (ind < input.length) {
          const curr = input[ind];
          let prev = null;
          if (ind > 0) prev = input[ind - 1].trim();
          if (typeof curr === 'string') {
            if (curr.trim() === '')
              numbers[ind] = prev != null ? prev : defaultValue;
            else throw new ValueError(name);
          } else if (typeof curr === 'number') {
            numbers[ind] = curr;
            validValueCount++;
          } else throw new ValueError(name);
        } else {
          // Exceeds the length of input, use prev value
          const last = input[input.length - 1];
          if (validValueCount > 0) numbers[ind] = last;
          else numbers[ind] = defaultValue;
        }
      }
    }
  } else if (typeof input === 'string') {
    const values = splitByComma(input);
    if (values.length > 1) {
      if (values.length > valueCount) throw new InputMismatchError(name);

      for (let ind = 0; ind < numbers.length; ind++) {
        if (ind < values.length) {
          const curr = values[ind].trim();
          let prev = null;
          if (ind > 0) {
            prev = NumberUtils.parseFloatFromAny(values[ind - 1].trim()).value;
          }
          if (curr === '') {
            numbers[ind] =
              prev !== null && Number.isNumber(prev) ? prev : defaultValue;
          } else {
            const currNum = NumberUtils.parseFloatFromAny(curr).value;
            if (currNum !== null) {
              numbers[ind] = currNum;
              validValueCount++;
            } else throw new ValueError(name);
          }
        } else {
          // Exceeds the length of input, use prev value
          const last = NumberUtils.parseFloatFromAny(
            values[input.length - 1].trim()
          ).value;
          numbers[ind] =
            validValueCount > 0 && last !== null ? last : defaultValue;
        }
      }
    } else if (input !== '') {
      const parsed = NumberUtils.parseFloatFromAny(input).value;
      if (parsed === null) throw new ValueError(name);
      numbers[0] = parsed;
      validValueCount++;
      for (let ind = 1; ind < numbers.length; ind++) numbers[ind] = parsed;
    }
  } else if (typeof input === 'number') {
    if (!Number.isNumber(input)) throw new ValueError(name);
    numbers[0] = input;
    validValueCount++;
    for (let ind = 1; ind < numbers.length; ind++) numbers[ind] = input;
  } else throw new ValueError(name);

  if (!allowInvalidValue && validValueCount === 0)
    throw new TrackerError(`No valid input for ${name}`);

  return numbers;
}

/**
 * @summary Returns a number array from the provided input property
 * @param {string} name
 * @param {object | number | string} input
 * @returns {number[]}
 */
export function getNumberArray(
  name: string,
  input: object | number | string
): number[] {
  if (isNullOrUndefined(input)) return [];

  const elements = convertToArray(input);
  if (!elements) {
    const args = [name, 'values must be an array, number, or string'] as const;
    throw new ParameterError(...args);
  }

  return elements.map((elem) => {
    if (String.isString(elem)) return parseFloat(elem);
    if (Number.isNumber(elem)) return elem;
    throw new ParameterError(name, Reason.IS_NOT_NUMBER);
  });
}
