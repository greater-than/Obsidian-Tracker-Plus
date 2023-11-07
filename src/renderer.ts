import * as d3 from 'd3';
import { RenderInfo } from './models/render-info';
import { renderBarChart } from './ui-components/chart/bar-chart.renderer';
import { renderLineChart } from './ui-components/chart/line-chart.renderer';
import * as pie from './ui-components/chart/pie-chart.renderer';
import * as bullet from './ui-components/graph/bullet-graph.renderer';
import * as heatmap from './ui-components/heat-map/heat-map.renderer';
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
    if (dataset.query.usedAsXDataset) continue;
    // valueShift
    const shiftAmount = renderInfo.valueShift[dataset.id];
    if (shiftAmount !== null && shiftAmount !== 0) {
      dataset.shiftYValues(
        shiftAmount,
        renderInfo.shiftOnlyValueLargerThan[dataset.id]
      );
    }
    // penalty
    if (renderInfo.penalty[dataset.id] !== null) {
      dataset.setYPenalty(renderInfo.penalty[dataset.id]);
    }
    // accum
    if (renderInfo.accum[dataset.id]) {
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

export interface DebugOptions {
  logError: boolean; // Logs the error to the console
  clearLog: boolean; // Clears the log each time an error is written to the console
}

/**
 * Removes the 'svg' element and appends an error message to the provided container
 * @param {HTMLElement} container
 * @param {Error} error
 * @param {DebugOptions} options
 */
export const renderError = (
  container: HTMLElement,
  error: Error,
  options: DebugOptions = { logError: true, clearLog: true }
): void => {
  // TODO Remove graph not completed
  d3.select(container).select('#svg').remove();

  d3.select(container)
    .append('div')
    .text(`${error.message}`)
    .style('background-color', 'white')
    .style('margin-bottom', '20px')
    .style('padding', '10px')
    .style('color', 'red');

  // TODO implement env vars for debug options
  // TRACKER_LOG_ERROR=true|false
  // TRACKER_CLEAR_CONSOLE=true|false

  if (options?.logError) {
    if (options?.clearLog) console.clear();
    console.error(error.stack);
  }
};
