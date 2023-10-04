import * as d3 from 'd3';
import { PieChart } from '../../models/pie-chart';
import { RenderInfo } from '../../models/render-info';
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
  chart: PieChart
) => {
  // console.log("renderPieChart");
  // console.log(renderInfo);
  if (!renderInfo || !chart) return;

  // return "Under construction";

  let elements: ChartElements = {};
  elements = createAreas(elements, canvas, renderInfo, chart);

  // Set default dataColor if no dataColor provided
  const defaultDataColor = d3.schemeSpectral[chart.dataColor.length];
  for (let i = 0; i < chart.dataColor.length; i++) {
    if (chart.dataColor[i] === null) {
      chart.dataColor[i] = defaultDataColor[i];
    }
  }

  renderTitle(canvas, elements, renderInfo, chart);
  renderPie(canvas, elements, renderInfo, chart);
  if (chart.showLegend) renderLegend(canvas, elements, renderInfo, chart);

  setChartScale(canvas, elements, renderInfo);
};
