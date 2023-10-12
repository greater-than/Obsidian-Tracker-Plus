import * as d3 from 'd3';
import { RenderInfo } from '../../models/render-info';
import { UiUtils } from '../../utils';
import { createElements } from '../shared';
import { renderLegend, renderPie, renderTitle } from './pie-chart.helper';
import { PieChart } from './pie-chart.model';

export const renderPieChart = (
  container: HTMLElement,
  renderInfo: RenderInfo,
  component: PieChart
) => {
  if (!renderInfo || !component) return;

  const elements = createElements(container, renderInfo, {
    clearContents: true,
  });

  // Set default dataColor if no dataColor provided
  const defaultDataColor = d3.schemeSpectral[component.dataColor.length];
  for (let i = 0; i < component.dataColor.length; i++) {
    if (component.dataColor[i] === null) {
      component.dataColor[i] = defaultDataColor[i];
    }
  }

  renderTitle(elements, renderInfo, component);
  renderPie(elements, renderInfo, component);
  if (component.showLegend) renderLegend(elements, renderInfo, component);

  UiUtils.setScale(container, elements, renderInfo);
};
