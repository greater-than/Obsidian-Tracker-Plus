import { BarChart } from '../../models/bar-chart';
import { RenderInfo } from '../../models/render-info';
import {
  createAreas,
  renderBar,
  renderLegend,
  renderTitle,
  renderXAxis,
  renderYAxis,
  setChartScale,
} from './helper';

export const renderBarChart = (
  canvas: HTMLElement,
  renderInfo: RenderInfo,
  component: BarChart
): string => {
  // console.log("renderBarChart");
  // console.log(renderInfo);
  if (!renderInfo || !component) return;

  const elements = createAreas(canvas, renderInfo);

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
      const dataset = renderInfo.datasets.getDatasetById(datasetId);
      if (dataset.getQuery().usedAsXDataset) continue;

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
      const dataset = renderInfo.datasets.getDatasetById(datasetId);
      if (dataset.getQuery().usedAsXDataset) continue;

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

  setChartScale(canvas, elements, renderInfo);
};
