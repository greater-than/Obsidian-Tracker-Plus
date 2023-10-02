import * as d3 from 'd3';
import { PieInfo, RenderInfo } from '../../models/data';
import { ChartElements } from '../../models/types';
import {
  createAreas,
  renderLegend,
  renderPie,
  renderTitle,
  setChartScale,
} from './helper';

export const renderPieChart = (
  canvas: HTMLElement,
  renderInfo: RenderInfo,
  pieInfo: PieInfo
) => {
  // console.log("renderPieChart");
  // console.log(renderInfo);
  if (!renderInfo || !pieInfo) return;

  // return "Under construction";

  let elements: ChartElements = {};
  elements = createAreas(elements, canvas, renderInfo, pieInfo);

  // Set default dataColor if no dataColor provided
  const defaultDataColor = d3.schemeSpectral[pieInfo.dataColor.length];
  for (let i = 0; i < pieInfo.dataColor.length; i++) {
    if (pieInfo.dataColor[i] === null) {
      pieInfo.dataColor[i] = defaultDataColor[i];
    }
  }

  renderTitle(canvas, elements, renderInfo, pieInfo);

  renderPie(canvas, elements, renderInfo, pieInfo);

  if (pieInfo.showLegend) {
    renderLegend(canvas, elements, renderInfo, pieInfo);
  }

  setChartScale(canvas, elements, renderInfo);
};
