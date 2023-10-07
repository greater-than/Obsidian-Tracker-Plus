import { ValueType } from '../models/enums';
import { TextValueMap } from '../models/types';
import { TMoment, getMoment, timeFormats } from './date-time.utils';

export const parseFloatFromAny = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toParse: any,
  textValueMap: TextValueMap = null,
  moment?: TMoment
): { type: ValueType; value: number } => {
  // TODO Remove multiple instances of re-assignment of toParse below because 'any' is not immutable
  let value = null;
  let type = ValueType.Number;

  if (typeof toParse !== 'string' && typeof toParse !== 'number')
    return { type, value };

  if (typeof toParse === 'string') {
    // time value
    if (toParse.includes(':')) {
      // TODO Move this block to date-time.utils
      let negativeValue = false;
      if (toParse.startsWith('-')) {
        negativeValue = true;
        toParse = toParse.substring(1);
      }
      const m = getMoment(moment);
      const timeValue = m(toParse, timeFormats, true);
      if (timeValue.isValid()) {
        const input = (m('00:00', 'HH:mm', true), 'seconds');
        value = timeValue.diff(input, 'seconds');
        if (negativeValue) value = -1 * value;
        type = ValueType.Time;
      }
    } else {
      if (textValueMap) {
        const keys = Object.keys(textValueMap);
        for (const key of keys) {
          const regex = new RegExp(key, 'gm');
          if (regex.test(toParse) && Number.isNumber(textValueMap[key])) {
            const strReplacedValue = textValueMap[key].toString();
            toParse = toParse.replace(regex, strReplacedValue);
            break;
          }
        }
      }
      value = parseFloat(toParse);
      if (Number.isNaN(value)) value = null;
    }
  } else {
    value = toParse;
  }

  return { type, value };
};
