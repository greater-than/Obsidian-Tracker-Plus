import { sprintf } from 'sprintf-js';
import { RenderInfo } from '../models/render-info';
import { dateToString } from '../utils/date-time.utils';
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
  const expressions = resolve(template, renderInfo);
  if (typeof expressions === 'string') return expressions; // error message

  for (const expr of expressions) {
    const { source, value, format } = expr;
    let formatted = '';
    if (typeof value === 'number')
      formatted = format ? sprintf('%' + format, value) : value.toFixed(1);
    else if (window.moment.isMoment(value))
      formatted = format
        ? dateToString(value, format)
        : dateToString(value, renderInfo.dateFormat);

    if (formatted) template = template.split(source).join(formatted);
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
  text = text.trim();

  // input is pure number
  if (/^([\-]?[0-9]+[\.][0-9]+|[\-]?[0-9]+)$/.test(text))
    return parseFloat(text);

  // template
  const retResolve = resolve(text, renderInfo);
  if (typeof retResolve === 'string') return retResolve; // error message

  const exprMap = retResolve as Array<IExprResolved>;

  if (exprMap.length > 0) return exprMap[0].value; // only first value will be return

  return 'Error: failed to resolve values';
};
