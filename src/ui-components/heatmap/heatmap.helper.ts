import * as d3 from 'd3';
import { Dataset } from '../../models/dataset';
import { RenderInfo } from '../../models/render-info';
import { ChartElements } from '../../models/types';
import { DateTimeUtils, DomUtils } from '../../utils';
import { Heatmap } from './heatmap.model';
import { DayInfo } from './types';

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

  const elements: ChartElements = options?.elements || {};
  const { dataAreaSize, margin } = renderInfo;
  const { height, width } = dataAreaSize;

  // Start with a clean slate
  if (options?.clearContents) {
    d3.select(container).select('#svg').remove();
    Object.getOwnPropertyNames(elements).forEach(
      (name) => delete elements[name]
    );
  }

  // container for plotting
  const svg = d3
    .select(container)
    .append('svg')
    .attr('id', 'svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + renderInfo.margin.bottom);
  elements.svg = svg;

  // graphArea: contains chartArea, title, legend
  const graphArea = svg
    .append('g')
    .attr('id', 'graphArea')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .attr('width', width + margin.right)
    .attr('height', height + margin.bottom);
  elements.graphArea = graphArea;

  // dataArea: contained by graphArea, contains points, lines, xAxis, yAxis
  elements.dataArea = graphArea
    .append('g')
    .attr('id', 'dataArea')
    .attr('width', width)
    .attr('height', height);

  return elements;
};

export const renderHeatmapHeader = (
  _container: HTMLElement,
  _elements: ChartElements,
  renderInfo: RenderInfo,
  component: Heatmap,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _dataset: Dataset
): void => {
  if (!renderInfo || !component) return;
  // TODO What does this do?
};

export const renderHeatmapDays = (
  _container: HTMLElement,
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: Heatmap,
  dataset: Dataset
) => {
  if (!renderInfo || !component) return;

  const cellSize = 20;
  const dotRadius = (cellSize / 2) * 0.6;

  // Get min and max, null values will be treated as zero here
  let yMin = d3.min(dataset.values);
  if (component.yMin !== null) {
    yMin = component.yMin;
  }
  let yMax = d3.max(dataset.values);
  if (component.yMax !== null) {
    yMax = component.yMax;
  }
  // Prepare data for graph
  const daysInHeatmapView: Array<DayInfo> = [];
  const dataStartDate = dataset.startDate.clone();
  let startDate = dataStartDate.clone().subtract(dataStartDate.day(), 'days');
  if (component.startWeekOn.toLowerCase() === 'mon') {
    startDate = startDate.add(1, 'days');
  }
  const dataEndDate = dataset.endDate.clone();
  let endDate = dataEndDate.clone().add(7 - dataEndDate.day() - 1, 'days');
  if (component.startWeekOn.toLowerCase() === 'mon') {
    endDate = endDate.add(1, 'days');
  }
  let indCol = 0;
  let indRow = 0;
  let ind = 0;
  for (
    let curDate = startDate.clone();
    curDate <= endDate;
    curDate.add(1, 'days')
  ) {
    if (component.startWeekOn.toLowerCase() === 'mon') {
      indCol = curDate.day() - 1;
      if (indCol < 0) {
        indCol = 6;
      }
      indRow = Math.floor(ind / 7);
    } else {
      indCol = curDate.day(); // 0~6
      indRow = Math.floor(ind / 7);
    }

    // curValue and scaledValue
    const curValue = dataset.getValue(curDate);
    let scaledValue = 0;
    if (Number.isNumber(yMax) && Number.isNumber(yMin) && yMax - yMin > 0) {
      scaledValue = (curValue - yMin) / (yMax - yMin);
    }

    daysInHeatmapView.push({
      date: DateTimeUtils.dateToString(curDate, renderInfo.dateFormat),
      value: curValue,
      scaledValue: scaledValue,
      row: indRow,
      col: indCol,
    });

    ind++;
  }
  // scale
  const totalDayBlockWidth = (indCol + 1) * cellSize;

  // TODO Remove const?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalBlockHeight = (indRow + 1) * cellSize;

  const scale = d3
    .scaleLinear()
    .domain([-0.5, 6.5])
    .range([0, totalDayBlockWidth]);

  // circles
  let heatmapColor = '#69b3a2';
  if (component.color) {
    heatmapColor = component.color;
  }

  // days, shown as dots or squares
  elements.dataArea
    .selectAll('dot')
    .data(daysInHeatmapView)
    .enter()
    .append('circle')
    .attr('r', dotRadius)
    .attr('cx', (d: DayInfo) => {
      return scale(d.col);
    })
    .attr('cy', (d: DayInfo) => {
      return scale(d.row);
    })
    .style('fill', (d: DayInfo) => {
      return d3.interpolateLab('white', heatmapColor)(d.scaledValue);
    })
    .style('cursor', 'default');

  // Expand areas
  const svgWidth = parseFloat(elements.svg.attr('width'));
  const svgHeight = parseFloat(elements.svg.attr('height'));
  const graphAreaWidth = parseFloat(elements.graphArea.attr('width'));
  const graphAreaHeight = parseFloat(elements.graphArea.attr('height'));
  const totalHeight = (indRow + 2) * cellSize; // + parseFloat(elements.header.attr("height"));
  const totalWidth = (indCol + 1) * cellSize;
  if (totalHeight > svgHeight) {
    DomUtils.expandArea(elements.svg, 0, totalHeight - svgHeight);
  }
  if (totalWidth > svgWidth) {
    DomUtils.expandArea(elements.svg, totalWidth - svgWidth, 0);
  }
  if (totalHeight > graphAreaHeight) {
    DomUtils.expandArea(elements.graphArea, 0, totalHeight - graphAreaHeight);
  }
  if (totalWidth > graphAreaWidth) {
    DomUtils.expandArea(elements.svg, totalWidth - graphAreaWidth, 0);
  }
};
