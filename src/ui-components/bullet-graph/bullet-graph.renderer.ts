import { Orientation } from 'src/enums';
import { RenderInfo } from '../../models/render-info';
import { UiUtils } from '../../utils';
import { createElements } from '../shared';
import {
  renderAxis,
  renderBackPanel,
  renderBar,
  renderMark,
  renderTitle,
} from './bullet-graph.helper';
import { BulletGraph } from './bullet-graph.model';

// Bullet graph https://en.wikipedia.org/wiki/Bullet_graph
export const renderBulletGraph = (
  container: HTMLElement,
  renderInfo: RenderInfo,
  component: BulletGraph
): string => {
  if (!renderInfo || !component) return;

  // Set initial dataArea size
  if (component.orientation === Orientation.HORIZONTAL) {
    renderInfo.dataAreaSize = { width: 250, height: 24 };
  } else if (component.orientation === Orientation.VERTICAL) {
    renderInfo.dataAreaSize = { width: 24, height: 250 };
  }

  const elements = createElements(container, renderInfo);

  // TODO retRenderAxis is undefined?
  const renderedAxis = renderAxis(elements, renderInfo, component);

  if (typeof renderedAxis === 'string') return renderedAxis;

  renderTitle(elements, renderInfo, component, {
    titleSpacing: 6,
    titleCssClass: 'tracker-title-small',
  });
  renderBackPanel(elements, renderInfo, component);

  const renderedBar = renderBar(elements, renderInfo, component);
  if (typeof renderedBar === 'string') return renderedBar;

  renderMark(elements, renderInfo, component);
  UiUtils.setScale(container, elements, renderInfo);
};
