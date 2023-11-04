import * as d3 from 'd3';
import { RenderInfo } from '../models/render-info';
import { Size } from '../models/size';
import { ComponentElements } from '../models/types';

/**
 * @summary Calculates the dimensions of a rendered text block
 * @param {string} text
 * @param {string} cssClass
 * @param {string} rotate
 * @returns {Size} The dimensions of text block after applying styles and optionally rotating it
 */
export const getTextDimensions = (
  text: string,
  cssClass: string = '',
  rotate: string = ''
): Size => {
  const container = d3.select('body').append('svg');
  const textBlock = container
    .append('text')
    .text(text)
    .attr('x', -99999)
    .attr('y', -99999);

  if (cssClass) textBlock.attr('class', cssClass);
  if (rotate) textBlock.attr('transform', 'rotate(' + rotate + ')');

  const size = container.node().getBBox();
  container.remove();
  const { width, height } = size;
  return { width, height };
};

/**
 * Sets the scale of the chart/graph
 * @param {HTMLElement} component
 * @param {ComponentElements} elements
 * @param {RenderInfo} renderInfo
 */
export const setScale = (
  component: HTMLElement,
  elements: ComponentElements,
  renderInfo: RenderInfo
): void => {
  const selection = d3.select(component);
  const { svg } = elements;
  const svgWidth = parseFloat(svg.attr('width'));
  const svgHeight = parseFloat(svg.attr('height'));
  const { fitPanelWidth, fixedScale } = renderInfo;

  svg
    .attr('width', null)
    .attr('height', null)
    .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  if (fitPanelWidth) {
    selection.style('width', '100%');
  } else {
    selection.style('width', (svgWidth * fixedScale).toString() + 'px');
    selection.style('height', (svgHeight * fixedScale).toString() + 'px');
  }
};
