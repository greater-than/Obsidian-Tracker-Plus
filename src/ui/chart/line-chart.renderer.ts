import { LineInfo, RenderInfo } from '../../models/data';
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
  lineInfo: LineInfo
): string => {
  // console.log("renderLineChart");
  // console.log(renderInfo);
  if (!renderInfo || !lineInfo) return;

  const elements = createAreas(canvas, renderInfo);

  renderTitle(elements, renderInfo, lineInfo);

  renderXAxis(elements, renderInfo, lineInfo);
  // console.log(elements.xAxis);
  // console.log(elements.xScale);
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

  const retRenderLeftYAxis = renderYAxis(
    elements,
    renderInfo,
    lineInfo,
    'left',
    datasetOnLeftYAxis
  );
  if (typeof retRenderLeftYAxis === 'string') {
    return retRenderLeftYAxis;
  }

  if (elements.leftYAxis && elements.leftYScale) {
    for (const datasetId of datasetOnLeftYAxis) {
      const dataset = renderInfo.datasets.getDatasetById(datasetId);
      if (dataset.getQuery().usedAsXDataset) continue;

      renderLine(elements, renderInfo, lineInfo, dataset, 'left');

      renderPoints(elements, renderInfo, lineInfo, dataset, 'left');
    }
  }

  const retRenderRightYAxis = renderYAxis(
    elements,
    renderInfo,
    lineInfo,
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

      renderLine(elements, renderInfo, lineInfo, dataset, 'right');

      renderPoints(elements, renderInfo, lineInfo, dataset, 'right');
    }
  }

  if (lineInfo.showLegend) {
    renderLegend(elements, renderInfo, lineInfo);
  }

  setChartScale(canvas, elements, renderInfo);
};
