import { Moment } from 'moment';
import { sprintf } from 'sprintf-js';
import { RenderInfo } from '../models/render-info';
import { DateTimeUtils } from '../utils';
import { resolve } from './helper';
import { ExprResolved } from './types';

/**
 * @summary Resolve the template expression in string and return a resolved string
 * @param template
 * @param renderInfo
 * @returns {string}
 */
export const resolveTemplate = (
  template: string,
  renderInfo: RenderInfo
): string => {
  const resolved = resolve(template, renderInfo);
  if (typeof resolved === 'string') return resolved; // error message

  const expressions = resolved as Array<ExprResolved>;

  for (const expr of expressions) {
    const source = expr.source;
    const value = expr.value;
    const format = expr.format;
    let formatted = '';

    if (typeof value === 'number') {
      formatted = format
        ? sprintf('%' + format, value)
        : (formatted = value.toFixed(1));
    } else if (window.moment.isMoment(value)) {
      formatted = format
        ? DateTimeUtils.dateToStr(value, format)
        : DateTimeUtils.dateToStr(value, renderInfo.dateFormat);
    }

    if (formatted) template = template.split(source).join(formatted);
  }
  return template;
};

/**
 * @summary Resolve the template expression in string and return a number or date
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
  const resolved = resolve(text, renderInfo);
  if (typeof resolved === 'string') {
    return resolved; // error message
  }
  const exprMap = resolved as Array<ExprResolved>;

  if (exprMap.length > 0) {
    return exprMap[0].value; // only first value will be return
  }

  return 'Error: Failed to resolve values';
};

const Resolver = {
  resolveTemplate,
  resolveValue,
};

export default Resolver;