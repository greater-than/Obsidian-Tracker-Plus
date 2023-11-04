import { ValueType } from '../models/enums';
import { Query } from '../models/query';
import { RenderInfo } from '../models/render-info';
import { IQueryValuePair, TDataMap, TNumberValueMap } from '../models/types';
import * as helper from '../utils/helper';
import Moment = moment.Moment;

/**
 * Returns a Moment object parsed from the provided text
 * @param {string} text
 * @param {string} pattern RegEx pattern, must have a named group 'value'
 * @param {RenderInfo} renderInfo
 * @returns {Moment}
 */
export function extractDateUsingRegexWithValue(
  text: string,
  pattern: string,
  renderInfo: RenderInfo
): Moment {
  let date = window.moment('');

  const regex = new RegExp(pattern, 'gm');
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
      strDate = helper.getDateStringFromInputString(
        strDate,
        renderInfo.dateFormatPrefix,
        renderInfo.dateFormatSuffix
      );

      date = helper.strToDate(strDate, renderInfo.dateFormat);
      if (date.isValid()) {
        return date;
      }
    }
  }

  return date;
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
export const extractDataUsingRegexWithMultipleValues = (
  text: string,
  pattern: string,
  query: Query,
  dataMap: TDataMap,
  valueMap: TNumberValueMap,
  renderInfo: RenderInfo
): boolean => {
  // console.log("extractDataUsingRegexWithMultipleValues");
  const regex = new RegExp(pattern, 'gm');
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
          const retParse = helper.parseFloatFromAny(
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
          const retParse = helper.parseFloatFromAny(
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
    const xValue = valueMap.get(renderInfo.xDataset[query.getId()]);
    addToDataMap(dataMap, xValue, query, measure);
    return true;
  }

  return false;
};

export const addToDataMap = (
  dataMap: TDataMap,
  date: string,
  query: Query,
  value: number | null
) => {
  if (!dataMap.has(date)) {
    const queryValuePairs = new Array<IQueryValuePair>();
    queryValuePairs.push({ query: query, value: value });
    dataMap.set(date, queryValuePairs);
  } else {
    const targetValuePairs = dataMap.get(date);
    targetValuePairs.push({ query: query, value: value });
  }
};
