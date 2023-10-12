import { sprintf } from 'sprintf-js';
import { TrackerError } from '../errors';
import { RenderInfo } from '../models/render-info';
import { DateTimeUtils } from '../utils';
import { resolve } from './helper';
import { IExprResolved } from './types';
import Moment = moment.Moment;

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

  const expressions = resolved as Array<IExprResolved>;

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
        ? DateTimeUtils.dateToString(value, format)
        : DateTimeUtils.dateToString(value, renderInfo.dateFormat);
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
): number | Moment => {
  text = text.trim();

  // input is pure number
  if (/^([\-]?[0-9]+[\.][0-9]+|[\-]?[0-9]+)$/.test(text)) {
    return parseFloat(text);
  }

  // template
  const resolved = resolve(text, renderInfo);

  const exprMap = resolved as Array<IExprResolved>;
  if (exprMap.length <= 0) throw new TrackerError('Failed to resolve values');

  return exprMap[0].value; // only first value will be return
};

const Resolver = {
  resolveTemplate,
  resolveValue,
};

export default Resolver;
