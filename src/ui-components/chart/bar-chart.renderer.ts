import {
  createAreas as createElements,
  renderBar,
  renderLegend,
  renderTitle,
  renderXAxis,
  renderYAxis,
  setChartScale,
} from './cartesian-chart.helper';

import { Position } from '../../enums';
import { RenderInfo } from '../../models/render-info';
import { BarChart } from './bar-chart.model';

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
    if (yAxisLocation.toLowerCase() === Position.LEFT)
      datasetOnLeftYAxis.push(ind);
    else if (yAxisLocation.toLocaleLowerCase() === Position.RIGHT)
      datasetOnRightYAxis.push(ind);
  }

  renderYAxis(elements, renderInfo, component, 'left', datasetOnLeftYAxis);

  const totalNumOfBarSets =
    datasetOnLeftYAxis.length + datasetOnRightYAxis.length;
  let currBarSet = 0;

  if (elements.leftYAxis && elements.leftYScale) {
    for (const datasetId of datasetOnLeftYAxis) {
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

  renderYAxis(elements, renderInfo, component, 'right', datasetOnRightYAxis);

  if (elements.rightYAxis && elements.rightYScale) {
    for (const datasetId of datasetOnRightYAxis) {
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

  if (component.showLegend) {
    renderLegend(elements, renderInfo, component);
  }

  setChartScale(container, elements, renderInfo);
};
