import * as d3 from 'd3';
import { RenderInfo } from './models/render-info';
import {
  renderBarChart,
  renderBulletGraph,
  renderHeatmap,
  renderLineChart,
  renderMonth,
  renderPieChart,
  renderSummary,
} from './ui-components';

export const render = (canvas: HTMLElement, renderInfo: RenderInfo): string => {
  // console.log("render");
  // console.log(renderInfo.datasets);

  // Data preprocessing
  for (const dataset of renderInfo.datasets) {
    if (dataset.getQuery().usedAsXDataset) continue;
    // valueShift
    const shiftAmount = renderInfo.valueShift[dataset.getId()];
    if (shiftAmount !== null && shiftAmount !== 0) {
      dataset.shift(
        shiftAmount,
        renderInfo.shiftOnlyValueLargerThan[dataset.getId()]
      );
    }
    // penalty
    if (renderInfo.penalty[dataset.getId()] !== null) {
      dataset.setPenalty(renderInfo.penalty[dataset.getId()]);
    }
    // accum
    if (renderInfo.accum[dataset.getId()]) {
      dataset.accumulateValues();
    }
  }

  for (const component of renderInfo.lineCharts) {
    const ret = renderLineChart(canvas, renderInfo, component);
    if (typeof ret === 'string') return ret;
  }
  for (const component of renderInfo.barCharts) {
    const ret = renderBarChart(canvas, renderInfo, component);
    if (typeof ret === 'string') return ret;
  }
  for (const component of renderInfo.pieCharts) {
    const ret = renderPieChart(canvas, renderInfo, component);
    if (typeof ret === 'string') return ret;
  }
  for (const component of renderInfo.summaries) {
    const ret = renderSummary(canvas, renderInfo, component);
    if (typeof ret === 'string') return ret;
  }
  for (const component of renderInfo.bulletGraphs) {
    const ret = renderBulletGraph(canvas, renderInfo, component);
    if (typeof ret === 'string') return ret;
  }
  for (const component of renderInfo.month) {
    const ret = renderMonth(canvas, renderInfo, component);
    if (typeof ret === 'string') return ret;
  }
  for (const component of renderInfo.heatmaps) {
    const ret = renderHeatmap(canvas, renderInfo, component);
    if (typeof ret === 'string') return ret;
  }
};

export const renderErrorMessage = (
  canvas: HTMLElement,
  errorMessage: string
): void => {
  // TODO Remove graph not completed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const graph = d3.select(canvas).select('#svg').remove();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const svg = d3
    .select(canvas)
    .append('div')
    .text(errorMessage)
    .style('background-color', 'white')
    .style('margin-bottom', '20px')
    .style('padding', '10px')
    .style('color', 'red');
};

const Renderer = {
  render,
  renderErrorMessage,
};

export default Renderer;
