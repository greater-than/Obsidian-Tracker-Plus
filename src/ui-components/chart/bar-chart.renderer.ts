import {
  createAreas,
  renderBar,
  renderLegend,
  renderTitle,
  renderXAxis,
  renderYAxis,
  setChartScale,
} from './cartesian-chart.helper';

import { RenderInfo } from '../../models/render-info';
import { BarChart } from './bar-chart.model';

export const renderBarChart = (
  canvas: HTMLElement,
  renderInfo: RenderInfo,
  barInfo: BarChart
): string => {
  // console.log("renderBarChart");
  // console.log(renderInfo);
  if (!renderInfo || !barInfo) return;

  const chartElements = createAreas(canvas, renderInfo);

  renderTitle(chartElements, renderInfo, barInfo);

  renderXAxis(chartElements, renderInfo, barInfo);

  const datasetOnLeftYAxis = [];
  const datasetOnRightYAxis = [];
  const xDatasetIds = renderInfo.datasets.getXDatasetIds();
  for (let ind = 0; ind < barInfo.yAxisLocation.length; ind++) {
    if (xDatasetIds.includes(ind)) continue;
    const yAxisLocation = barInfo.yAxisLocation[ind];
    if (yAxisLocation.toLowerCase() === 'left') {
      datasetOnLeftYAxis.push(ind);
    } else if (yAxisLocation.toLocaleLowerCase() === 'right') {
      // right
      datasetOnRightYAxis.push(ind);
    }
  }

  const retRenderLeftYAxis = renderYAxis(
    chartElements,
    renderInfo,
    barInfo,
    'left',
    datasetOnLeftYAxis
  );
  if (typeof retRenderLeftYAxis === 'string') {
    return retRenderLeftYAxis;
  }

  const totalNumOfBarSets =
    datasetOnLeftYAxis.length + datasetOnRightYAxis.length;
  let currBarSet = 0;

  if (chartElements.leftYAxis && chartElements.leftYScale) {
    for (const datasetId of datasetOnLeftYAxis) {
      const dataset = renderInfo.datasets.getDatasetById(datasetId);
      if (dataset.query.usedAsXDataset) continue;

      renderBar(
        chartElements,
        renderInfo,
        barInfo,
        dataset,
        'left',
        currBarSet,
        totalNumOfBarSets
      );

      currBarSet++;
    }
  }

  const retRenderRightYAxis = renderYAxis(
    chartElements,
    renderInfo,
    barInfo,
    'right',
    datasetOnRightYAxis
  );
  if (typeof retRenderRightYAxis === 'string') {
    return retRenderRightYAxis;
  }

  if (chartElements.rightYAxis && chartElements.rightYScale) {
    for (const datasetId of datasetOnRightYAxis) {
      const dataset = renderInfo.datasets.getDatasetById(datasetId);
      if (dataset.query.usedAsXDataset) continue;

      renderBar(
        chartElements,
        renderInfo,
        barInfo,
        dataset,
        'right',
        currBarSet,
        totalNumOfBarSets
      );

      currBarSet++;
    }
  }

  if (barInfo.showLegend) {
    renderLegend(chartElements, renderInfo, barInfo);
  }

  setChartScale(canvas, chartElements, renderInfo);
};
