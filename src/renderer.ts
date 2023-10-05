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
    if (dataset.query.usedAsXDataset) continue;
    // valueShift
    const shiftAmount = renderInfo.valueShift[dataset.id];
    if (shiftAmount !== null && shiftAmount !== 0) {
      dataset.shiftValues(
        shiftAmount,
        renderInfo.shiftOnlyValueLargerThan[dataset.id]
      );
    }
    // penalty
    if (renderInfo.penalty[dataset.id] !== null) {
      dataset.setPenalty(renderInfo.penalty[dataset.id]);
    }
    // accum
    if (renderInfo.accum[dataset.id]) {
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
  for (const component of renderInfo.months) {
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
