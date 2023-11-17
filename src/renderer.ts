import * as d3 from 'd3';
import { RenderInfo } from './models/render-info';
import { renderBarChart } from './ui-components/chart/bar-chart.renderer';
import { renderLineChart } from './ui-components/chart/line-chart.renderer';
import { renderPieChart } from './ui-components/chart/pie-chart.renderer';
import { renderBulletGraph } from './ui-components/graph/bullet-graph.renderer';
import { renderHeatMap } from './ui-components/heat-map/heat-map.renderer';
import { renderMonth } from './ui-components/month-view/month-view.renderer';
import { renderSummary } from './ui-components/summary/summary.renderer';

export const renderTracker = (
  container: HTMLElement,
  renderInfo: RenderInfo
): void => {
  const { valueShift, shiftOnlyValueLargerThan, penalty, accum } = renderInfo;

  // Data pre-processing
  for (const dataset of renderInfo.datasets) {
    if (dataset.query.usedAsXDataset) continue;

    // valueShift
    const shiftAmount = valueShift[dataset.id];
    if (shiftAmount !== null && shiftAmount !== 0)
      dataset.shiftValues(shiftAmount, shiftOnlyValueLargerThan[dataset.id]);

    // penalty
    if (penalty[dataset.id] !== null) dataset.setYPenalty(penalty[dataset.id]);

    // accum
    if (accum[dataset.id]) dataset.accumulateValues();
  }

  const { line, bar, pie, summary, bullet, month, heatmap } = renderInfo;
  const args = [container, renderInfo] as const;

  line.forEach((component) => renderLineChart(...args, component));
  bar.forEach((component) => renderBarChart(...args, component));
  pie.forEach((component) => renderPieChart(...args, component));
  summary.forEach((component) => renderSummary(...args, component));
  bullet.forEach((component) => renderBulletGraph(...args, component));
  month.forEach((component) => renderMonth(...args, component));
  heatmap.forEach((component) => renderHeatMap(...args, component));
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
