import * as d3 from 'd3';
import { RenderInfo } from './models/data';
import {
  renderBarChart,
  renderBulletGraph,
  renderHeatmap,
  renderLineChart,
  renderMonth,
  renderPieChart,
  renderSummary,
} from './ui';

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

  for (const lineInfo of renderInfo.line) {
    const ret = renderLineChart(canvas, renderInfo, lineInfo);
    if (typeof ret === 'string') {
      return ret;
    }
  }
  for (const barInfo of renderInfo.bar) {
    const ret = renderBarChart(canvas, renderInfo, barInfo);
    if (typeof ret === 'string') {
      return ret;
    }
  }
  for (const pieInfo of renderInfo.pie) {
    const ret = renderPieChart(canvas, renderInfo, pieInfo);
    if (typeof ret === 'string') {
      return ret;
    }
  }
  for (const summaryInfo of renderInfo.summary) {
    const ret = renderSummary(canvas, renderInfo, summaryInfo);
    if (typeof ret === 'string') {
      return ret;
    }
  }
  for (const bulletInfo of renderInfo.bullet) {
    const ret = renderBulletGraph(canvas, renderInfo, bulletInfo);
    if (typeof ret === 'string') {
      return ret;
    }
  }
  for (const monthInfo of renderInfo.month) {
    const ret = renderMonth(canvas, renderInfo, monthInfo);
    if (typeof ret === 'string') {
      return ret;
    }
  }
  for (const heatmapInfo of renderInfo.heatmap) {
    const ret = renderHeatmap(canvas, renderInfo, heatmapInfo);
    if (typeof ret === 'string') {
      return ret;
    }
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
