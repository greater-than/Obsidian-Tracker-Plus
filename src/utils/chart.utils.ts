import * as d3 from 'd3';
import { Size } from '../models/size';

/**
 * @summary Calculates the dimensions of a rendered text block
 * @param {string} text
 * @param {string} styleClass
 * @param {string} rotate
 * @returns {Size} The dimensions of text block after applying styles and optionally rotating it
 */

export const measureTextSize = (
  text: string,
  styleClass: string = '',
  rotate: string = ''
): Size => {
  const container = d3.select('body').append('svg');
  const textBlock = container
    .append('text')
    .text(text)
    .attr('x', -99999)
    .attr('y', -99999);

  if (styleClass) textBlock.attr('class', styleClass);
  if (rotate) textBlock.attr('transform', 'rotate(' + rotate + ')');

  const size = container.node().getBBox();
  container.remove();
  const { width, height } = size;
  return { width, height };
};
