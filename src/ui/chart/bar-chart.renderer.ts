import { BarInfo, RenderInfo } from '../../models/data';
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
  barInfo: BarInfo
): string => {
  // console.log("renderBarChart");
  // console.log(renderInfo);
  if (!renderInfo || !barInfo) return;

  const elements = createAreas(canvas, renderInfo);

  renderTitle(elements, renderInfo, barInfo);

  renderXAxis(elements, renderInfo, barInfo);

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
    elements,
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

  if (elements.leftYAxis && elements.leftYScale) {
    for (const datasetId of datasetOnLeftYAxis) {
      const dataset = renderInfo.datasets.getDatasetById(datasetId);
      if (dataset.getQuery().usedAsXDataset) continue;

      renderBar(
        elements,
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
    elements,
    renderInfo,
    barInfo,
    'right',
    datasetOnRightYAxis
  );
  if (typeof retRenderRightYAxis === 'string') {
    return retRenderRightYAxis;
  }

  if (elements.rightYAxis && elements.rightYScale) {
    for (const datasetId of datasetOnRightYAxis) {
      const dataset = renderInfo.datasets.getDatasetById(datasetId);
      if (dataset.getQuery().usedAsXDataset) continue;

      renderBar(
        elements,
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
    renderLegend(elements, renderInfo, barInfo);
  }

  setChartScale(canvas, elements, renderInfo);
};
