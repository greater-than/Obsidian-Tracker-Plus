import { Dataset } from '../../models/dataset';
import { RenderInfo } from '../../models/render-info';
import { ChartElements } from '../../models/types';
import { UiUtils } from '../../utils';
import { createElements } from '../shared';
import { BarChart } from './bar-chart.model';
import {
  renderLegend,
  renderTitle,
  renderXAxis,
  renderYAxis,
} from './chart.helper';
import { DataPoint } from './data-point.model';

export const renderBarChart = (
  container: HTMLElement,
  renderInfo: RenderInfo,
  component: BarChart
): string => {
  if (!renderInfo || !component) return;

  const elements = createElements(container, renderInfo);

  renderTitle(elements, renderInfo, component);

  renderXAxis(elements, renderInfo, component);

  const datasetOnLeftYAxis = [];
  const datasetOnRightYAxis = [];
  const xDatasetIds = renderInfo.datasets.getXDatasetIds();
  for (let ind = 0; ind < component.yAxisLocation.length; ind++) {
    if (xDatasetIds.includes(ind)) continue;
    const yAxisLocation = component.yAxisLocation[ind];
    if (yAxisLocation.toLowerCase() === 'left') {
      datasetOnLeftYAxis.push(ind);
    } else if (yAxisLocation.toLocaleLowerCase() === 'right') {
      // right
      datasetOnRightYAxis.push(ind);
    }
  }

  const renderLeftYAxis = renderYAxis(
    elements,
    renderInfo,
    component,
    'left',
    datasetOnLeftYAxis
  );
  if (typeof renderLeftYAxis === 'string') {
    return renderLeftYAxis;
  }

  const totalNumOfBarSets =
    datasetOnLeftYAxis.length + datasetOnRightYAxis.length;
  let currBarSet = 0;

  if (elements.leftYAxis && elements.leftYScale) {
    for (const datasetId of datasetOnLeftYAxis) {
      const dataset = renderInfo.datasets.getDataset(datasetId);
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

  const renderRightYAxis = renderYAxis(
    elements,
    renderInfo,
    component,
    'right',
    datasetOnRightYAxis
  );
  if (typeof renderRightYAxis === 'string') {
    return renderRightYAxis;
  }

  if (elements.rightYAxis && elements.rightYScale) {
    for (const datasetId of datasetOnRightYAxis) {
      const dataset = renderInfo.datasets.getDataset(datasetId);
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

  if (component.showLegend) {
    renderLegend(elements, renderInfo, component);
  }

  UiUtils.setScale(container, elements, renderInfo);
};

export const renderBar = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: BarChart,
  dataset: Dataset,
  yAxisLocation: string,
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
  if (yAxisLocation === 'left') {
    yScale = elements.leftYScale;
  } else if (yAxisLocation === 'right') {
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
