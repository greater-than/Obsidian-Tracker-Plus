import { RenderInfo } from '../../models/render-info';
import {
  createAreas,
  renderLegend,
  renderLine,
  renderPoints,
  renderTitle,
  renderXAxis,
  renderYAxis,
  setChartScale,
} from './cartesian-chart.helper';
import { LineChart } from './line-chart.model';

export const renderLineChart = (
  canvas: HTMLElement,
  renderInfo: RenderInfo,
  lineInfo: LineChart
): string => {
  if (!renderInfo || !lineInfo) return;

  const chartElements = createAreas(canvas, renderInfo);

  renderTitle(chartElements, renderInfo, lineInfo);
  renderXAxis(chartElements, renderInfo, lineInfo);

  const datasetOnLeftYAxis = [];
  const datasetOnRightYAxis = [];
  const xDatasetIds = renderInfo.datasets.getXDatasetIds();
  for (let ind = 0; ind < lineInfo.yAxisLocation.length; ind++) {
    if (xDatasetIds.includes(ind)) continue;
    const yAxisLocation = lineInfo.yAxisLocation[ind];
    if (yAxisLocation.toLowerCase() === 'left') {
      datasetOnLeftYAxis.push(ind);
    } else if (yAxisLocation.toLocaleLowerCase() === 'right') {
      datasetOnRightYAxis.push(ind);
    }
  }

  renderYAxis(chartElements, renderInfo, lineInfo, 'left', datasetOnLeftYAxis);

  if (chartElements.leftYAxis && chartElements.leftYScale) {
    for (const datasetId of datasetOnLeftYAxis) {
      const dataset = renderInfo.datasets.getDatasetById(datasetId);
      if (dataset.query.usedAsXDataset) continue;
      renderLine(chartElements, renderInfo, lineInfo, dataset, 'left');
      renderPoints(chartElements, renderInfo, lineInfo, dataset, 'left');
    }
  }

  renderYAxis(
    chartElements,
    renderInfo,
    lineInfo,
    'right',
    datasetOnRightYAxis
  );

  if (chartElements.rightYAxis && chartElements.rightYScale) {
    for (const datasetId of datasetOnRightYAxis) {
      const dataset = renderInfo.datasets.getDatasetById(datasetId);
      if (dataset.query.usedAsXDataset) continue;
      renderLine(chartElements, renderInfo, lineInfo, dataset, 'right');
      renderPoints(chartElements, renderInfo, lineInfo, dataset, 'right');
    }
  }

  if (lineInfo.showLegend) renderLegend(chartElements, renderInfo, lineInfo);

  setChartScale(canvas, chartElements, renderInfo);
};
