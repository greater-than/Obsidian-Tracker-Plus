import * as numberUtils from 'src/utils/number.utils';
import * as stringUtils from 'src/utils/string.utils';
import { CommonChartInfo } from '../models/data';

export const strToBool = (str: string): boolean | null => {
  switch (str.trim().toLowerCase()) {
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
  if (location === 'left' || location === 'right' || location === 'none') {
    return true;
  }
  return false;
};

// TODO Why does this function exist?
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const validateColor = (_color: string): boolean => true;

export const splitInputByComma = (input: string): string[] => {
  // Split string by ',' but not by '\,'
  // let splitted = input.split(/(?<!\\),/); // -->lookbehind not support in Safari for now
  const dummy = '::::::tracker::::::';
  const temp = input.split('\\,').join(dummy);
  const splitted = temp.split(',');
  for (let ind = 0; ind < splitted.length; ind++) {
    splitted[ind] = splitted[ind].split(dummy).join(',');
  }
  return splitted;
};

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
    const splitted = splitInputByComma(input);
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
            prev = strToBool(splitted[ind - 1].trim());
          }
          if (curr === '') {
            if (prev !== null) {
              array[ind] = prev;
            } else {
              array[ind] = defaultValue;
            }
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
          const last = strToBool(splitted[splitted.length - 1].trim());
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

  if (errorMessage !== '') {
    return errorMessage;
  }

  return array;
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
          if (numValidValue > 0) {
            array[ind] = last;
          } else {
            array[ind] = defaultValue;
          }
        }
      }
    }
  } else if (typeof input === 'string') {
    const splitted = splitInputByComma(input);
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
            prev = numberUtils.parseFloatFromAny(
              splitted[ind - 1].trim()
            ).value;
          }
          if (curr === '') {
            if (prev !== null && Number.isNumber(prev)) {
              array[ind] = prev;
            } else {
              array[ind] = defaultValue;
            }
          } else {
            const currNum = numberUtils.parseFloatFromAny(curr).value;
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
          const last = numberUtils.parseFloatFromAny(
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
        const inputNum = numberUtils.parseFloatFromAny(input).value;
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

export const getStringFromInput = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any,
  defaultValue: string
): string => {
  if (typeof input === 'string') {
    return stringUtils.replaceImgTagByAlt(input);
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
    const splitted = splitInputByComma(input);
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
            prev = splitted[ind - 1].trim();
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
          const last = splitted[splitted.length - 1].trim();
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

  if (errorMessage !== '') {
    return errorMessage;
  }

  for (let ind = 0; ind < array.length; ind++) {
    array[ind] = stringUtils.replaceImgTagByAlt(array[ind]);
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
    const splitted = splitInputByComma(input);
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
    const splitted = splitInputByComma(input);
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
    strArray[ind] = stringUtils.replaceImgTagByAlt(strArray[ind]);
  }

  return strArray;
};

export const parseCommonChartInfo = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yaml: any,
  renderInfo: CommonChartInfo
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
  const retYAxisLabel = getStringArrayFromInput(
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
  const retYAxisColor = getStringArrayFromInput(
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
  const retYAxisLabelColor = getStringArrayFromInput(
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
  const retYAxisUnit = getStringArrayFromInput(
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
  renderInfo.xAxisTickInterval = getStringFromInput(
    yaml?.xAxisTickInterval,
    renderInfo.xAxisTickInterval
  );
  // console.log(renderInfo.xAxisTickInterval);
  // yAxisTickInterval
  const retYAxisTickInterval = getStringArrayFromInput(
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
  renderInfo.xAxisTickLabelFormat = getStringFromInput(
    yaml?.xAxisTickLabelFormat,
    renderInfo.xAxisTickLabelFormat
  );
  // console.log(renderInfo.xAxisTickLabelFormat);
  // yAxisTickLabelFormat
  const retYAxisTickLabelFormat = getStringArrayFromInput(
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
  const retYMin = getNumberArrayFromInput('yMin', yaml?.yMin, 2, null, true);
  if (typeof retYMin === 'string') {
    return retYMin; // errorMessage
  }
  if (retYMin.length > 2) {
    return 'yMin accepts not more than two values for left and right y-axes';
  }
  renderInfo.yMin = retYMin;
  // console.log(renderInfo.yMin);
  // yMax
  const retYMax = getNumberArrayFromInput('yMax', yaml?.yMax, 2, null, true);
  if (typeof retYMax === 'string') {
    return retYMax; // errorMessage
  }
  if (retYMax.length > 2) {
    return 'yMax accepts not more than two values for left and right y-axes';
  }
  renderInfo.yMax = retYMax;
  // console.log(renderInfo.yMax);
  // reverseYAxis
  const retReverseYAxis = getBoolArrayFromInput(
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
