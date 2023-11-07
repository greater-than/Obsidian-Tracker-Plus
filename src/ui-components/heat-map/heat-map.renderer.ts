import * as d3 from 'd3';
import { Dataset } from '../../models/dataset';
import { RenderInfo } from '../../models/render-info';
import { ComponentElements } from '../../models/types';
import * as helper from '../../utils/helper';
import { HeatMap } from './heat-map.model';

interface DayInfo {
  date: string;
  value: number;
  scaledValue: number;
  row: number;
  col: number;
}

const createAreas = (
  chartElements: ComponentElements,
  canvas: HTMLElement,
  renderInfo: RenderInfo,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _heatmapInfo: HeatMap
): ComponentElements => {
  // clean areas
  d3.select(canvas).select('#svg').remove();
  const props = Object.getOwnPropertyNames(chartElements);
  for (let i = 0; i < props.length; i++) {
    // d3.select(chartElements[props[i]]).remove();
    delete chartElements[props[i]];
  }
  // console.log(chartElements);

  // whole area for plotting, includes margins
  const svg = d3
    .select(canvas)
    .append('svg')
    .attr('id', 'svg')
    .attr(
      'width',
      renderInfo.dataAreaSize.width +
        renderInfo.margin.left +
        renderInfo.margin.right
    )
    .attr(
      'height',
      renderInfo.dataAreaSize.height +
        renderInfo.margin.top +
        renderInfo.margin.bottom
    );
  chartElements['svg'] = svg;

  // graphArea, includes chartArea, title, legend
  const graphArea = svg
    .append('g')
    .attr('id', 'graphArea')
    .attr(
      'transform',
      'translate(' + renderInfo.margin.left + ',' + renderInfo.margin.top + ')'
    )
    .attr('width', renderInfo.dataAreaSize.width + renderInfo.margin.right)
    .attr('height', renderInfo.dataAreaSize.height + renderInfo.margin.bottom);
  chartElements['graphArea'] = graphArea;

  // dataArea, under graphArea, includes points, lines, xAxis, yAxis
  const dataArea = graphArea
    .append('g')
    .attr('id', 'dataArea')
    .attr('width', renderInfo.dataAreaSize.width)
    .attr('height', renderInfo.dataAreaSize.height);
  chartElements['dataArea'] = dataArea;

  return chartElements;
};

const renderHeatmapHeader = (
  _canvas: HTMLElement,
  _chartElements: ComponentElements,
  renderInfo: RenderInfo,
  heatmapInfo: HeatMap,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _dataset: Dataset
): void => {
  // console.log("renderMonthHeader")

  if (!renderInfo || !heatmapInfo) return;
  // TODO What does this do?
};

const renderHeatmapDays = (
  _canvas: HTMLElement,
  chartElements: ComponentElements,
  renderInfo: RenderInfo,
  heatmapInfo: HeatMap,
  dataset: Dataset
) => {
  // console.log("renderHeatmapDays");

  if (!renderInfo || !heatmapInfo) return;

  const cellSize = 20;
  const dotRadius = (cellSize / 2.0) * 0.6;

  // Get min and max, null values will be treated as zero here
  let yMin = d3.min(dataset.values);
  if (heatmapInfo.yMin !== null) {
    yMin = heatmapInfo.yMin;
  }
  let yMax = d3.max(dataset.values);
  if (heatmapInfo.yMax !== null) {
    yMax = heatmapInfo.yMax;
  }
  // console.log(`yMin:${yMin}, yMax:${yMax}`);

  // Prepare data for graph
  const daysInHeatmapView: Array<DayInfo> = [];
  const dataStartDate = dataset.startDate.clone();
  let startDate = dataStartDate.clone().subtract(dataStartDate.day(), 'days');
  if (heatmapInfo.startWeekOn.toLowerCase() === 'mon') {
    startDate = startDate.add(1, 'days');
  }
  const dataEndDate = dataset.endDate.clone();
  let endDate = dataEndDate.clone().add(7 - dataEndDate.day() - 1, 'days');
  if (heatmapInfo.startWeekOn.toLowerCase() === 'mon') {
    endDate = endDate.add(1, 'days');
  }
  // console.log(startDate.format("YYYY-MM-DD"));
  // console.log(endDate.format("YYYY-MM-DD"));

  let indCol = 0;
  let indRow = 0;
  let ind = 0;
  for (
    let curDate = startDate.clone();
    curDate <= endDate;
    curDate.add(1, 'days')
  ) {
    if (heatmapInfo.startWeekOn.toLowerCase() === 'mon') {
      indCol = curDate.day() - 1;
      if (indCol < 0) {
        indCol = 6;
      }
      indRow = Math.floor(ind / 7);
    } else {
      indCol = curDate.day(); // 0~6
      indRow = Math.floor(ind / 7);
    }

    // curValue and scaledValue
    const curValue = dataset.getValue(curDate);
    let scaledValue = 0;
    if (Number.isNumber(yMax) && Number.isNumber(yMin) && yMax - yMin > 0) {
      scaledValue = (curValue - yMin) / (yMax - yMin);
    }

    daysInHeatmapView.push({
      date: helper.dateToStr(curDate, renderInfo.dateFormat),
      value: curValue,
      scaledValue: scaledValue,
      row: indRow,
      col: indCol,
    });

    ind++;
  }
  // console.log(daysInHeatmapView);

  // scale
  const totalDayBlockWidth = (indCol + 1) * cellSize;

  // TODO Remove const?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const totalBlockHeight = (indRow + 1) * cellSize;

  const scale = d3
    .scaleLinear()
    .domain([-0.5, 6.5])
    .range([0, totalDayBlockWidth]);

  // circles
  let heatmapColor = '#69b3a2';
  if (heatmapInfo.color) {
    heatmapColor = heatmapInfo.color;
  }

  // days, shown as dots or squares
  chartElements.dataArea
    .selectAll('dot')
    .data(daysInHeatmapView)
    .enter()
    .append('circle')
    .attr('r', dotRadius)
    .attr('cx', (d: DayInfo) => {
      return scale(d.col);
    })
    .attr('cy', (d: DayInfo) => {
      return scale(d.row);
    })
    .style('fill', (d: DayInfo) => {
      return d3.interpolateLab('white', heatmapColor)(d.scaledValue);
    })
    .style('cursor', 'default');

  // Expand areas
  const svgWidth = parseFloat(chartElements.svg.attr('width'));
  const svgHeight = parseFloat(chartElements.svg.attr('height'));
  const graphAreaWidth = parseFloat(chartElements.graphArea.attr('width'));
  const graphAreaHeight = parseFloat(chartElements.graphArea.attr('height'));
  const totalHeight = (indRow + 2) * cellSize; // + parseFloat(chartElements.header.attr("height"));
  const totalWidth = (indCol + 1) * cellSize;
  if (totalHeight > svgHeight) {
    helper.expandArea(chartElements.svg, 0, totalHeight - svgHeight);
  }
  if (totalWidth > svgWidth) {
    helper.expandArea(chartElements.svg, totalWidth - svgWidth, 0);
  }
  if (totalHeight > graphAreaHeight) {
    helper.expandArea(
      chartElements.graphArea,
      0,
      totalHeight - graphAreaHeight
    );
  }
  if (totalWidth > graphAreaWidth) {
    helper.expandArea(chartElements.svg, totalWidth - graphAreaWidth, 0);
  }
};

export const renderHeatmap = (
  canvas: HTMLElement,
  renderInfo: RenderInfo,
  heatmapInfo: HeatMap
) => {
  // console.log("renderHeatmap");
  // console.log(renderInfo);
  if (!renderInfo || !renderHeatmap) return;

  return 'Under construction';

  let chartElements: ComponentElements = {};
  chartElements = createAreas(chartElements, canvas, renderInfo, heatmapInfo);

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const today = window.moment();

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const lastDataMonthDate = renderInfo.datasets.dates.last();

  const datasetId = parseFloat(heatmapInfo.dataset);
  const dataset = renderInfo.datasets.getDatasetById(datasetId);

  renderHeatmapHeader(canvas, chartElements, renderInfo, heatmapInfo, dataset);

  renderHeatmapDays(canvas, chartElements, renderInfo, heatmapInfo, dataset);
};
