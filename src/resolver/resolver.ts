import { Moment } from 'moment';
import { sprintf } from 'sprintf-js';
import { RenderInfo } from '../models/data';
import { DateTimeUtils } from '../utils';
import { ExprResolved, resolve } from './helper';

/**
 * Resolve the template expression in string and return a resolved string
 * @param template
 * @param renderInfo
 * @returns
 */
export const resolveTemplate = (
  template: string,
  renderInfo: RenderInfo
): string => {
  const retResolve = resolve(template, renderInfo);
  if (typeof retResolve === 'string') {
    return retResolve; // error message
  }
  const exprMap = retResolve as Array<ExprResolved>;

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
        strValue = DateTimeUtils.dateToStr(value, format);
      } else {
        strValue = DateTimeUtils.dateToStr(value, renderInfo.dateFormat);
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
 * Resolve the template expression in string and return a number or date
 * @param text
 * @param renderInfo
 * @returns
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
  const exprMap = retResolve as Array<ExprResolved>;

  if (exprMap.length > 0) {
    return exprMap[0].value; // only first value will be return
  }

  return 'Error: failed to resolve values';
};
