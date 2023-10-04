import { BulletGraph } from '../../models/bullet-graph';
import { RenderInfo } from '../../models/render-info';
import {
  createAreas,
  renderAxis,
  renderBackPanel,
  renderBar,
  renderMark,
  renderTitle,
  setScale,
} from './helper';

// Bullet graph https://en.wikipedia.org/wiki/Bullet_graph
export const renderBulletGraph = (
  canvas: HTMLElement,
  renderInfo: RenderInfo,
  component: BulletGraph
): string => {
  // console.log("renderBullet");
  // console.log(renderInfo);
  if (!renderInfo || !component) return;

  const datasetId = parseFloat(component.dataset);
  const dataset = renderInfo.datasets.getDatasetById(datasetId);

  // Set initial dataArea size
  if (component.orientation === 'horizontal') {
    renderInfo.dataAreaSize = { width: 250, height: 24 };
  } else if (component.orientation === 'vertical') {
    renderInfo.dataAreaSize = { width: 24, height: 250 };
  }

  const elements = createAreas(canvas, renderInfo, component);

  // TODO retRenderAxis is undefined?
  const renderedAxis = renderAxis(elements, renderInfo, component, dataset);

  if (typeof renderedAxis === 'string') return renderedAxis;

  renderTitle(elements, renderInfo, component);
  renderBackPanel(elements, renderInfo, component, dataset);

  const renderedBar = renderBar(elements, renderInfo, component, dataset);
  if (typeof renderedBar === 'string') return renderedBar;

  renderMark(elements, renderInfo, component, dataset);
  setScale(canvas, elements, renderInfo);
};
