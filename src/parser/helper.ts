import { Orientation } from 'src/enums';
import {
  EmptyArrayError,
  InvalidInputError,
  InvalidParameterError,
  NoValidInputError,
  Reason,
  TooManyInputsError,
  TrackerError,
} from '../errors';
import { SearchTypeValues, YAxisLocationValues } from '../models/enums';
import { CartesianChart } from '../ui-components/chart/cartesian-chart.model';
import { NumberUtils, StringUtils } from '../utils';

/**
 * Converts truthy/falsy strings to a boolean
 * @param {string} value
 * @returns {boolean | null}
 */
export const strToBool = (value: string): boolean | null => {
  switch (value.trim().toLowerCase()) {
    case 'true':
    case '1':
    case 'on':
    case 'yes':
      return true;
    case 'false':
    case '0':
    case 'off':
    case 'no':
      return false;
    default:
      return null;
  }
};

/**
 * Returns true if the searchType is valid
 * @param {string} searchType
 * @returns {boolean}
 */
export const isSearchTypeValid = (searchType: string): boolean =>
  SearchTypeValues.includes(searchType);

/**
 * Returns true if the y-axis location is valid
 * @param {string} location
 * @returns {boolean}
 */
export const isYAxisLocationValid = (location: string): boolean =>
  YAxisLocationValues.includes(location);

// TODO Why does this function exist?
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const isColorValid = (_color: string): boolean => true;

export const splitByComma = (input: string): string[] => {
  // Split string by ',' but not by '\,'
  // let splitValues = input.split(/(?<!\\),/); // --> lookbehind not support in Safari for now
  // TODO This seems overly complex
  const dummy = '::::::tracker::::::';
  const temp = input.split('\\,').join(dummy);
  const splitValues = temp.split(',');
  for (let ind = 0; ind < splitValues.length; ind++)
    splitValues[ind] = splitValues[ind].split(dummy).join(',');

  return splitValues;
};

/**
 *
 * @param {string} name
 * @param {any} input
 * @param {number} numDataset
 * @param {boolean} defaultValue
 * @param {boolean} allowNoValidValue
 * @returns
 */
export const getBoolArrayFromInput = (
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any,
  numDataset: number,
  defaultValue: boolean,
  allowNoValidValue: boolean
): Array<boolean> => {
  const array: Array<boolean> = [];
  let numValidValue = 0;

  while (numDataset > array.length) array.push(defaultValue);

  if (typeof input === 'undefined' || input === null) {
    // all defaultValue
  } else if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      if (input.length > numDataset) throw new TooManyInputsError(name);

      if (input.length === 0) throw new EmptyArrayError(name);

      for (let ind = 0; ind < array.length; ind++) {
        if (ind < input.length) {
          let curr = input[ind];
          const prev = ind > 0 ? input[ind - 1].trim() : null;
          if (typeof curr === 'string') {
            curr = curr.trim();
            if (curr === '') {
              array[ind] = prev !== null ? prev : defaultValue;
            } else throw new InvalidInputError(name);
          } else if (typeof curr === 'boolean') {
            array[ind] = curr;
            numValidValue++;
          } else {
            throw new InvalidInputError(name);
          }
        } else {
          // Exceeds the length of input, use prev value
          const last = input[input.length - 1];
          array[ind] = numValidValue > 0 ? last : defaultValue;
        }
      }
    }
  } else if (typeof input === 'string') {
    const splitValues = splitByComma(input);
    if (splitValues.length > 1) {
      if (splitValues.length > numDataset) throw new TooManyInputsError(name);

      for (let ind = 0; ind < array.length; ind++) {
        if (ind < splitValues.length) {
          const curr = splitValues[ind].trim();
          const prev = ind > 0 ? strToBool(splitValues[ind - 1].trim()) : null;

          if (curr === '') {
            array[ind] = prev !== null ? prev : defaultValue;
          } else {
            const currBool = strToBool(curr);
            if (currBool === null) throw new InvalidInputError(name);
            array[ind] = currBool;
            numValidValue++;
          }
        } else {
          // Exceeds the length of input, use prev value
          const last = strToBool(splitValues[splitValues.length - 1].trim());
          array[ind] = numValidValue > 0 && last !== null ? last : defaultValue;
        }
      }
    } else if (input !== '') {
      const inputBool = strToBool(input);
      if (inputBool === null) throw new InvalidInputError(name);
      array[0] = inputBool;
      numValidValue++;
      for (let ind = 1; ind < array.length; ind++) array[ind] = inputBool;
    }
  } else if (typeof input === 'boolean') {
    array[0] = input;
    numValidValue++;
    for (let ind = 1; ind < array.length; ind++) array[ind] = input;
  } else throw new InvalidInputError(name);

  if (!allowNoValidValue && numValidValue === 0)
    throw new NoValidInputError(name);

  return array;
};

export const getNumberArrayFromInput = (
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any,
  numDataset: number,
  defaultValue: number,
  allowNoValidValue: boolean
): Array<number> => {
  const array: Array<number> = [];
  let numValidValue = 0;

  while (numDataset > array.length) {
    array.push(defaultValue);
  }

  if (typeof input === 'undefined' || input === null) {
    // all defaultValue
  } else if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      if (input.length > numDataset) throw new TooManyInputsError(name);
      if (input.length === 0) throw new EmptyArrayError(name);

      for (let ind = 0; ind < array.length; ind++) {
        if (ind >= input.length) {
          // Exceeds the length of input, use prev value
          const last = input[input.length - 1];
          array[ind] = numValidValue > 0 ? last : defaultValue;
          break;
        }
        let curr = input[ind];
        let prev = null;
        if (ind > 0) {
          prev = input[ind - 1].trim();
        }
        if (typeof curr === 'string') {
          curr = curr.trim();
          if (curr === '')
            if (prev !== null) {
              array[ind] = prev;
            } else {
              array[ind] = defaultValue;
            }
          else throw new InvalidInputError(name);
        } else if (typeof curr === 'number') {
          array[ind] = curr;
          numValidValue++;
        } else throw new InvalidInputError(name);
      }
    }
  } else if (typeof input === 'string') {
    const splitValues = splitByComma(input);
    if (splitValues.length > 1) {
      if (splitValues.length > numDataset) throw new TooManyInputsError(name);

      for (let ind = 0; ind < array.length; ind++) {
        if (ind < splitValues.length) {
          const curr = splitValues[ind].trim();
          let prev = null;
          if (ind > 0) {
            prev = NumberUtils.parseFloatFromAny(
              splitValues[ind - 1].trim()
            ).value;
          }
          if (curr === '') {
            array[ind] =
              prev !== null && Number.isNumber(prev) ? prev : defaultValue;
          } else {
            const value = NumberUtils.parseFloatFromAny(curr).value;
            if (value !== null) {
              array[ind] = value;
              numValidValue++;
            } else throw new InvalidInputError(name);
          }
        } else {
          // Exceeds the length of input, use prev value
          const last = NumberUtils.parseFloatFromAny(
            splitValues[input.length - 1].trim()
          ).value;
          array[ind] = numValidValue > 0 && last !== null ? last : defaultValue;
        }
      }
    } else if (input !== '') {
      const value = NumberUtils.parseFloatFromAny(input).value;
      if (value === null) throw new InvalidInputError(name);

      array[0] = value;
      numValidValue++;
      for (let ind = 1; ind < array.length; ind++) array[ind] = value;
    }
  } else if (typeof input === 'number') {
    if (!Number.isNumber(input)) throw new InvalidInputError(name);
    array[0] = input;
    numValidValue++;
    for (let ind = 1; ind < array.length; ind++) array[ind] = input;
  } else throw new InvalidInputError(name);

  if (!allowNoValidValue && numValidValue === 0)
    throw new NoValidInputError(name);

  return array;
};

export const getStringFromInput = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any,
  defaultValue: string
): string => {
  if (typeof input === 'string') return StringUtils.replaceImgTagByAlt(input);
  else if (typeof input === 'number') return input.toString();
  return defaultValue;
};

export const getStringArrayFromInput = (
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any,
  numDataset: number,
  defaultValue: string,

  // TODO Define signature type for validator
  // eslint-disable-next-line @typescript-eslint/ban-types
  validator: Function,
  allowNoValidValue: boolean
): Array<string> => {
  const array: Array<string> = [];
  let numValidValue = 0;

  while (numDataset > array.length) array.push(defaultValue);

  if (typeof input === 'undefined' || input === null) {
    // all defaultValue
  } else if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      if (input.length > numDataset) throw new TooManyInputsError(name);
      if (input.length === 0) throw new EmptyArrayError(name);

      for (let ind = 0; ind < array.length; ind++) {
        if (ind < input.length) {
          let curr = input[ind];
          const prev = ind > 0 ? input[ind - 1].trim() : null;

          if (typeof curr === 'string') {
            curr = curr.trim();
            if (curr === '') array[ind] = prev !== null ? prev : defaultValue;
            else if (validator && !validator(curr))
              throw new InvalidInputError(name);
            else {
              array[ind] = curr;
              numValidValue++;
            }
          } else throw new InvalidInputError(name);
        } else {
          // Exceeds the length of input, use prev value
          const last = input[input.length - 1].trim();
          array[ind] = numValidValue > 0 ? last : defaultValue;
        }
      }
    }
  } else if (typeof input === 'string') {
    const splitValues = splitByComma(input);
    if (splitValues.length > 1) {
      if (splitValues.length > numDataset) throw new TooManyInputsError(name);

      for (let ind = 0; ind < array.length; ind++) {
        if (ind < splitValues.length) {
          const curr = splitValues[ind].trim();
          let prev = null;
          if (ind > 0) prev = splitValues[ind - 1].trim();

          if (curr === '') array[ind] = prev !== null ? prev : defaultValue;
          else if (validator && !validator(curr))
            throw new InvalidInputError(name);
          else {
            array[ind] = curr;
            numValidValue++;
          }
        } else {
          // Exceeds the length of input, use prev value
          const last = splitValues[splitValues.length - 1].trim();
          array[ind] = numValidValue > 0 ? (array[ind] = last) : defaultValue;
        }
      }
    } else if (input !== '') {
      if (validator && !validator(input)) throw new InvalidInputError(name);

      array[0] = input;
      numValidValue++;
      for (let ind = 1; ind < array.length; ind++) array[ind] = input;
    }
  } else if (typeof input === 'number') {
    const strNumber = input.toString();
    if (validator && !validator(strNumber)) throw new InvalidInputError(name);

    array[0] = strNumber;
    numValidValue++;
    for (let ind = 1; ind < array.length; ind++) array[ind] = strNumber;
  } else {
    throw new InvalidInputError(name);
  }

  if (!allowNoValidValue && numValidValue === 0)
    throw new NoValidInputError(name);

  for (let ind = 0; ind < array.length; ind++) {
    array[ind] = StringUtils.replaceImgTagByAlt(array[ind]);
  }

  return array;
};

export const getNumberArray = (
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any
): Array<number> => {
  const numArray: Array<number> = [];

  if (typeof input === 'undefined' || input === null) return numArray;

  if (typeof input === 'object') {
    if (Array.isArray(input)) {
      for (const elem of input) {
        if (typeof elem === 'string') {
          const v = parseFloat(elem);
          if (Number.isNumber(v)) numArray.push(v);
          else throw new InvalidParameterError(name, Reason.ONLY_NUMBERS);
        }
      }
    }
  } else if (typeof input === 'string') {
    const splitValues = splitByComma(input);
    if (splitValues.length > 1) {
      for (const piece of splitValues) {
        const v = parseFloat(piece.trim());
        if (!Number.isNaN(v)) numArray.push(v);
        else throw new InvalidParameterError(name, Reason.ONLY_NUMBERS);
      }
    } else if (input === '') {
      throw new InvalidParameterError(name, Reason.EMPTY);
    } else {
      const v = parseFloat(input);
      if (Number.isNumber(v)) numArray.push(v);
      else throw new InvalidParameterError(name, Reason.ONLY_NUMBERS);
    }
  } else if (typeof input === 'number') {
    numArray.push(input);
  } else {
    throw new InvalidParameterError(name);
  }

  return numArray;
};

export const getStringArray = (
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any
): Array<string> => {
  const strArray: Array<string> = [];

  if (typeof input === 'undefined' || input === null) return strArray;

  if (typeof input === 'object') {
    if (Array.isArray(input)) {
      for (const elem of input) {
        if (typeof elem === 'string') {
          strArray.push(elem.trim());
        }
      }
    }
  } else if (typeof input === 'string') {
    const splitValues = splitByComma(input);
    if (splitValues.length > 1) {
      for (const piece of splitValues) {
        strArray.push(piece.trim());
      }
    } else if (input === '') {
      throw new TrackerError(`Empty ${name} is not allowed.`);
    } else {
      strArray.push(input);
    }
  } else {
    throw new TrackerError(`Invalid ${name}`);
  }
  for (let ind = 0; ind < strArray.length; ind++) {
    strArray[ind] = StringUtils.replaceImgTagByAlt(strArray[ind]);
  }
  return strArray;
};

export const parseCommonChartInfo = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yaml: any,
  renderInfo: CartesianChart
): void => {
  // single value, use default value if no value from YAML
  if (yaml) {
    // title
    renderInfo.title = getStringFromInput(yaml?.title, renderInfo.title);

    // xAxisLabel
    renderInfo.xAxisLabel = getStringFromInput(
      yaml.xAxisLabel,
      renderInfo.xAxisLabel
    );

    // xAxisColor
    renderInfo.xAxisColor = getStringFromInput(
      yaml.xAxisColor,
      renderInfo.xAxisColor
    );

    // xAxisLabelColor
    renderInfo.xAxisLabelColor = getStringFromInput(
      yaml.xAxisLabelColor,
      renderInfo.xAxisLabelColor
    );

    // allowInspectData
    if (typeof yaml.allowInspectData === 'boolean') {
      renderInfo.allowInspectData = yaml.allowInspectData;
    }

    // showLegend
    if (typeof yaml.showLegend === 'boolean') {
      renderInfo.showLegend = yaml.showLegend;
    }

    // legendPosition
    if (typeof yaml.legendPosition === 'string') {
      renderInfo.legendPosition = yaml.legendPosition;
    } else {
      renderInfo.legendPosition = 'bottom';
    }

    // legendOrient
    if (typeof yaml.legendOrientation === 'string') {
      renderInfo.legendOrientation = yaml.legendOrientation;
    } else {
      if (
        renderInfo.legendPosition === 'top' ||
        renderInfo.legendPosition === 'bottom'
      ) {
        renderInfo.legendOrientation = Orientation.HORIZONTAL;
      } else if (
        renderInfo.legendPosition === 'left' ||
        renderInfo.legendPosition === 'right'
      ) {
        renderInfo.legendOrientation = Orientation.VERTICAL;
      } else {
        renderInfo.legendOrientation = Orientation.HORIZONTAL;
      }
    }
    // legendBgColor
    renderInfo.legendBgColor = getStringFromInput(
      yaml.legendBgColor,
      renderInfo.legendBgColor
    );

    // legendBorderColor
    renderInfo.legendBorderColor = getStringFromInput(
      yaml.legendBorderColor,
      renderInfo.legendBorderColor
    );
  }

  // yAxisLabel
  const yAxisLabel = getStringArrayFromInput(
    'yAxisLabel',
    yaml?.yAxisLabel,
    2,
    'Value',
    null,
    true
  );

  if (yAxisLabel.length > 2)
    throw new TrackerError(
      'yAxisLabel accepts no more than two values for left and right y-axes'
    );

  renderInfo.yAxisLabel = yAxisLabel;
  // yAxisColor
  const yAxisColor = getStringArrayFromInput(
    'yAxisColor',
    yaml?.yAxisColor,
    2,
    '',
    isColorValid,
    true
  );

  if (yAxisColor.length > 2)
    throw new TrackerError(
      'yAxisColor accepts no more than two values for left and right y-axes'
    );

  renderInfo.yAxisColor = yAxisColor;
  // yAxisLabelColor
  const yAxisLabelColor = getStringArrayFromInput(
    'yAxisLabelColor',
    yaml?.yAxisLabelColor,
    2,
    '',
    isColorValid,
    true
  );

  if (yAxisLabelColor.length > 2)
    throw new TrackerError(
      'yAxisLabelColor accepts no more than two values for left and right y-axes'
    );

  renderInfo.yAxisLabelColor = yAxisLabelColor;
  // yAxisUnit
  const yAxisUnit = getStringArrayFromInput(
    'yAxisUnit',
    yaml?.yAxisUnit,
    2,
    '',
    null,
    true
  );

  if (yAxisUnit.length > 2) {
    throw new TrackerError(
      'yAxisUnit accepts no more than two values for left and right y-axes'
    );
  }
  renderInfo.yAxisUnit = yAxisUnit;
  // xAxisTickInterval
  renderInfo.xAxisTickInterval = getStringFromInput(
    yaml?.xAxisTickInterval,
    renderInfo.xAxisTickInterval
  );
  // yAxisTickInterval
  const yAxisTickInterval = getStringArrayFromInput(
    'yAxisTickInterval',
    yaml?.yAxisTickInterval,
    2,
    null,
    null,
    true
  );

  if (yAxisTickInterval.length > 2) {
    throw new TrackerError(
      'yAxisTickInterval accepts no more than two values for left and right y-axes'
    );
  }
  renderInfo.yAxisTickInterval = yAxisTickInterval;
  // xAxisTickLabelFormat
  renderInfo.xAxisTickLabelFormat = getStringFromInput(
    yaml?.xAxisTickLabelFormat,
    renderInfo.xAxisTickLabelFormat
  );
  // yAxisTickLabelFormat
  const yAxisTickLabelFormat = getStringArrayFromInput(
    'yAxisTickLabelFormat',
    yaml?.yAxisTickLabelFormat,
    2,
    null,
    null,
    true
  );

  if (yAxisTickLabelFormat.length > 2) {
    throw new TrackerError(
      'yAxisTickLabelFormat accepts no more than two values for left and right y-axes'
    );
  }
  renderInfo.yAxisTickLabelFormat = yAxisTickLabelFormat;
  // yMin
  const yMin = getNumberArrayFromInput('yMin', yaml?.yMin, 2, null, true);

  if (yMin.length > 2) {
    throw new TrackerError(
      'yMin accepts no more than two values for left and right y-axes'
    );
  }
  renderInfo.yMin = yMin;
  // yMax
  const yMax = getNumberArrayFromInput('yMax', yaml?.yMax, 2, null, true);

  if (yMax.length > 2) {
    throw new TrackerError(
      'yMax accepts no more than two values for left and right y-axes'
    );
  }
  renderInfo.yMax = yMax;
  // reverseYAxis
  const reverseYAxis = getBoolArrayFromInput(
    'reverseYAxis',
    yaml?.reverseYAxis,
    2,
    false,
    true
  );

  if (reverseYAxis.length > 2) {
    throw new TrackerError(
      'reverseYAxis accepts no more than two values for left and right y-axes'
    );
  }
  renderInfo.reverseYAxis = reverseYAxis;
};

export const getKeys = (obj: object): string[] =>
  obj !== null ? Object.keys(obj) : [];

export const validateYamlKeys = (
  keys: string[],
  renderInfoKeys: string[],
  allowedKeys: string[]
): void => {
  keys.forEach((key): void => {
    if (!renderInfoKeys.includes(key) && !allowedKeys.includes(key))
      throw new TrackerError(`'${key}' is not an available key`);
  });
};
