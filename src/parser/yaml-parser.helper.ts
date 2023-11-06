import { ArrayError, InputMismatchError, ValueError } from '../errors';
import { SearchTypeValues, YAxisLocationValues } from '../models/enums';
import { CartesianChart } from '../ui-components/chart/cartesian-chart.model';
import { StringUtils } from '../utils';
import * as helper from '../utils/helper';

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
export const validateColor = (_color: string): boolean => true;

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
 * @summary Returns a boolean array from the provided input property
 * @param {string} name
 * @param {any} input
 * @param {number} numDataset
 * @param {boolean} defaultValue
 * @param {boolean} allowNoValidValue
 * @returns {boolean[]}
 */
export const getBooleans = (
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any,
  numDataset: number,
  defaultValue: boolean,
  allowNoValidValue: boolean
): Array<boolean> | string => {
  const array: Array<boolean> = [];
  let errorMessage = '';
  let numValidValue = 0;

  while (numDataset > array.length) {
    array.push(defaultValue);
  }

  if (typeof input === 'undefined' || input === null) {
    // all defaultValue
  } else if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      if (input.length > numDataset) {
        errorMessage = "Too many inputs for parameter '" + name + "'";
        return errorMessage;
      }
      if (input.length === 0) {
        errorMessage = 'Empty array not allowed for ' + name;
        return errorMessage;
      }
      for (let ind = 0; ind < array.length; ind++) {
        if (ind < input.length) {
          let curr = input[ind];
          let prev = null;
          if (ind > 0) {
            prev = input[ind - 1].trim();
          }
          if (typeof curr === 'string') {
            curr = curr.trim();
            if (curr === '') {
              if (prev !== null) {
                array[ind] = prev;
              } else {
                array[ind] = defaultValue;
              }
            } else {
              errorMessage = 'Invalid inputs for ' + name;
              break;
            }
          } else if (typeof curr === 'boolean') {
            array[ind] = curr;
            numValidValue++;
          } else {
            errorMessage = 'Invalid inputs for ' + name;
            break;
          }
        } else {
          // Exceeds the length of input, use prev value
          const last = input[input.length - 1];
          if (numValidValue > 0) {
            array[ind] = last;
          } else {
            array[ind] = defaultValue;
          }
        }
      }
    }
  } else if (typeof input === 'string') {
    const splitted = splitByComma(input);
    if (splitted.length > 1) {
      if (splitted.length > numDataset) {
        errorMessage = "Too many inputs for parameter '" + name + "'";
        return errorMessage;
      }
      for (let ind = 0; ind < array.length; ind++) {
        if (ind < splitted.length) {
          const curr = splitted[ind].trim();
          let prev = null;
          if (ind > 0) {
            prev = StringUtils.toBool(splitted[ind - 1].trim());
          }
          if (curr === '') {
            if (prev !== null) {
              array[ind] = prev;
            } else {
              array[ind] = defaultValue;
            }
          } else {
            const currBool = StringUtils.toBool(curr);
            if (currBool !== null) {
              array[ind] = currBool;
              numValidValue++;
            } else {
              errorMessage = 'Invalid inputs for ' + name;
              break;
            }
          }
        } else {
          // Exceeds the length of input, use prev value
          const last = StringUtils.toBool(splitted[splitted.length - 1].trim());
          if (numValidValue > 0 && last !== null) {
            array[ind] = last;
          } else {
            array[ind] = defaultValue;
          }
        }
      }
    } else {
      if (input === '') {
        // all defaultValue
      } else {
        const inputBool = StringUtils.toBool(input);
        if (inputBool !== null) {
          array[0] = inputBool;
          numValidValue++;
          for (let ind = 1; ind < array.length; ind++) {
            array[ind] = inputBool;
          }
        } else {
          errorMessage = 'Invalid inputs for ' + name;
        }
      }
    }
  } else if (typeof input === 'boolean') {
    array[0] = input;
    numValidValue++;
    for (let ind = 1; ind < array.length; ind++) {
      array[ind] = input;
    }
  } else {
    errorMessage = 'Invalid inputs for ' + name;
  }

  if (!allowNoValidValue && numValidValue === 0) {
    errorMessage = 'No valid input for ' + name;
  }

  if (errorMessage !== '') {
    return errorMessage;
  }

  return array;
};

/**
 * @summary Returns a number array from the provided input property
 * @param {string} name The name of the property in the tracker block
 * @param {any} input The value of the named property
 * @param {number} itemCount The number of items that should be found in the input string
 * @param {number} defaultValue Default values for every item in the array
 * @returns {number[]}
 */
export const getNumbers = (
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any,
  numDataset: number,
  defaultValue: number,
  allowNoValidValue: boolean
): Array<number> | string => {
  // console.log("getNumberArrayFromInput");
  const array: Array<number> = [];
  let errorMessage = '';
  let numValidValue = 0;

  while (numDataset > array.length) {
    array.push(defaultValue);
  }

  if (typeof input === 'undefined' || input === null) {
    // all defaultValue
  } else if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      if (input.length > numDataset) {
        errorMessage = "Too many inputs for parameter '" + name + "'";
        return errorMessage;
      }
      if (input.length === 0) {
        errorMessage = 'Empty array not allowed for ' + name;
        return errorMessage;
      }
      for (let ind = 0; ind < array.length; ind++) {
        if (ind < input.length) {
          let curr = input[ind];
          let prev = null;
          if (ind > 0) {
            prev = input[ind - 1].trim();
          }
          if (typeof curr === 'string') {
            curr = curr.trim();
            if (curr === '') {
              if (prev !== null) {
                array[ind] = prev;
              } else {
                array[ind] = defaultValue;
              }
            } else {
              errorMessage = 'Invalid inputs for ' + name;
              break;
            }
          } else if (typeof curr === 'number') {
            array[ind] = curr;
            numValidValue++;
          } else {
            errorMessage = 'Invalid inputs for ' + name;
            break;
          }
        } else {
          // Exceeds the length of input, use prev value
          const last = input[input.length - 1];
          if (numValidValue > 0) {
            array[ind] = last;
          } else {
            array[ind] = defaultValue;
          }
        }
      }
    }
  } else if (typeof input === 'string') {
    const splitted = splitByComma(input);
    if (splitted.length > 1) {
      if (splitted.length > numDataset) {
        errorMessage = "Too many inputs for parameter '" + name + "'";
        return errorMessage;
      }
      for (let ind = 0; ind < array.length; ind++) {
        if (ind < splitted.length) {
          const curr = splitted[ind].trim();
          let prev = null;
          if (ind > 0) {
            prev = helper.parseFloatFromAny(splitted[ind - 1].trim()).value;
          }
          if (curr === '') {
            if (prev !== null && Number.isNumber(prev)) {
              array[ind] = prev;
            } else {
              array[ind] = defaultValue;
            }
          } else {
            const currNum = helper.parseFloatFromAny(curr).value;
            if (currNum !== null) {
              array[ind] = currNum;
              numValidValue++;
            } else {
              errorMessage = 'Invalid inputs for ' + name;
              break;
            }
          }
        } else {
          // Exceeds the length of input, use prev value
          const last = helper.parseFloatFromAny(
            splitted[input.length - 1].trim()
          ).value;
          if (numValidValue > 0 && last !== null) {
            array[ind] = last;
          } else {
            array[ind] = defaultValue;
          }
        }
      }
    } else {
      if (input === '') {
        // all defaultValue
      } else {
        const inputNum = helper.parseFloatFromAny(input).value;
        if (inputNum !== null) {
          array[0] = inputNum;
          numValidValue++;
          for (let ind = 1; ind < array.length; ind++) {
            array[ind] = inputNum;
          }
        } else {
          errorMessage = 'Invalid inputs for ' + name;
        }
      }
    }
  } else if (typeof input === 'number') {
    if (Number.isNumber(input)) {
      array[0] = input;
      numValidValue++;
      for (let ind = 1; ind < array.length; ind++) {
        array[ind] = input;
      }
    } else {
      errorMessage = 'Invalid inputs for ' + name;
    }
  } else {
    errorMessage = 'Invalid inputs for ' + name;
  }

  if (!allowNoValidValue && numValidValue === 0) {
    errorMessage = 'No valid input for ' + name;
  }

  if (errorMessage !== '') {
    return errorMessage;
  }

  return array;
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
  if (typeof input === 'string') {
    return helper.replaceImgTagByAlt(input);
  } else if (typeof input === 'number') {
    return input.toString();
  }
  return defaultValue;
};

/**
 * @summary Returns a string array from the provided input property
 * @param {string} name
 * @param {object | string | number} input
 * @param {number} numDataset
 * @param {string} defaultValue
 * @param {Function} validator
 * @param {boolean} allowNoValidValue
 * @returns
 */
export const getStrings = <T extends object | string | number>(
  name: string,
  input: T,
  datasetCount: number,
  defaultValue: string,

  // TODO Define signature type for validator
  // eslint-disable-next-line @typescript-eslint/ban-types
  validator: Function,
  allowNoValidValue: boolean
): Array<string> => {
  const array: Array<string> = [];
  let validValueCount = 0;

  while (datasetCount > array.length) array.push(defaultValue);

  if (typeof input === 'undefined' || input === null) {
    // all defaultValue
  } else if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      if (input.length > datasetCount) throw new InputMismatchError(name);
      if (input.length === 0) throw new ArrayError(name);

      array.forEach((_item, index) => {
        if (index < input.length) {
          let curr = input[index];
          const prev = index > 0 ? input[index - 1].trim() : null;

          if (typeof curr === 'string') {
            curr = curr.trim();
            if (curr === '') array[index] = prev !== null ? prev : defaultValue;
            else if (validator && !validator(curr)) throw new ValueError(name);
            else {
              array[index] = curr;
              validValueCount++;
            }
          } else throw new ValueError(name);
        } else {
          // Exceeds the length of input, use prev value
          array[index] =
            validValueCount > 0 ? input[input.length - 1].trim() : defaultValue;
        }
      });
    }
  } else if (typeof input === 'string') {
    const splitValues = splitByComma(input);
    if (splitValues.length > 1) {
      if (splitValues.length > datasetCount) throw new InputMismatchError(name);

      for (let ind = 0; ind < array.length; ind++) {
        if (ind < splitValues.length) {
          const curr = splitValues[ind].trim();
          let prev = null;
          if (ind > 0) prev = splitValues[ind - 1].trim();

          if (curr === '') array[ind] = prev !== null ? prev : defaultValue;
          else if (validator && !validator(curr)) throw new ValueError(name);
          else {
            array[ind] = curr;
            validValueCount++;
          }
        } else {
          // Exceeds the length of input, use prev value
          const last = splitValues[splitValues.length - 1].trim();
          array[ind] = validValueCount > 0 ? (array[ind] = last) : defaultValue;
        }
      }
    } else if (input !== '') {
      if (validator && !validator(input)) throw new ValueError(name);

      array[0] = input;
      validValueCount++;
      for (let ind = 1; ind < array.length; ind++) array[ind] = input;
    }
  } else if (typeof input === 'number') {
    const strNumber = input.toString();
    if (validator && !validator(strNumber)) throw new ValueError(name);

    array[0] = strNumber;
    validValueCount++;
    for (let ind = 1; ind < array.length; ind++) array[ind] = strNumber;
  } else throw new ValueError(name);

  if (!allowNoValidValue && validValueCount === 0) throw new ValueError(name);
  array.forEach(
    (elem, i) => (array[i] = StringUtils.replaceImgTagByAlt(array[i]))
  );

  return array;
};

export const getNumberArray = (
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any
): Array<number> | string => {
  const numArray: Array<number> = [];

  if (typeof input === 'undefined' || input === null) return numArray;

  if (typeof input === 'object') {
    if (Array.isArray(input)) {
      for (const elem of input) {
        if (typeof elem === 'string') {
          const v = parseFloat(elem);
          if (Number.isNumber(v)) {
            numArray.push(v);
          } else {
            const errorMessage = `Parameter '${name}' accepts only numbers`;
            return errorMessage;
          }
        }
      }
    }
  } else if (typeof input === 'string') {
    const splitted = splitByComma(input);
    if (splitted.length > 1) {
      for (const piece of splitted) {
        const v = parseFloat(piece.trim());
        if (!Number.isNaN(v)) {
          // Number.isNumber(NaN) --> true
          numArray.push(v);
        } else {
          const errorMessage = `Parameter '${name}' accepts only numbers`;
          return errorMessage;
        }
      }
    } else if (input === '') {
      const errorMessage = `Empty ${name} is not allowed.`;
      return errorMessage;
    } else {
      const v = parseFloat(input);
      if (Number.isNumber(v)) {
        numArray.push(v);
      } else {
        const errorMessage = `Parameter '${name}' accepts only numbers`;
        return errorMessage;
      }
    }
  } else if (typeof input === 'number') {
    numArray.push(input);
  } else {
    const errorMessage = `Invalid ${name}`;
    return errorMessage;
  }

  return numArray;
};

export const getStringArray = (
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any
): Array<string> | string => {
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
    const splitted = splitByComma(input);
    // console.log(splitted);
    if (splitted.length > 1) {
      for (const piece of splitted) {
        strArray.push(piece.trim());
      }
    } else if (input === '') {
      const errorMessage = `Empty ${name} is not allowed.`;
      return errorMessage;
    } else {
      strArray.push(input);
    }
  } else {
    const errorMessage = `Invalid ${name}`;
    return errorMessage;
  }

  for (let ind = 0; ind < strArray.length; ind++) {
    strArray[ind] = helper.replaceImgTagByAlt(strArray[ind]);
  }

  return strArray;
};

export const parseCartesianChartInfo = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yaml: any,
  renderInfo: CartesianChart
): string => {
  // console.log("parseCommonChartInfo");
  // single value, use default value if no value from YAML
  if (yaml) {
    // title
    renderInfo.title = getString(yaml?.title, renderInfo.title);

    // xAxisLabel
    renderInfo.xAxisLabel = getString(yaml?.xAxisLabel, renderInfo.xAxisLabel);

    // xAxisColor
    renderInfo.xAxisColor = getString(yaml?.xAxisColor, renderInfo.xAxisColor);

    // xAxisLabelColor
    renderInfo.xAxisLabelColor = getString(
      yaml?.xAxisLabelColor,
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
        renderInfo.legendOrientation = 'horizontal';
      } else if (
        renderInfo.legendPosition === 'left' ||
        renderInfo.legendPosition === 'right'
      ) {
        renderInfo.legendOrientation = 'vertical';
      } else {
        renderInfo.legendOrientation = 'horizontal';
      }
    }
    // console.log(renderInfo.legendPosition);
    // console.log(renderInfo.legendOrientation);
    // legendBgColor
    renderInfo.legendBgColor = getString(
      yaml?.legendBgColor,
      renderInfo.legendBgColor
    );

    // legendBorderColor
    renderInfo.legendBorderColor = getString(
      yaml?.legendBorderColor,
      renderInfo.legendBorderColor
    );
  }

  // yAxisLabel
  const retYAxisLabel = getStrings(
    'yAxisLabel',
    yaml?.yAxisLabel,
    2,
    'Value',
    null,
    true
  );
  if (typeof retYAxisLabel === 'string') {
    return retYAxisLabel; // errorMessage
  }
  if (retYAxisLabel.length > 2) {
    return 'yAxisLabel accepts not more than two values for left and right y-axes';
  }
  renderInfo.yAxisLabel = retYAxisLabel;
  // console.log(renderInfo.yAxisLabel);
  // yAxisColor
  const retYAxisColor = getStrings(
    'yAxisColor',
    yaml?.yAxisColor,
    2,
    '',
    validateColor,
    true
  );
  if (typeof retYAxisColor === 'string') {
    return retYAxisColor; // errorMessage
  }
  if (retYAxisColor.length > 2) {
    return 'yAxisColor accepts not more than two values for left and right y-axes';
  }
  renderInfo.yAxisColor = retYAxisColor;
  // console.log(renderInfo.yAxisColor);
  // yAxisLabelColor
  const retYAxisLabelColor = getStrings(
    'yAxisLabelColor',
    yaml?.yAxisLabelColor,
    2,
    '',
    validateColor,
    true
  );
  if (typeof retYAxisLabelColor === 'string') {
    return retYAxisLabelColor; // errorMessage
  }
  if (retYAxisLabelColor.length > 2) {
    return 'yAxisLabelColor accepts not more than two values for left and right y-axes';
  }
  renderInfo.yAxisLabelColor = retYAxisLabelColor;
  // console.log(renderInfo.yAxisLabelColor);
  // yAxisUnit
  const retYAxisUnit = getStrings(
    'yAxisUnit',
    yaml?.yAxisUnit,
    2,
    '',
    null,
    true
  );
  if (typeof retYAxisUnit === 'string') {
    return retYAxisUnit; // errorMessage
  }
  if (retYAxisUnit.length > 2) {
    return 'yAxisUnit accepts not more than two values for left and right y-axes';
  }
  renderInfo.yAxisUnit = retYAxisUnit;
  // console.log(renderInfo.yAxisUnit);
  // xAxisTickInterval
  renderInfo.xAxisTickInterval = getString(
    yaml?.xAxisTickInterval,
    renderInfo.xAxisTickInterval
  );
  // console.log(renderInfo.xAxisTickInterval);
  // yAxisTickInterval
  const retYAxisTickInterval = getStrings(
    'yAxisTickInterval',
    yaml?.yAxisTickInterval,
    2,
    null,
    null,
    true
  );
  if (typeof retYAxisTickInterval === 'string') {
    return retYAxisTickInterval; // errorMessage
  }
  if (retYAxisTickInterval.length > 2) {
    return 'yAxisTickInterval accepts not more than two values for left and right y-axes';
  }
  renderInfo.yAxisTickInterval = retYAxisTickInterval;
  // console.log(renderInfo.yAxisTickInterval);
  // xAxisTickLabelFormat
  renderInfo.xAxisTickLabelFormat = getString(
    yaml?.xAxisTickLabelFormat,
    renderInfo.xAxisTickLabelFormat
  );
  // console.log(renderInfo.xAxisTickLabelFormat);
  // yAxisTickLabelFormat
  const retYAxisTickLabelFormat = getStrings(
    'yAxisTickLabelFormat',
    yaml?.yAxisTickLabelFormat,
    2,
    null,
    null,
    true
  );
  if (typeof retYAxisTickLabelFormat === 'string') {
    return retYAxisTickLabelFormat; // errorMessage
  }
  if (retYAxisTickLabelFormat.length > 2) {
    return 'yAxisTickLabelFormat accepts not more than two values for left and right y-axes';
  }
  renderInfo.yAxisTickLabelFormat = retYAxisTickLabelFormat;
  // console.log(renderInfo.yAxisTickLabelFormat);
  // yMin
  const retYMin = getNumbers('yMin', yaml?.yMin, 2, null, true);
  if (typeof retYMin === 'string') {
    return retYMin; // errorMessage
  }
  if (retYMin.length > 2) {
    return 'yMin accepts not more than two values for left and right y-axes';
  }
  renderInfo.yMin = retYMin;
  // console.log(renderInfo.yMin);
  // yMax
  const retYMax = getNumbers('yMax', yaml?.yMax, 2, null, true);
  if (typeof retYMax === 'string') {
    return retYMax; // errorMessage
  }
  if (retYMax.length > 2) {
    return 'yMax accepts not more than two values for left and right y-axes';
  }
  renderInfo.yMax = retYMax;
  // console.log(renderInfo.yMax);
  // reverseYAxis
  const retReverseYAxis = getBooleans(
    'reverseYAxis',
    yaml?.reverseYAxis,
    2,
    false,
    true
  );
  if (typeof retReverseYAxis === 'string') {
    return retReverseYAxis; // errorMessage
  }
  if (retReverseYAxis.length > 2) {
    return 'reverseYAxis accepts not more than two values for left and right y-axes';
  }
  renderInfo.reverseYAxis = retReverseYAxis;
  // console.log(renderInfo.reverseYAxis);
};

export const getAvailableKeysOfClass = (obj: object): string[] => {
  const keys: string[] = [];
  if (obj !== null) {
    const objectKeys = Object.keys(obj) as Array<keyof string>;
    for (const key of objectKeys) {
      keys.push(key.toString());
    }
  }
  return keys;
};
