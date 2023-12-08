import * as d3 from 'd3';
import { RenderInfo } from '../models/render-info';
import { ComponentElements } from '../models/types';
import { DomUtils, UiUtils } from '../utils';
import { ComponentBase } from './component-base.model';

export interface CreateElementsOptions {
  clearContents?: boolean;
  elements?: ComponentElements;
}

/**
 * Create Elements
 * @param {HTMLElement} container
 * @param {RenderInfo} renderInfo
 * @param {CreateElementsOptions} options
 * @returns {ComponentElements}
 */
export const createElements = (
  container: HTMLElement,
  renderInfo: RenderInfo,
  options: CreateElementsOptions = { clearContents: false }
): ComponentElements => {
  if (!renderInfo) return;

  const e = options?.elements ?? {};
  const { dataAreaSize, margin } = renderInfo;
  const { height, width } = dataAreaSize;

  // optionally, start with a clean slate
  if (options?.clearContents) {
    d3.select(container).select('#svg').remove();
    Object.getOwnPropertyNames(e).forEach((name) => delete e[name]);
  }

  // svg: container for plotting
  const svg = d3
    .select(container)
    .append('svg')
    .attr('id', 'svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', dataAreaSize.height + margin.top + margin.bottom);
  e.svg = svg;

  // graphArea, includes chartArea, title, legend
  const graphArea = svg
    .append('g')
    .attr('id', 'graphArea')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .attr('width', width + margin.right)
    .attr('height', height + margin.bottom);
  e.graphArea = graphArea;

  // dataArea, under graphArea, includes points, lines, xAxis, yAxis
  e.dataArea = graphArea
    .append('g')
    .attr('id', 'dataArea')
    .attr('width', width)
    .attr('height', height);

  return e;
};

export const hours = (hours: number) => hours * 3600;
export const halfHour = hours(0.5);
export const oneHour = hours(1);
export const fiveHours = hours(5);
export const twelveHours = hours(12);

export interface RenderTitleOptions {
  titleSpacing?: number;
  titleCssClass?: string;
}

export const renderTitle = (
  elements: ComponentElements,
  renderInfo: RenderInfo,
  component: ComponentBase,
  options?: RenderTitleOptions
): void => {
  if (!renderInfo || !component || !component.title) return;

  const spacing = options?.titleSpacing || 0; // Extra spacing between title and dataArea
  const cssClass = options?.titleCssClass || 'tracker-title';

  const { title } = component;
  const { height } = UiUtils.getDimensions(title, cssClass);
  const { width } = renderInfo.dataAreaSize;

  // Append title
  elements.title = elements.graphArea
    .append('text')
    .text(title) // pivot at center
    .attr('id', 'title')
    .attr('transform', `translate(${width / 2}, ${height / 2})`)
    .attr('height', height) // for later use
    .attr('class', cssClass);

  // Expand parent areas
  DomUtils.expandArea(elements.svg, 0, height + spacing);
  DomUtils.expandArea(elements.graphArea, 0, height + spacing);

  // Move sibling areas
  DomUtils.moveArea(elements.dataArea, 0, height + spacing);

  return;
};
