import * as d3 from 'd3';
import { RenderInfo } from '../models/render-info';
import { ChartElements } from '../models/types';

export interface CreateElementsOptions {
  clearContents?: boolean;
  elements?: ChartElements;
}

/**
 * Create Elements
 * @param {HTMLElement} container
 * @param {RenderInfo} renderInfo
 * @param {CreateElementsOptions} options
 * @returns {ChartElements}
 */
export const createElements = (
  container: HTMLElement,
  renderInfo: RenderInfo,
  options: CreateElementsOptions = { clearContents: false }
): ChartElements => {
  if (!renderInfo) return;

  const elements = options?.elements ?? {};
  const { dataAreaSize, margin } = renderInfo;
  const { height, width } = dataAreaSize;

  // optionally, start with a clean slate
  if (options?.clearContents) {
    d3.select(container).select('#svg').remove();
    Object.getOwnPropertyNames(elements).forEach(
      (name) => delete elements[name]
    );
  }

  // svg: container for plotting
  const svg = d3
    .select(container)
    .append('svg')
    .attr('id', 'svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', dataAreaSize.height + margin.top + margin.bottom);
  elements.svg = svg;

  // graphArea, includes chartArea, title, legend
  const graphArea = svg
    .append('g')
    .attr('id', 'graphArea')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .attr('width', width + margin.right)
    .attr('height', height + margin.bottom);
  elements.graphArea = graphArea;

  // dataArea, under graphArea, includes points, lines, xAxis, yAxis
  elements.dataArea = graphArea
    .append('g')
    .attr('id', 'dataArea')
    .attr('width', width)
    .attr('height', height);

  return elements;
};
