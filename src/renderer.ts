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

export const render = (
  container: HTMLElement,
  renderInfo: RenderInfo
): void => {
  const { datasets, valueShift, shiftOnlyValueLargerThan, accum } = renderInfo;

  // Data preprocessing
  for (const dataset of datasets) {
    if (dataset.query.usedAsXDataset) continue;
    // valueShift
    const shiftAmount = valueShift[dataset.id];
    if (shiftAmount !== null && shiftAmount !== 0)
      dataset.shiftValues(shiftAmount, shiftOnlyValueLargerThan[dataset.id]);

    // penalty
    if (renderInfo.penalty[dataset.id] !== null)
      dataset.setPenalty(renderInfo.penalty[dataset.id]);

    // accum
    if (accum[dataset.id]) dataset.accumulateValues();
  }
  const {
    lineCharts,
    barCharts,
    pieCharts,
    summaries,
    bulletGraphs,
    months,
    heatmaps,
  } = renderInfo;

  const args = [container, renderInfo] as const;

  lineCharts.forEach((component) => renderLineChart(...args, component));
  barCharts.forEach((component) => renderBarChart(...args, component));
  pieCharts.forEach((component) => renderPieChart(...args, component));
  summaries.forEach((component) => renderSummary(...args, component));
  bulletGraphs.forEach((component) => renderBulletGraph(...args, component));
  months.forEach((component) => renderMonth(...args, component));
  heatmaps.forEach((component) => renderHeatmap(...args, component));
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
export const renderErrorMessage = (
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

const Renderer = {
  render,
  renderErrorMessage,
};

export default Renderer;
