import { BulletInfo, RenderInfo } from '../../models/data';
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
  bulletInfo: BulletInfo
): string => {
  // console.log("renderBullet");
  // console.log(renderInfo);
  if (!renderInfo || !bulletInfo) return;

  const datasetId = parseFloat(bulletInfo.dataset);
  const dataset = renderInfo.datasets.getDatasetById(datasetId);

  // Set initial dataArea size
  if (bulletInfo.orientation === 'horizontal') {
    renderInfo.dataAreaSize = { width: 250, height: 24 };
  } else if (bulletInfo.orientation === 'vertical') {
    renderInfo.dataAreaSize = { width: 24, height: 250 };
  }

  const elements = createAreas(canvas, renderInfo, bulletInfo);

  // TODO retRenderAxis is undefined?
  const retRenderAxis = renderAxis(elements, renderInfo, bulletInfo, dataset);

  if (typeof retRenderAxis === 'string') return retRenderAxis;

  renderTitle(elements, renderInfo, bulletInfo);
  renderBackPanel(elements, renderInfo, bulletInfo, dataset);

  const retRenderBar = renderBar(elements, renderInfo, bulletInfo, dataset);
  if (typeof retRenderBar === 'string') return retRenderBar;

  renderMark(elements, renderInfo, bulletInfo, dataset);
  setScale(canvas, elements, renderInfo);
};
