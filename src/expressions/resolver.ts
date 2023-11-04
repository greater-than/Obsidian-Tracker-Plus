import { sprintf } from 'sprintf-js';
import { RenderInfo } from '../models/render-info';
import * as helper from '../utils/helper';
import { resolve } from './helper';
import { IExprResolved } from './types';
import Moment = moment.Moment;

/**
 * @summary Resolve the template expression in string and return a resolved string
 * @param {string} template
 * @param {RenderInfo} renderInfo
 * @returns {string}
 */
export const resolveTemplate = (
  template: string,
  renderInfo: RenderInfo
): string => {
  const retResolve = resolve(template, renderInfo);
  if (typeof retResolve === 'string') {
    return retResolve; // error message
  }
  const exprMap = retResolve as Array<IExprResolved>;

  for (const exprResolved of exprMap) {
    const source = exprResolved.source;
    const value = exprResolved.value;
    const format = exprResolved.format;
    let strValue = '';
    if (typeof value === 'number') {
      if (format) {
        strValue = sprintf('%' + format, value);
      } else {
        strValue = value.toFixed(1);
      }
    } else if (window.moment.isMoment(value)) {
      if (format) {
        strValue = helper.dateToStr(value, format);
      } else {
        strValue = helper.dateToStr(value, renderInfo.dateFormat);
      }
    }

    if (strValue) {
      // console.log(exprResolved);
      template = template.split(source).join(strValue);
    }
  }

  return template;
};

/**
 * @summary Resolve the template expression in string and return a number or date
 * @param {string} text
 * @param {RenderInfo} renderInfo
 * @returns {number|Moment}
 */
export const resolveValue = (
  text: string,
  renderInfo: RenderInfo
): number | Moment | string => {
  // console.log(template);
  text = text.trim();

  // input is pure number
  if (/^([\-]?[0-9]+[\.][0-9]+|[\-]?[0-9]+)$/.test(text)) {
    return parseFloat(text);
  }

  // template
  const retResolve = resolve(text, renderInfo);
  if (typeof retResolve === 'string') {
    return retResolve; // error message
  }
  const exprMap = retResolve as Array<IExprResolved>;

  if (exprMap.length > 0) {
    return exprMap[0].value; // only first value will be return
  }

  return 'Error: failed to resolve values';
};