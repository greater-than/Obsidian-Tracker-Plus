import * as d3 from 'd3';
import { RenderInfo } from './models/render-info';
import { renderBarChart } from './ui-components/chart/bar-chart.renderer';
import { renderLineChart } from './ui-components/chart/line-chart.renderer';
import * as pie from './ui-components/chart/pie-chart.renderer';
import * as bullet from './ui-components/graph/bullet-graph.renderer';
import * as heatmap from './ui-components/heatmap/heatmap.renderer';
import * as month from './ui-components/month/month.renderer';
import * as summary from './ui-components/summary/summary.renderer';

export const renderTracker = (
  canvas: HTMLElement,
  renderInfo: RenderInfo
): string => {
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
    const ret = pie.renderPieChart(canvas, renderInfo, pieInfo);
    if (typeof ret === 'string') {
      return ret;
    }
  }
  for (const summaryInfo of renderInfo.summary) {
    const ret = summary.renderSummary(canvas, renderInfo, summaryInfo);
    if (typeof ret === 'string') {
      return ret;
    }
  }
  for (const bulletInfo of renderInfo.bullet) {
    const ret = bullet.renderBulletGraph(canvas, renderInfo, bulletInfo);
    if (typeof ret === 'string') {
      return ret;
    }
  }
  for (const monthInfo of renderInfo.month) {
    const ret = month.renderMonth(canvas, renderInfo, monthInfo);
    if (typeof ret === 'string') {
      return ret;
    }
  }
  for (const heatmapInfo of renderInfo.heatmap) {
    const ret = heatmap.renderHeatmap(canvas, renderInfo, heatmapInfo);
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
