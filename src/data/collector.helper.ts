import { DataMap } from '../models/data-map';
import { ValueType } from '../models/enums';
import { Query } from '../models/query';
import { RenderInfo } from '../models/render-info';
import { TNumberValueMap } from '../models/types';
import { DateTimeUtils, NumberUtils } from '../utils';
import Moment = moment.Moment;

/**
 * Returns a Moment object parsed from the provided text
 * @param {string} text
 * @param {string} pattern RegEx pattern, must have a named group 'value'
 * @param {RenderInfo} renderInfo
 * @returns {Moment}
 */
export function extractDate(
  text: string,
  pattern: string,
  renderInfo: RenderInfo
): Moment {
  const regex = new RegExp(pattern, 'gmu');
  let match;
  while ((match = regex.exec(text))) {
    if (
      typeof match.groups !== 'undefined' &&
      typeof match.groups.value !== 'undefined'
    ) {
      // must have group name 'value'
      const dateString = DateTimeUtils.getDateString(
        match.groups.value.trim(),
        renderInfo.dateFormatPrefix,
        renderInfo.dateFormatSuffix
      );
      const date = DateTimeUtils.toMoment(dateString, renderInfo.dateFormat);
      if (date.isValid()) return date;
    }
  }
  return window.moment('');
}

/**
 * Returns true if data was appended to the provided data map and the query was updated
 * - Accept multiple values using custom separators
 * - regex with value --> extract value
 * - regex without value --> count occurrences
 * @param {string} text
 * @param {string} pattern
 * @param {Query} query
 * @param {DataMap} dataMap
 * @param {NumberValueMap} valueMap
 * @param {RenderInfo} renderInfo
 * @returns {boolean} Returns true if data added to dataMap
 */
export const addMultipleValues = (
  text: string,
  pattern: string,
  query: Query,
  dataMap: DataMap,
  valueMap: TNumberValueMap,
  renderInfo: RenderInfo
): boolean => {
  const regex = new RegExp(pattern, 'gmu');
  let match;
  let value = 0.0;
  let extracted = false;
  const {
    ignoreAttachedValue,
    ignoreZeroValue,
    textValueMap,
    constValue,
    xDataset,
  } = renderInfo;
  const accessor = query.accessors[0];
  const { Time } = ValueType;
  while ((match = regex.exec(text))) {
    if (!ignoreAttachedValue[query.id]) {
      if (
        typeof match.groups !== 'undefined' &&
        typeof match.groups.value !== 'undefined'
      ) {
        const values = match.groups.value.trim().split(query.getSeparator());
        if (!values) continue;
        if (values.length === 1) {
          const toParse = values[0].trim();
          const parsed = NumberUtils.parseFloatFromAny(toParse, textValueMap);
          if (parsed.value !== null) {
            if (parsed.type === Time) {
              value = parsed.value;
              extracted = true;
              query.valueType = Time;
              query.incrementTargetCount();
            } else if (!ignoreZeroValue[query.id] || parsed.value !== 0) {
              value += parsed.value;
              extracted = true;
              query.incrementTargetCount();
            }
          }
        } else if (values.length > accessor && accessor >= 0) {
          const toParse = values[accessor].trim();
          const parsed = NumberUtils.parseFloatFromAny(toParse, textValueMap);
          if (parsed.value !== null) {
            value = parsed.value;
            extracted = true;
            if (parsed.type === Time) query.valueType = Time;
            query.incrementTargetCount();
          }
        }
      } else {
        // no named groups, count occurrences
        value += constValue[query.id];
        extracted = true;
        query.incrementTargetCount();
      }
    } else {
      // force to count occurrences
      value += constValue[query.id];
      extracted = true;
      query.incrementTargetCount();
    }
  }
  if (!extracted) return false;
  const xValue = valueMap.get(xDataset[query.id]);
  dataMap.add(xValue, { query, value });
  return true;
};
