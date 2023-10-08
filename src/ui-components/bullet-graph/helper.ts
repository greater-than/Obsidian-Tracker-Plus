import * as d3 from 'd3';
import { BulletGraph } from '../../models/bullet-graph';
import { Dataset } from '../../models/dataset';
import { RenderInfo } from '../../models/render-info';
import { ChartElements } from '../../models/types';
import Resolver from '../../resolver/resolver';
import { ChartUtils, DomUtils } from '../../utils';

/**
 * Create Areas
 * @param canvas
 * @param renderInfo
 * @param component
 * @returns
 */
export const createAreas = (
  canvas: HTMLElement,
  renderInfo: RenderInfo,
  component: BulletGraph
): ChartElements => {
  const elements: ChartElements = {};
  // whole area for plotting, includes margins
  if (!renderInfo || !component) return;

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
  elements['svg'] = svg;

  // graphArea, includes chartArea, title, legend
  const graphArea = svg
    .append('g')
    .attr('id', 'graphArea')
    .attr(
      'transform',
      `translate(${renderInfo.margin.left}, ${renderInfo.margin.top})`
    )
    .attr('width', renderInfo.dataAreaSize.width + renderInfo.margin.right)
    .attr('height', renderInfo.dataAreaSize.height + renderInfo.margin.bottom);
  elements['graphArea'] = graphArea;

  // dataArea, under graphArea, includes points, lines, xAxis, yAxis
  const dataArea = graphArea
    .append('g')
    .attr('id', 'dataArea')
    .attr('width', renderInfo.dataAreaSize.width)
    .attr('height', renderInfo.dataAreaSize.height);
  elements['dataArea'] = dataArea;

  return elements;
};

/**
 * Set Chart Scale
 * @param canvas
 * @param elements
 * @param renderInfo
 */
export const setScale = (
  canvas: HTMLElement,
  elements: ChartElements,
  renderInfo: RenderInfo
): void => {
  const selection = d3.select(canvas);
  const svg = elements.svg;
  const svgWidth = parseFloat(svg.attr('width'));
  const svgHeight = parseFloat(svg.attr('height'));
  svg
    .attr('width', null)
    .attr('height', null)
    .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  if (renderInfo.fitPanelWidth) {
    selection.style('width', '100%');
  } else {
    selection.style(
      'width',
      (svgWidth * renderInfo.fixedScale).toString() + 'px'
    );
    selection.style(
      'height',
      (svgHeight * renderInfo.fixedScale).toString() + 'px'
    );
  }
};

/**
 * Render Title
 * @param elements
 * @param renderInfo
 * @param component
 * @returns
 */
export const renderTitle = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: BulletGraph
): void => {
  // console.log("renderTitle");
  // under graphArea
  if (!renderInfo || !component) return;

  const spacing = 6; // spacing between title and dataArea

  if (component.title) {
    const titleSize = ChartUtils.measureTextSize(
      component.title,
      'tracker-title-small'
    );

    if (component.orientation === 'horizontal') {
      const title = elements.graphArea
        .append('text')
        .text(component.title) // pivot at center
        .attr('id', 'title')
        .attr('x', titleSize.width / 2)
        .attr('y', renderInfo.dataAreaSize.height / 2)
        .attr('height', titleSize.height) // for later use
        .attr('class', 'tracker-title-small');
      elements['title'] = title;

      // Expand parent areas
      DomUtils.expandArea(elements.svg, titleSize.width + spacing, 0);
      DomUtils.expandArea(elements.graphArea, titleSize.width + spacing, 0);

      // Move sibling areas
      DomUtils.moveArea(elements.dataArea, titleSize.width + spacing, 0);
    } else if (component.orientation === 'vertical') {
      // if label width > dataArea width
      let xMiddle = renderInfo.dataAreaSize.width / 2;
      if (titleSize.width > renderInfo.dataAreaSize.width) {
        // console.log("expand area for vertical title");
        DomUtils.expandArea(
          elements.svg,
          titleSize.width - renderInfo.dataAreaSize.width,
          0
        );
        DomUtils.expandArea(
          elements.graphArea,
          titleSize.width - renderInfo.dataAreaSize.width,
          0
        );
        DomUtils.moveArea(
          elements.dataArea,
          titleSize.width / 2 - renderInfo.dataAreaSize.width / 2,
          0
        );
        xMiddle = titleSize.width / 2;
      }

      const axisWidth = parseFloat(elements.axis.attr('width'));

      const title = elements.graphArea
        .append('text')
        .text(component.title) // pivot at center
        .attr('id', 'title')
        .attr('x', xMiddle + axisWidth)
        .attr('y', titleSize.height / 2)
        .attr('height', titleSize.height) // for later use
        .attr('class', 'tracker-title-small');
      elements['title'] = title;

      // Expand parent areas
      DomUtils.expandArea(elements.svg, 0, titleSize.height + spacing);
      DomUtils.expandArea(elements.graphArea, 0, titleSize.height + spacing);

      // Move sibling areas
      DomUtils.moveArea(elements.dataArea, 0, titleSize.height + spacing);
    }
  }

  if (component.valueUnit) {
    const unitSize = ChartUtils.measureTextSize(
      component.valueUnit,
      'tracker-tick-label'
    );

    if (component.orientation === 'horizontal') {
      const unit = elements.dataArea
        .append('text')
        .text(component.valueUnit)
        .attr('id', 'unit')
        .attr('x', -1 * (unitSize.width + spacing))
        .attr('y', renderInfo.dataAreaSize.height + spacing)
        .attr('height', unitSize.height) // for later use
        .attr('class', 'tracker-tick-label'); // pivot at corder
      elements['unit'] = unit;
    } else if (component.orientation === 'vertical') {
      const unit = elements.dataArea
        .append('text')
        .text(component.valueUnit)
        .attr('id', 'unit')
        .attr('x', renderInfo.dataAreaSize.width / 2 - unitSize.width / 2)
        .attr('y', -(unitSize.height / 2 + spacing))
        .attr('height', unitSize.height) // for later use
        .attr('class', 'tracker-tick-label'); // pivot at corder
      elements['unit'] = unit;

      // Expand parent areas
      DomUtils.expandArea(elements.svg, 0, unitSize.height + spacing);
      DomUtils.expandArea(elements.graphArea, 0, unitSize.height + spacing);

      // Move dataArea down
      DomUtils.moveArea(elements.dataArea, 0, unitSize.height + spacing);
    }
  }
};

/**
 * Render ticks, tick labels
 * @param elements
 * @param renderInfo
 * @param component
 * @param _dataset
 * @returns
 */
export const renderAxis = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: BulletGraph,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _dataset: Dataset
): void => {
  // console.log("renderAxis");
  // console.log(elements);
  // console.log(dataset);
  if (!renderInfo || !component) return;

  const range = component.range;
  const lastRange = range[range.length - 1];
  const domain = [0, lastRange];

  const tickLength = 6;
  const valueUnit = component.valueUnit;
  const tickFormatFn = (value: d3.NumberValue): string => {
    if (valueUnit && valueUnit.endsWith('%')) {
      return d3.tickFormat(0, lastRange, 7)(value) + ' %';
    }
    return d3.tickFormat(0, lastRange, 7)(value);
  };
  const maxTickLabel = tickFormatFn(lastRange);
  const maxTickLabelSize = ChartUtils.measureTextSize(
    maxTickLabel,
    'tracker-tick-label'
  );

  if (component.orientation === 'horizontal') {
    const scale = d3.scaleLinear();
    scale.domain(domain).range([0, renderInfo.dataAreaSize.width]);
    elements['scale'] = scale;

    const axisGen = d3.axisBottom(scale);
    axisGen.tickFormat(tickFormatFn);
    const axis = elements.dataArea
      .append('g')
      .attr('id', 'axis')
      .attr(`transform', 'translate(0, ${renderInfo.dataAreaSize.height})`)
      .call(axisGen)
      .attr('class', 'tracker-axis');
    elements['axis'] = axis;

    axis.selectAll('path').style('stroke', 'none');
    axis.selectAll('line');
    axis.selectAll('text').attr('class', 'tracker-tick-label');
    axis.attr('width', renderInfo.dataAreaSize.width + maxTickLabelSize.width);
    axis.attr('height', tickLength + maxTickLabelSize.height);

    // Expand areas
    DomUtils.expandArea(
      elements.svg,
      +maxTickLabelSize.width,
      tickLength + maxTickLabelSize.height
    );
    DomUtils.expandArea(
      elements.graphArea,
      +maxTickLabelSize.width,
      tickLength + maxTickLabelSize.height
    );
  } else if (component.orientation === 'vertical') {
    const scale = d3.scaleLinear();
    scale.domain(domain).range([renderInfo.dataAreaSize.height, 0]);
    elements['scale'] = scale;

    const axisGen = d3.axisLeft(scale);
    axisGen.tickFormat(tickFormatFn);
    const axis = elements.dataArea
      .append('g')
      .attr('id', 'axis')
      .attr('x', 0)
      .attr('y', 0)
      .call(axisGen)
      .attr('class', 'tracker-axis');
    elements['axis'] = axis;

    axis.selectAll('path').style('stroke', 'none');
    axis.selectAll('line');
    axis.selectAll('text').attr('class', 'tracker-tick-label');
    axis.attr('width', tickLength + maxTickLabelSize.width);
    axis.attr('height', renderInfo.dataAreaSize.width);

    // Expand areas
    DomUtils.expandArea(elements.svg, tickLength + maxTickLabelSize.width, 0);
    DomUtils.expandArea(
      elements.graphArea,
      tickLength + maxTickLabelSize.width,
      0
    );

    DomUtils.moveArea(
      elements.dataArea,
      tickLength + maxTickLabelSize.width,
      0
    );
  }
};

/**
 *
 * @param elements Render quantitative range, poor/average/good/...
 * @param renderInfo
 * @param component
 * @param _dataset
 * @returns
 */
export const renderBackPanel = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: BulletGraph,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _dataset: Dataset
): void => {
  // console.log("renderBackPanel");
  // console.log(dataset);
  if (!renderInfo || !component) return;

  const scale = elements.scale;

  // Prepare data
  const range = component.range;
  const rangeColor = component.rangeColor;
  const data = [];
  let lastBound = 0;
  for (let ind = 0; ind < range.length; ind++) {
    data.push({
      start: lastBound,
      end: range[ind],
      color: rangeColor[ind],
    });
    lastBound = range[ind];
  }

  if (component.orientation === 'horizontal') {
    elements.dataArea
      .selectAll('backPanel')
      .data(data)
      .enter()
      .append('rect')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .attr('x', (d: { start: number }, _i: number) =>
        Math.floor(scale(d.start))
      )
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      .attr('y', (_d: any) => 0)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .attr('width', (d: { end: number; start: number }, _i: number) =>
        Math.ceil(scale(d.end - d.start))
      )
      .attr('height', renderInfo.dataAreaSize.height)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      .style('fill', (d: any) => d.color);
  } else if (component.orientation === 'vertical') {
    elements.dataArea
      .selectAll('backPanel')
      .data(data)
      .enter()
      .append('rect')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
      .attr('x', (_d: any, _i: number) => 0)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('y', (d: any) => Math.floor(scale(d.end)))
      .attr('width', renderInfo.dataAreaSize.width)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('height', (d: any) => {
        return (
          renderInfo.dataAreaSize.height - Math.floor(scale(d.end - d.start))
        );
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .style('fill', (d: any) => d.color);
  }
};

/**
 * Render bar for actual value
 * @param elements
 * @param renderInfo
 * @param component
 * @param _dataset
 * @returns
 */
export const renderBar = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: BulletGraph,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _dataset: Dataset
): string => {
  // console.log("renderBar");
  // console.log(dataset);
  if (!renderInfo || !component) return;

  const resolvedValue = Resolver.resolveValue(component.value, renderInfo);
  // console.log(retActualValue);
  if (typeof resolvedValue === 'string') return resolvedValue;

  const actualValue = resolvedValue;
  if (Number.isNaN(actualValue)) return 'Invalid input value: ' + resolvedValue;

  const valueColor = component.valueColor;

  const scale = elements.scale;

  if (component.orientation === 'horizontal') {
    const barWidth = renderInfo.dataAreaSize.height / 3;
    elements.dataArea
      .append('rect')
      .attr('x', scale(0))
      .attr('y', barWidth)
      .attr('width', Math.floor(scale(actualValue)))
      .attr('height', barWidth)
      .style('fill', valueColor);
  } else if (component.orientation === 'vertical') {
    const barWidth = renderInfo.dataAreaSize.width / 3;
    elements.dataArea
      .append('rect')
      .attr('x', barWidth)
      .attr('y', Math.floor(scale(actualValue)))
      .attr('width', barWidth)
      .attr(
        'height',
        renderInfo.dataAreaSize.height - Math.floor(scale(actualValue))
      )
      .style('fill', valueColor);
  }
};

/**
 * ender mark line for target value
 * @param elements
 * @param renderInfo
 * @param component
 * @param _dataset
 * @returns
 */
export const renderMark = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: BulletGraph,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _dataset: Dataset
): void => {
  // console.log("renderMark");
  // console.log(dataset);
  if (!renderInfo || !component) return;

  const showMarker = component.showMarker;
  if (!showMarker) return;

  const markerValue = component.markerValue;
  const markerColor = component.markerColor;

  const scale = elements.scale;

  if (component.orientation === 'horizontal') {
    const markerLength = (renderInfo.dataAreaSize.height * 2) / 3;
    elements.dataArea
      .append('rect')
      .attr('x', scale(markerValue) - 1.5)
      .attr('y', markerLength / 4)
      .attr('width', 3)
      .attr('height', markerLength)
      .style('fill', markerColor);
  } else if (component.orientation === 'vertical') {
    const markerLength = (renderInfo.dataAreaSize.width * 2) / 3;
    elements.dataArea
      .append('rect')
      .attr('x', markerLength / 4)
      .attr('y', scale(markerValue) - 1.5)
      .attr('width', markerLength)
      .attr('height', 3)
      .style('fill', markerColor);
  }
};
