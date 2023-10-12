import { ValueType } from '../models/enums';
import { Query } from '../models/query';
import { RenderInfo } from '../models/render-info';
import { DataMap, XValueMap } from '../models/types';
import { DateTimeUtils, NumberUtils } from '../utils';
import Moment = moment.Moment;

/**
 * Return a Moment object from the provided text
 * - pattern must have name group 'value'
 * - Named group 'value' could be provided from users or plugin
 * @param {string} text
 * @param {string} pattern RegEx pattern
 * @param {RenderInfo} renderInfo
 * @returns {Moment}
 */
export const extractDateUsingRegexWithValue = (
  text: string,
  pattern: string,
  renderInfo: RenderInfo
): Moment => {
  const regex = new RegExp(pattern, 'gm');
  let match;
  while ((match = regex.exec(text))) {
    if (
      typeof match.groups !== 'undefined' &&
      typeof match.groups.value !== 'undefined'
    ) {
      // must have group name 'value'
      let strDate = match.groups.value.trim();
      strDate = DateTimeUtils.getDateStringFromInputString(
        strDate,
        renderInfo.dateFormatPrefix,
        renderInfo.dateFormatSuffix
      );

      const date = DateTimeUtils.stringToDate(strDate, renderInfo.dateFormat);
      if (date.isValid()) return date;
    }
  }
  return window.moment('');
};

/**
 * Helper function
 * - Accept multiple values using custom separators
 * - regex with value --> extract value
 * - regex without value --> count occurrences
 * @param {string} text
 * @param {string} strRegex
 * @param {Query} query
 * @param {DataMap} dataMap
 * @param {XValueMap} xValueMap
 * @param {RenderInfo} renderInfo
 * @returns {boolean}
 */
export const extractDataUsingRegexWithMultipleValues = (
  text: string,
  strRegex: string,
  query: Query,
  dataMap: DataMap,
  xValueMap: XValueMap,
  renderInfo: RenderInfo
): boolean => {
  const regex = new RegExp(strRegex, 'gm');
  let match;
  let measure = 0;
  let extracted = false;
  while ((match = regex.exec(text))) {
    if (!renderInfo.ignoreAttachedValue[query.id]) {
      if (
        typeof match.groups !== 'undefined' &&
        typeof match.groups.value !== 'undefined'
      ) {
        const values = match.groups.value.trim();
        const splitValues = values.split(query.getSeparator());
        if (!splitValues) continue;
        if (splitValues.length === 1) {
          const toParse = splitValues[0].trim();
          const parsed = NumberUtils.parseFloatFromAny(
            toParse,
            renderInfo.textValueMap
          );
          if (parsed.value !== null) {
            if (parsed.type === ValueType.Time) {
              measure = parsed.value;
              extracted = true;
              query.valueType = ValueType.Time;
              query.incrementTargets();
            } else {
              if (!renderInfo.ignoreZeroValue[query.id] || parsed.value !== 0) {
                measure += parsed.value;
                extracted = true;
                query.incrementTargets();
              }
            }
          }
        } else if (
          splitValues.length > query.getAccessor() &&
          query.getAccessor() >= 0
        ) {
          const toParse = splitValues[query.getAccessor()].trim();
          const parsed = NumberUtils.parseFloatFromAny(
            toParse,
            renderInfo.textValueMap
          );
          if (parsed.value !== null) {
            if (parsed.type === ValueType.Time) {
              measure = parsed.value;
              extracted = true;
              query.valueType = ValueType.Time;
              query.incrementTargets();
            } else {
              measure += parsed.value;
              extracted = true;
              query.incrementTargets();
            }
          }
        }
      } else {
        // no named groups, count occurrences
        measure += renderInfo.constValue[query.id];
        extracted = true;
        query.incrementTargets();
      }
    } else {
      // force to count occurrences
      measure += renderInfo.constValue[query.id];
      extracted = true;
      query.incrementTargets();
    }
  }

  if (extracted) {
    const xValue = xValueMap.get(renderInfo.xDataset[query.id]);
    addToDataMap(dataMap, xValue, query, measure);
    return true;
  }

  return false;
};

// TODO Move this to a .utils file
/**
 * Appends a date and query/value pair to the provided dataMap
 * @param {dataMap} dataMap
 * @param {string} date
 * @param {Query} query
 * @param {number | null} value
 */
export const addToDataMap = (
  dataMap: DataMap,
  date: string,
  query: Query,
  value: number | null
): void => {
  dataMap.has(date)
    ? dataMap.get(date).push({ query, value })
    : dataMap.set(date, [{ query, value }]);
};
