import { ChartElements } from 'src/models/types';
import { HeatmapInfo, RenderInfo } from '../models/data';
import { createAreas, renderHeatmapDays, renderHeatmapHeader } from './helper';

export const renderHeatmap = (
  canvas: HTMLElement,
  renderInfo: RenderInfo,
  heatmapInfo: HeatmapInfo
) => {
  // console.log("renderHeatmap");
  // console.log(renderInfo);
  if (!renderInfo || !renderHeatmap) return;

  return 'Under construction';

  let elements: ChartElements = {};
  elements = createAreas(elements, canvas, renderInfo, heatmapInfo);

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const today = window.moment();

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const lastDataMonthDate = renderInfo.datasets.getDates().last();

  const datasetId = parseFloat(heatmapInfo.dataset);
  const dataset = renderInfo.datasets.getDatasetById(datasetId);

  renderHeatmapHeader(canvas, elements, renderInfo, heatmapInfo, dataset);

  renderHeatmapDays(canvas, elements, renderInfo, heatmapInfo, dataset);
};
