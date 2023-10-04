import { BaseChart } from '../models/base-chart';
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
export const validateSearchType = (searchType: string): boolean => {
  // TODO Refactor this using an array of valid search types
  if (
    searchType.toLowerCase() === 'tag' ||
    searchType.toLowerCase() === 'text' ||
    searchType.toLowerCase() === 'frontmatter' ||
    searchType.toLowerCase() === 'wiki' ||
    searchType.toLowerCase() === 'wiki.link' ||
    searchType.toLowerCase() === 'wiki.display' ||
    searchType.toLowerCase() === 'dvfield' ||
    searchType.toLowerCase() === 'table' ||
    searchType.toLowerCase() === 'filemeta' ||
    searchType.toLowerCase() === 'task' ||
    searchType.toLowerCase() === 'task.all' ||
    searchType.toLowerCase() === 'task.done' ||
    searchType.toLowerCase() === 'task.notdone'
  ) {
    return true;
  }
  return false;
};

export const validateYAxisLocation = (location: string): boolean => {
  return location === 'left' || location === 'right' || location === 'none'
    ? true
    : false;
};

// TODO Why does this function exist?
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const validateColor = (_color: string): boolean => true;

export const splitInputByComma = (input: string): string[] => {
  // Split string by ',' but not by '\,'
  // let splitValues = input.split(/(?<!\\),/); // --> lookbehind not support in Safari for now
  // TODO This seems overly complex
  const dummy = '::::::tracker::::::';
  const temp = input.split('\\,').join(dummy);
  const splitValues = temp.split(',');
  for (let ind = 0; ind < splitValues.length; ind++) {
    splitValues[ind] = splitValues[ind].split(dummy).join(',');
  }
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
): Array<boolean> | string => {
  const array: Array<boolean> = [];
  let errorMessage = '';
  let numValidValue = 0;

  while (numDataset > array.length) array.push(defaultValue);

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
          const prev = ind > 0 ? input[ind - 1].trim() : null;
          if (typeof curr === 'string') {
            curr = curr.trim();
            if (curr === '') {
              array[ind] = prev !== null ? prev : defaultValue;
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
    const splitValues = splitInputByComma(input);
    if (splitValues.length > 1) {
      if (splitValues.length > numDataset) {
        errorMessage = "Too many inputs for parameter '" + name + "'";
        return errorMessage;
      }
      for (let ind = 0; ind < array.length; ind++) {
        if (ind < splitValues.length) {
          const curr = splitValues[ind].trim();
          const prev = ind > 0 ? strToBool(splitValues[ind - 1].trim()) : null;

          if (curr === '') {
            array[ind] = prev !== null ? prev : defaultValue;
          } else {
            const currBool = strToBool(curr);
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
          const last = strToBool(splitValues[splitValues.length - 1].trim());
          array[ind] = numValidValue > 0 && last !== null ? last : defaultValue;
        }
      }
    } else {
      if (input === '') {
        // all defaultValue
      } else {
        const inputBool = strToBool(input);
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

  return errorMessage === '' ? array : errorMessage;
};

export const getNumberArrayFromInput = (
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
          array[ind] = numValidValue > 0 ? last : defaultValue;
        }
      }
    }
  } else if (typeof input === 'string') {
    const splitValues = splitInputByComma(input);
    if (splitValues.length > 1) {
      if (splitValues.length > numDataset) {
        errorMessage = "Too many inputs for parameter '" + name + "'";
        return errorMessage;
      }
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
            const currNum = NumberUtils.parseFloatFromAny(curr).value;
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
          const last = NumberUtils.parseFloatFromAny(
            splitValues[input.length - 1].trim()
          ).value;
          array[ind] = numValidValue > 0 && last !== null ? last : defaultValue;
        }
      }
    } else {
      if (input === '') {
        // all defaultValue
      } else {
        const inputNum = NumberUtils.parseFloatFromAny(input).value;
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

  if (!allowNoValidValue && numValidValue === 0)
    errorMessage = 'No valid input for ' + name;

  if (errorMessage !== '') return errorMessage;

  return array;
};

export const getStringFromInput = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any,
  defaultValue: string
): string => {
  if (typeof input === 'string') {
    return StringUtils.replaceImgTagByAlt(input);
  } else if (typeof input === 'number') {
    return input.toString();
  }
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
): Array<string> | string => {
  const array: Array<string> = [];
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
              if (validator) {
                if (validator(curr)) {
                  array[ind] = curr;
                  numValidValue++;
                } else {
                  errorMessage = 'Invalid inputs for ' + name;
                  break;
                }
              } else {
                array[ind] = curr;
                numValidValue++;
              }
            }
          } else {
            errorMessage = 'Invalid inputs for ' + name;
            break;
          }
        } else {
          // Exceeds the length of input, use prev value
          const last = input[input.length - 1].trim();
          if (numValidValue > 0) {
            array[ind] = last;
          } else {
            array[ind] = defaultValue;
          }
        }
      }
    }
  } else if (typeof input === 'string') {
    const splitValues = splitInputByComma(input);
    if (splitValues.length > 1) {
      if (splitValues.length > numDataset) {
        errorMessage = "Too many inputs for parameter '" + name + "'";
        return errorMessage;
      }
      for (let ind = 0; ind < array.length; ind++) {
        if (ind < splitValues.length) {
          const curr = splitValues[ind].trim();
          let prev = null;
          if (ind > 0) {
            prev = splitValues[ind - 1].trim();
          }
          if (curr === '') {
            if (prev !== null) {
              array[ind] = prev;
            } else {
              array[ind] = defaultValue;
            }
          } else {
            if (validator) {
              if (validator(curr)) {
                array[ind] = curr;
                numValidValue++;
              } else {
                errorMessage = 'Invalid inputs for ' + name;
                break;
              }
            } else {
              array[ind] = curr;
              numValidValue++;
            }
          }
        } else {
          // Exceeds the length of input, use prev value
          const last = splitValues[splitValues.length - 1].trim();
          if (numValidValue > 0) {
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
        if (validator) {
          if (validator(input)) {
            array[0] = input;
            numValidValue++;
            for (let ind = 1; ind < array.length; ind++) {
              array[ind] = input;
            }
          } else {
            errorMessage = 'Invalid inputs for ' + name;
          }
        } else {
          array[0] = input;
          numValidValue++;
          for (let ind = 1; ind < array.length; ind++) {
            array[ind] = input;
          }
        }
      }
    }
  } else if (typeof input === 'number') {
    const strNumber = input.toString();
    if (validator) {
      if (validator(strNumber)) {
        array[0] = strNumber;
        numValidValue++;
        for (let ind = 1; ind < array.length; ind++) {
          array[ind] = strNumber;
        }
      } else {
        errorMessage = 'Invalid inputs for ' + name;
      }
    } else {
      array[0] = strNumber;
      numValidValue++;
      for (let ind = 1; ind < array.length; ind++) {
        array[ind] = strNumber;
      }
    }
  } else {
    errorMessage = 'Invalid inputs for ' + name;
  }

  if (!allowNoValidValue && numValidValue === 0) {
    errorMessage = 'No valid input for ' + name;
  }

  if (errorMessage !== '') return errorMessage;

  for (let ind = 0; ind < array.length; ind++) {
    array[ind] = StringUtils.replaceImgTagByAlt(array[ind]);
  }

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
    const splitValues = splitInputByComma(input);
    if (splitValues.length > 1) {
      for (const piece of splitValues) {
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
    const splitValues = splitInputByComma(input);
    // console.log(splitValues);
    if (splitValues.length > 1) {
      for (const piece of splitValues) {
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
    strArray[ind] = StringUtils.replaceImgTagByAlt(strArray[ind]);
  }

  return strArray;
};

export const parseCommonChartInfo = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yaml: any,
  renderInfo: BaseChart
): string => {
  // console.log("parseCommonChartInfo");
  // single value, use default value if no value from YAML
  if (yaml) {
    // title
    renderInfo.title = getStringFromInput(yaml?.title, renderInfo.title);

    // xAxisLabel
    renderInfo.xAxisLabel = getStringFromInput(
      yaml?.xAxisLabel,
      renderInfo.xAxisLabel
    );

    // xAxisColor
    renderInfo.xAxisColor = getStringFromInput(
      yaml?.xAxisColor,
      renderInfo.xAxisColor
    );

    // xAxisLabelColor
    renderInfo.xAxisLabelColor = getStringFromInput(
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
    renderInfo.legendBgColor = getStringFromInput(
      yaml?.legendBgColor,
      renderInfo.legendBgColor
    );

    // legendBorderColor
    renderInfo.legendBorderColor = getStringFromInput(
      yaml?.legendBorderColor,
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
  if (typeof yAxisLabel === 'string') {
    return yAxisLabel; // errorMessage
  }
  if (yAxisLabel.length > 2) {
    return 'yAxisLabel accepts not more than two values for left and right y-axes';
  }
  renderInfo.yAxisLabel = yAxisLabel;
  // console.log(renderInfo.yAxisLabel);
  // yAxisColor
  const yAxisColor = getStringArrayFromInput(
    'yAxisColor',
    yaml?.yAxisColor,
    2,
    '',
    validateColor,
    true
  );
  if (typeof yAxisColor === 'string') {
    return yAxisColor; // errorMessage
  }
  if (yAxisColor.length > 2) {
    return 'yAxisColor accepts not more than two values for left and right y-axes';
  }
  renderInfo.yAxisColor = yAxisColor;
  // console.log(renderInfo.yAxisColor);
  // yAxisLabelColor
  const yAxisLabelColor = getStringArrayFromInput(
    'yAxisLabelColor',
    yaml?.yAxisLabelColor,
    2,
    '',
    validateColor,
    true
  );
  if (typeof yAxisLabelColor === 'string') {
    return yAxisLabelColor; // errorMessage
  }
  if (yAxisLabelColor.length > 2) {
    return 'yAxisLabelColor accepts not more than two values for left and right y-axes';
  }
  renderInfo.yAxisLabelColor = yAxisLabelColor;
  // console.log(renderInfo.yAxisLabelColor);
  // yAxisUnit
  const yAxisUnit = getStringArrayFromInput(
    'yAxisUnit',
    yaml?.yAxisUnit,
    2,
    '',
    null,
    true
  );
  if (typeof yAxisUnit === 'string') {
    return yAxisUnit; // errorMessage
  }
  if (yAxisUnit.length > 2) {
    return 'yAxisUnit accepts not more than two values for left and right y-axes';
  }
  renderInfo.yAxisUnit = yAxisUnit;
  // console.log(renderInfo.yAxisUnit);
  // xAxisTickInterval
  renderInfo.xAxisTickInterval = getStringFromInput(
    yaml?.xAxisTickInterval,
    renderInfo.xAxisTickInterval
  );
  // console.log(renderInfo.xAxisTickInterval);
  // yAxisTickInterval
  const yAxisTickInterval = getStringArrayFromInput(
    'yAxisTickInterval',
    yaml?.yAxisTickInterval,
    2,
    null,
    null,
    true
  );
  if (typeof yAxisTickInterval === 'string') {
    return yAxisTickInterval; // errorMessage
  }
  if (yAxisTickInterval.length > 2) {
    return 'yAxisTickInterval accepts not more than two values for left and right y-axes';
  }
  renderInfo.yAxisTickInterval = yAxisTickInterval;
  // console.log(renderInfo.yAxisTickInterval);
  // xAxisTickLabelFormat
  renderInfo.xAxisTickLabelFormat = getStringFromInput(
    yaml?.xAxisTickLabelFormat,
    renderInfo.xAxisTickLabelFormat
  );
  // console.log(renderInfo.xAxisTickLabelFormat);
  // yAxisTickLabelFormat
  const yAxisTickLabelFormat = getStringArrayFromInput(
    'yAxisTickLabelFormat',
    yaml?.yAxisTickLabelFormat,
    2,
    null,
    null,
    true
  );
  if (typeof yAxisTickLabelFormat === 'string') {
    return yAxisTickLabelFormat; // errorMessage
  }
  if (yAxisTickLabelFormat.length > 2) {
    return 'yAxisTickLabelFormat accepts not more than two values for left and right y-axes';
  }
  renderInfo.yAxisTickLabelFormat = yAxisTickLabelFormat;
  // console.log(renderInfo.yAxisTickLabelFormat);
  // yMin
  const yMin = getNumberArrayFromInput('yMin', yaml?.yMin, 2, null, true);
  if (typeof yMin === 'string') {
    return yMin; // errorMessage
  }
  if (yMin.length > 2) {
    return 'yMin accepts not more than two values for left and right y-axes';
  }
  renderInfo.yMin = yMin;
  // console.log(renderInfo.yMin);
  // yMax
  const yMax = getNumberArrayFromInput('yMax', yaml?.yMax, 2, null, true);
  if (typeof yMax === 'string') {
    return yMax; // errorMessage
  }
  if (yMax.length > 2) {
    return 'yMax accepts not more than two values for left and right y-axes';
  }
  renderInfo.yMax = yMax;
  // console.log(renderInfo.yMax);
  // reverseYAxis
  const reverseYAxis = getBoolArrayFromInput(
    'reverseYAxis',
    yaml?.reverseYAxis,
    2,
    false,
    true
  );
  if (typeof reverseYAxis === 'string') {
    return reverseYAxis; // errorMessage
  }
  if (reverseYAxis.length > 2) {
    return 'reverseYAxis accepts not more than two values for left and right y-axes';
  }
  renderInfo.reverseYAxis = reverseYAxis;
  // console.log(renderInfo.reverseYAxis);
};

export const getKeys = (obj: object): string[] =>
  obj !== null ? Object.keys(obj) : [];

export const validateYamlKeys = (
  keys: string[],
  renderInfoKeys: string[],
  allowedKeys: string[]
) => {
  // console.log(additionalAllowedKeys);
  for (const key of keys) {
    if (!renderInfoKeys.includes(key) && !allowedKeys.includes(key)) {
      throw new Error(`'${key}' is not an available key`);
    }
  }
};
