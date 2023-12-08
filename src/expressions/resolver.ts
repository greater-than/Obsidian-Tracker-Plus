import jsep from 'jsep';
import { sprintf } from 'sprintf-js';
import { TrackerError } from '../errors';
import { RenderInfo } from '../models/render-info';
import { ExpressionPattern } from '../regex-patterns';
import { dateToString } from '../utils/date-time.utils';
import { evaluate } from './evaluator';
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
  const expressions = getExpressions(template, renderInfo);

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
  const expressions = getExpressions(text, renderInfo);

  if (expressions.length <= 0)
    throw new TrackerError('Failed to resolve values');

  return expressions[0].value;
};

/**
 * Returns an array of resolved expressions
 * @param {string} text
 * @param {RenderInfo} renderInfo
 * @returns {IExprResolved[]}
 */
export const getExpressions = (
  text: string,
  renderInfo: RenderInfo
): IExprResolved[] => {
  const expressions: Array<IExprResolved> = [];
  const regex = new RegExp(ExpressionPattern, 'gm');
  let match;
  while ((match = regex.exec(text))) {
    const source = match[0];
    if (expressions.some((e) => e.source === source)) continue;
    if (
      typeof match.groups !== 'undefined' &&
      typeof match.groups.expr !== 'undefined'
    ) {
      const expr = jsep(match.groups.expr);
      if (!expr) throw new TrackerError('Failed to parse expression');
      const value = evaluate(expr, renderInfo);
      if (typeof value === 'number' || window.moment.isMoment(value)) {
        const format =
          typeof match.groups.format !== 'undefined'
            ? match.groups.format
            : null;
        expressions.push({ source, value, format });
      }
    }
  }
  return expressions;
};
