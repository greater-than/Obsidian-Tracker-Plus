import { Heatmap } from '../../models/heatmap';
import { RenderInfo } from '../../models/render-info';
import { ChartElements } from '../../models/types';
import { TMoment, getMoment } from '../../utils/date-time.utils';
import { createAreas, renderHeatmapDays, renderHeatmapHeader } from './helper';

export const renderHeatmap = (
  canvas: HTMLElement,
  renderInfo: RenderInfo,
  component: Heatmap,
  moment?: TMoment
) => {
  // console.log("renderHeatmap");
  // console.log(renderInfo);
  if (!renderInfo || !renderHeatmap) return;

  return 'Under construction';

  let elements: ChartElements = {};
  elements = createAreas(elements, canvas, renderInfo, component);

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const today = getMoment(moment)();

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const lastDataMonthDate = renderInfo.datasets.dates.last();

  const datasetId = parseFloat(component.dataset);
  const dataset = renderInfo.datasets.getDataset(datasetId);

  renderHeatmapHeader(canvas, elements, renderInfo, component, dataset);
  renderHeatmapDays(canvas, elements, renderInfo, component, dataset);
};
