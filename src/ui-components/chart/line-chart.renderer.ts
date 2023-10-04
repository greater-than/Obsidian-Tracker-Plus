import { LineChart } from '../../models/line-chart';
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
} from './helper';

export const renderLineChart = (
  canvas: HTMLElement,
  renderInfo: RenderInfo,
  component: LineChart
): string => {
  // console.log("renderLineChart");
  // console.log(renderInfo);
  if (!renderInfo || !component) return;

  const elements = createAreas(canvas, renderInfo);

  renderTitle(elements, renderInfo, component);

  renderXAxis(elements, renderInfo, component);
  // console.log(elements.xAxis);
  // console.log(elements.xScale);
  const datasetOnLeftYAxis = [];
  const datasetOnRightYAxis = [];
  const xDatasetIds = renderInfo.datasets.getXDatasetIds();
  for (let ind = 0; ind < component.yAxisLocation.length; ind++) {
    if (xDatasetIds.includes(ind)) continue;
    const yAxisLocation = component.yAxisLocation[ind];
    if (yAxisLocation.toLowerCase() === 'left') {
      datasetOnLeftYAxis.push(ind);
    } else if (yAxisLocation.toLocaleLowerCase() === 'right') {
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

  if (elements.leftYAxis && elements.leftYScale) {
    for (const datasetId of datasetOnLeftYAxis) {
      const dataset = renderInfo.datasets.getDatasetById(datasetId);
      if (dataset.getQuery().usedAsXDataset) continue;

      renderLine(elements, renderInfo, component, dataset, 'left');
      renderPoints(elements, renderInfo, component, dataset, 'left');
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
      const dataset = renderInfo.datasets.getDatasetById(datasetId);
      if (dataset.getQuery().usedAsXDataset) continue;

      renderLine(elements, renderInfo, component, dataset, 'right');
      renderPoints(elements, renderInfo, component, dataset, 'right');
    }
  }

  if (component.showLegend) {
    renderLegend(elements, renderInfo, component);
  }

  setChartScale(canvas, elements, renderInfo);
};
