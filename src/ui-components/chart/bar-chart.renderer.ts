import { createElements } from './cartesian-chart.helper';
import {
  renderLegend,
  renderTitle,
  renderXAxis,
  renderYAxis,
} from './cartesian-chart.renderer';

import { Position } from '../../enums';
import { DataPoint } from '../../models/data-point.model';
import { Dataset } from '../../models/dataset';
import { RenderInfo } from '../../models/render-info';
import { ComponentElements } from '../../models/types';
import { setScale } from '../../utils/ui.utils';
import { BarChart } from './bar-chart.model';

/**
 * @summary Renders a bar chart
 * @param {HTMLElement} container
 * @param {RenderInfo} renderInfo
 * @param {BarChart} component
 */
export const renderBarChart = (
  container: HTMLElement,
  renderInfo: RenderInfo,
  component: BarChart
): void => {
  if (!renderInfo || !component) return;

  const elements = createElements(container, renderInfo);

  renderTitle(elements, renderInfo, component);
  renderXAxis(elements, renderInfo, component);

  const leftAxisDataset = [];
  const rightAxisDataset = [];
  const xDatasetIds = renderInfo.datasets.getXDatasetIds();
  for (let ind = 0; ind < component.yAxisLocation.length; ind++) {
    if (xDatasetIds.includes(ind)) continue;
    const yAxisLocation = component.yAxisLocation[ind];
    if (yAxisLocation.toLowerCase() === Position.LEFT)
      leftAxisDataset.push(ind);
    else if (yAxisLocation.toLocaleLowerCase() === Position.RIGHT)
      rightAxisDataset.push(ind);
  }

  renderYAxis(elements, renderInfo, component, 'left', leftAxisDataset);

  const totalNumOfBarSets = leftAxisDataset.length + rightAxisDataset.length;
  let currBarSet = 0;

  if (elements.leftYAxis && elements.leftYScale) {
    for (const datasetId of leftAxisDataset) {
      const dataset = renderInfo.datasets.getDatasetById(datasetId);
      if (dataset.query.usedAsXDataset) continue;
      renderBar(
        elements,
        renderInfo,
        component,
        dataset,
        'left',
        currBarSet,
        totalNumOfBarSets
      );
      currBarSet++;
    }
  }

  renderYAxis(elements, renderInfo, component, 'right', rightAxisDataset);

  if (elements.rightYAxis && elements.rightYScale) {
    for (const datasetId of rightAxisDataset) {
      const dataset = renderInfo.datasets.getDatasetById(datasetId);
      if (dataset.query.usedAsXDataset) continue;
      renderBar(
        elements,
        renderInfo,
        component,
        dataset,
        'right',
        currBarSet,
        totalNumOfBarSets
      );
      currBarSet++;
    }
  }

  if (component.showLegend) renderLegend(elements, renderInfo, component);

  setScale(container, elements, renderInfo);
};

/**
 * @summary Renders a single bar for a bar chart
 * @param {ComponentElements} elements
 * @param {RenderInfo} renderInfo
 * @param {BarChart} component
 * @param {Dataset} dataset
 * @param {string} yAxisPosition
 * @param {number} currBarSet
 * @param {number} totalNumOfBarSets
 * @returns
 */
export const renderBar = (
  elements: ComponentElements,
  renderInfo: RenderInfo,
  component: BarChart,
  dataset: Dataset,
  yAxisPosition: string,
  currBarSet: number,
  totalNumOfBarSets: number
): void => {
  if (!renderInfo || !component) return;

  const barGap = 1;
  const barSetWidth = renderInfo.dataAreaSize.width / dataset.values.length;
  let barWidth = barSetWidth;
  if (barSetWidth - barGap > 0) {
    barWidth = barSetWidth - barGap;
  }
  barWidth = barWidth / totalNumOfBarSets;

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const portionLeft = (currBarSet + 1) / totalNumOfBarSets;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let yScale: any = null;
  if (yAxisPosition === 'left') {
    yScale = elements.leftYScale;
  } else if (yAxisPosition === 'right') {
    yScale = elements.rightYScale;
  }

  const bars = elements.dataArea
    .selectAll('bar')
    .data(Array.from(dataset).filter((p: DataPoint) => p.value !== null))
    .enter()
    .append('rect')
    .attr('x', (p: DataPoint, i: number) => {
      if (i === 0) {
        const portionVisible = currBarSet + 1 - totalNumOfBarSets / 2;
        if (portionVisible < 1) {
          return (
            elements.xScale(p.date) -
            barSetWidth / 2 +
            currBarSet * barWidth +
            portionVisible * barWidth
          );
        }
      }
      return elements.xScale(p.date) - barSetWidth / 2 + currBarSet * barWidth;
    })
    .attr('y', (p: DataPoint) => yScale(Math.max(p.value, 0)))
    .attr('width', (p: DataPoint, i: number) => {
      if (i === 0) {
        const portionVisible = currBarSet + 1 - totalNumOfBarSets / 2;
        if (portionVisible < 0) {
          return 0;
        } else if (portionVisible < 1) {
          return barWidth * portionVisible;
        }
        return barWidth;
      } else if (i === dataset.values.length - 1) {
        const portionVisible = 1 - (currBarSet + 1 - totalNumOfBarSets / 2);
        if (portionVisible < 0) {
          return 0;
        } else if (portionVisible < 1) {
          return barWidth * portionVisible;
        }
        return barWidth;
      }
      return barWidth;
    })
    .attr('height', (p: DataPoint) => {
      if (p.value !== null) {
        return Math.abs(yScale(p.value) - yScale(0));
      }
    })
    .attr('class', 'tracker-bar');

  if (component.barColor[dataset.id]) {
    bars.style('fill', component.barColor[dataset.id]);
  }
};
