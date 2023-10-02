import { Moment } from 'moment';
import { ValueType } from 'src/models/enums';
import { Query, RenderInfo } from '../models/data';
import { DataMap, XValueMap } from '../models/types';
import { DateTimeUtils, NumberUtils } from '../utils';
import { addToDataMap } from './data-collector';

/**
 * Helper function
 * - strRegex must have name group 'value'
 * - Named group 'value' could be provided from users or plugin
 * @param {string} text
 * @param {string} strRegex
 * @param {RenderInfo} renderInfo
 * @returns {Moment}
 */
export const extractDateUsingRegexWithValue = (
  text: string,
  strRegex: string,
  renderInfo: RenderInfo
): Moment => {
  let date = window.moment('');

  const regex = new RegExp(strRegex, 'gm');
  let match;
  while ((match = regex.exec(text))) {
    // console.log(match);
    if (
      typeof match.groups !== 'undefined' &&
      typeof match.groups.value !== 'undefined'
    ) {
      // must have group name 'value'
      let strDate = match.groups.value.trim();
      // console.log(strDate);
      strDate = DateTimeUtils.getDateStringFromInputString(
        strDate,
        renderInfo.dateFormatPrefix,
        renderInfo.dateFormatSuffix
      );

      date = DateTimeUtils.strToDate(strDate, renderInfo.dateFormat);
      if (date.isValid()) {
        return date;
      }
    }
  }
  return date;
}; /**
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
  // console.log("extractDataUsingRegexWithMultipleValues");
  const regex = new RegExp(strRegex, 'gm');
  let match;
  let measure = 0;
  let extracted = false;
  while ((match = regex.exec(text))) {
    // console.log(match);
    if (!renderInfo.ignoreAttachedValue[query.getId()]) {
      if (
        typeof match.groups !== 'undefined' &&
        typeof match.groups.value !== 'undefined'
      ) {
        const values = match.groups.value.trim();
        // console.log(values);
        // console.log(query.getSeparator());
        const splitted = values.split(query.getSeparator());
        // console.log(splitted);
        if (!splitted) continue;
        if (splitted.length === 1) {
          // console.log("single-value");
          const toParse = splitted[0].trim();
          // console.log(toParse);
          const retParse = NumberUtils.parseFloatFromAny(
            toParse,
            renderInfo.textValueMap
          );
          if (retParse.value !== null) {
            if (retParse.type === ValueType.Time) {
              measure = retParse.value;
              extracted = true;
              query.valueType = ValueType.Time;
              query.addNumTargets();
            } else {
              if (
                !renderInfo.ignoreZeroValue[query.getId()] ||
                retParse.value !== 0
              ) {
                measure += retParse.value;
                extracted = true;
                query.addNumTargets();
              }
            }
          }
        } else if (
          splitted.length > query.getAccessor() &&
          query.getAccessor() >= 0
        ) {
          // console.log("multiple-values");
          const toParse = splitted[query.getAccessor()].trim();
          const retParse = NumberUtils.parseFloatFromAny(
            toParse,
            renderInfo.textValueMap
          );
          //console.log(retParse);
          if (retParse.value !== null) {
            if (retParse.type === ValueType.Time) {
              measure = retParse.value;
              extracted = true;
              query.valueType = ValueType.Time;
              query.addNumTargets();
            } else {
              measure += retParse.value;
              extracted = true;
              query.addNumTargets();
            }
          }
        }
      } else {
        // no named groups, count occurrences
        // console.log("count occurrences");
        measure += renderInfo.constValue[query.getId()];
        extracted = true;
        query.addNumTargets();
      }
    } else {
      // force to count occurrences
      // console.log("forced count occurrences");
      measure += renderInfo.constValue[query.getId()];
      extracted = true;
      query.addNumTargets();
    }
  }

  if (extracted) {
    const xValue = xValueMap.get(renderInfo.xDataset[query.getId()]);
    addToDataMap(dataMap, xValue, query, measure);
    return true;
  }

  return false;
};
