import { ValueType } from 'src/models/enums';
import { TextValueMap } from '../models/types';
import { timeFormat } from './date-time.utils';

// Parsing

export const parseFloatFromAny = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toParse: any,
  textValueMap: TextValueMap = null
): { type: ValueType.Number | ValueType.Time; value: number } => {
  // console.log("parseFloatFromAny");
  // console.log(toParse);
  let value = null;
  let type = ValueType.Number;
  if (typeof toParse === 'string') {
    // time value
    if (toParse.includes(':')) {
      let negativeValue = false;
      if (toParse.startsWith('-')) {
        negativeValue = true;
        toParse = toParse.substring(1);
      }
      const timeValue = window.moment(toParse, timeFormat, true);
      if (timeValue.isValid()) {
        value = timeValue.diff(
          window.moment('00:00', 'HH:mm', true),
          'seconds'
        );
        if (negativeValue) value = -1 * value;

        type = ValueType.Time;
      }
    } else {
      if (textValueMap) {
        const keys = Object.keys(textValueMap) as Array<keyof string>;
        for (const key of keys) {
          if (typeof key === 'string') {
            const regex = new RegExp(key, 'gm');
            // console.log(toParse);
            if (regex.test(toParse) && Number.isNumber(textValueMap[key])) {
              const strReplacedValue = textValueMap[key].toString();
              toParse = toParse.replace(regex, strReplacedValue);
              // console.log(toParse);
              break;
            }
          }
        }

        value = parseFloat(toParse);
        if (Number.isNaN(value)) value = null;
      } else {
        value = parseFloat(toParse);
        if (Number.isNaN(value)) value = null;
      }
    }
  } else if (typeof toParse === 'number') {
    value = toParse;
  }

  return { type, value };
};
