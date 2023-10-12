import { RenderInfo } from '../../models/render-info';
import { createElements } from '../shared';
import { renderHeatmapDays, renderHeatmapHeader } from './heatmap.helper';
import { Heatmap } from './heatmap.model';

export const renderHeatmap = (
  container: HTMLElement,
  renderInfo: RenderInfo,
  component: Heatmap
) => {
  if (!renderInfo || !renderHeatmap) return;

  return 'Under construction';

  const elements = createElements(container, renderInfo, {
    clearContents: true,
  });

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const today = window.moment();

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const lastDataMonthDate = renderInfo.datasets.dates.last();

  const datasetId = parseFloat(component.dataset);
  const dataset = renderInfo.datasets.getDataset(datasetId);

  renderHeatmapHeader(container, elements, renderInfo, component, dataset);
  renderHeatmapDays(container, elements, renderInfo, component, dataset);
};
