import * as d3 from 'd3';
import { Orientation } from 'src/enums';
import { TrackerError } from '../../errors';
import { RenderInfo } from '../../models/render-info';
import { ChartElements } from '../../models/types';
import Resolver from '../../resolver/resolver';
import { DomUtils, UiUtils } from '../../utils';
import { BulletGraph } from './bullet-graph.model';

// export interface CreateElementsOptions {
//   clearContents?: boolean;
//   elements?: ChartElements;
// }

// /**
//  * Create Elements
//  * @param {HTMLElement} container
//  * @param {RenderInfo} renderInfo
//  * @param {CreateElementsOptions} options
//  * @returns {ChartElements}
//  */
// export const createElements = (
//   container: HTMLElement,
//   renderInfo: RenderInfo,
//   options: CreateElementsOptions = { clearContents: false }
// ): ChartElements => {
//   if (!renderInfo) return;

//   const elements: ChartElements = options?.elements || {};
//   const { dataAreaSize, margin } = renderInfo;
//   const { height, width } = dataAreaSize;

//   // optionally, start with a clean slate
//   if (options?.clearContents) {
//     d3.select(container).select('#svg').remove();
//     Object.getOwnPropertyNames(elements).forEach(
//       (name) => delete elements[name]
//     );
//   }

//   // svg: container for plotting
//   const svg = d3
//     .select(container)
//     .append('svg')
//     .attr('id', 'svg')
//     .attr('width', width + margin.left + margin.right)
//     .attr('height', height + margin.top + margin.bottom);
//   elements.svg = svg;

//   // graphArea: contains chartArea, title, legend
//   const graphArea = svg
//     .append('g')
//     .attr('id', 'graphArea')
//     .attr('transform', `translate(${margin.left}, ${margin.top})`)
//     .attr('width', width + margin.right)
//     .attr('height', height + margin.bottom);
//   elements.graphArea = graphArea;

//   // dataArea: contained by graphArea, contains points, lines, xAxis, yAxis
//   elements.dataArea = graphArea
//     .append('g')
//     .attr('id', 'dataArea')
//     .attr('width', width)
//     .attr('height', height);

//   return elements;
// };

export interface RenderTitleOptions {
  titleSpacing?: number;
  titleCssClass?: string;
}

/**
 * Renders component title
 * @param {ChartElements} elements
 * @param {RenderInfo} renderInfo
 * @param {BulletGraph} component
 * @param {RenderTitleOptions} options
 * @returns {void}
 */
export const renderTitle = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: BulletGraph,
  options: RenderTitleOptions = { titleSpacing: 0 }
): void => {
  // contained by graphArea
  if (!renderInfo || (!component && !component.title)) return;

  const spacing = options?.titleSpacing || 0; // Extra spacing between title and dataArea
  const cssClass = options?.titleCssClass || 'tracker-title';
  const dimensions = UiUtils.getTextDimensions(component.title, cssClass);

  if (component.orientation === Orientation.HORIZONTAL) {
    const elementTitle = elements.graphArea
      .append('text')
      .text(component.title) // pivot at center
      .attr('id', 'title')
      .attr('x', dimensions.width / 2)
      .attr('y', renderInfo.dataAreaSize.height / 2)
      .attr('height', dimensions.height) // for later use
      .attr('class', cssClass);
    elements.title = elementTitle;

    // Expand parent areas
    DomUtils.expandArea(elements.svg, dimensions.width + spacing, 0);
    DomUtils.expandArea(elements.graphArea, dimensions.width + spacing, 0);

    // Move sibling areas
    DomUtils.moveArea(elements.dataArea, dimensions.width + spacing, 0);
  } else if (component.orientation === Orientation.VERTICAL) {
    // if label width > dataArea width
    let xMiddle = renderInfo.dataAreaSize.width / 2;
    if (dimensions.width > renderInfo.dataAreaSize.width) {
      DomUtils.expandArea(
        elements.svg,
        dimensions.width - renderInfo.dataAreaSize.width,
        0
      );
      DomUtils.expandArea(
        elements.graphArea,
        dimensions.width - renderInfo.dataAreaSize.width,
        0
      );
      DomUtils.moveArea(
        elements.dataArea,
        dimensions.width / 2 - renderInfo.dataAreaSize.width / 2,
        0
      );
      xMiddle = dimensions.width / 2;
    }

    const axisWidth = parseFloat(elements.axis.attr('width'));

    // Append title
    elements.title = elements.graphArea
      .append('text')
      .text(component.title) // pivot at center
      .attr('id', 'title')
      .attr('x', xMiddle + axisWidth)
      .attr('y', dimensions.height / 2)
      .attr('height', dimensions.height) // for later use
      .attr('class', cssClass);

    // Expand parent areas
    DomUtils.expandArea(elements.svg, 0, dimensions.height + spacing);
    DomUtils.expandArea(elements.graphArea, 0, dimensions.height + spacing);

    // Move sibling areas
    DomUtils.moveArea(elements.dataArea, 0, dimensions.height + spacing);
  }

  if (component.valueUnit) {
    const unitSize = UiUtils.getTextDimensions(
      component.valueUnit,
      'tracker-tick-label'
    );

    if (component.orientation === Orientation.HORIZONTAL) {
      elements.unit = elements.dataArea
        .append('text')
        .text(component.valueUnit)
        .attr('id', 'unit')
        .attr('x', -1 * (unitSize.width + spacing))
        .attr('y', renderInfo.dataAreaSize.height + spacing)
        .attr('height', unitSize.height) // for later use
        .attr('class', 'tracker-tick-label'); // pivot at corder
    } else if (component.orientation === Orientation.VERTICAL) {
      elements.unit = elements.dataArea
        .append('text')
        .text(component.valueUnit)
        .attr('id', 'unit')
        .attr('x', renderInfo.dataAreaSize.width / 2 - unitSize.width / 2)
        .attr('y', -(unitSize.height / 2 + spacing))
        .attr('height', unitSize.height) // for later use
        .attr('class', 'tracker-tick-label'); // pivot at corder

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
 * @param {ChartElements} elements
 * @param {RenderInfo} renderInfo
 * @param {Component} component
 * @returns {void}
 */
export const renderAxis = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: BulletGraph
): void => {
  if (!renderInfo || !component) return;

  const { range } = component;
  const lastRange = range[range.length - 1];
  const domain = [0, lastRange];
  const { dataAreaSize } = renderInfo;
  const { height, width } = dataAreaSize;

  const tickLength = 6;
  const { valueUnit, orientation } = component;
  const formatTick = (value: d3.NumberValue): string =>
    valueUnit && valueUnit.endsWith('%')
      ? d3.tickFormat(0, lastRange, 7)(value) + ' %'
      : d3.tickFormat(0, lastRange, 7)(value);

  const maxTickLabel = formatTick(lastRange);
  const maxTickLabelSize = UiUtils.getTextDimensions(
    maxTickLabel,
    'tracker-tick-label'
  );

  if (orientation === Orientation.HORIZONTAL) {
    const scale = d3.scaleLinear();
    scale.domain(domain).range([0, width]);
    elements.scale = scale;
    const axisGen = d3.axisBottom(scale);
    axisGen.tickFormat(formatTick);
    const axis = elements.dataArea
      .append('g')
      .attr('id', 'axis')
      .attr(`transform', 'translate(0, ${height})`)
      .call(axisGen)
      .attr('class', 'tracker-axis');
    elements.axis = axis;

    axis.selectAll('path').style('stroke', 'none');
    axis.selectAll('line');
    axis.selectAll('text').attr('class', 'tracker-tick-label');
    axis.attr('width', width + maxTickLabelSize.width);
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
  } else if (orientation === Orientation.VERTICAL) {
    const scale = d3.scaleLinear();
    scale.domain(domain).range([height, 0]);
    elements.scale = scale;

    const axisGen = d3.axisLeft(scale);
    axisGen.tickFormat(formatTick);
    const axis = elements.dataArea
      .append('g')
      .attr('id', 'axis')
      .attr('x', 0)
      .attr('y', 0)
      .call(axisGen)
      .attr('class', 'tracker-axis');
    elements.axis = axis;

    axis.selectAll('path').style('stroke', 'none');
    axis.selectAll('line');
    axis.selectAll('text').attr('class', 'tracker-tick-label');
    axis.attr('width', tickLength + maxTickLabelSize.width);
    axis.attr('height', width);

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
 * Render quantitative range, poor/average/good/...
 * @param {ChartElements} elements
 * @param {RenderInfo} renderInfo
 * @param {BulletGraph} component
 * @returns {void}
 */
export const renderBackPanel = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: BulletGraph
): void => {
  if (!renderInfo || !component) return;

  const { scale } = elements;
  const { range, rangeColor, orientation } = component;

  // Prepare data
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

  if (orientation === Orientation.HORIZONTAL) {
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
  } else if (orientation === Orientation.VERTICAL) {
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
 * Render bar for a specific value
 * @param elements
 * @param renderInfo
 * @param component
 * @returns
 */
export const renderBar = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: BulletGraph
): string => {
  if (!renderInfo || !component) return;

  const resolvedValue = Resolver.resolveValue(component.value, renderInfo);
  if (typeof resolvedValue === 'string') return resolvedValue;

  if (Number.isNaN(resolvedValue))
    throw new TrackerError(`Invalid input value: '${resolvedValue}'`);

  const valueColor = component.valueColor;

  const scale = elements.scale;

  if (component.orientation === Orientation.HORIZONTAL) {
    const barWidth = renderInfo.dataAreaSize.height / 3;
    elements.dataArea
      .append('rect')
      .attr('x', scale(0))
      .attr('y', barWidth)
      .attr('width', Math.floor(scale(resolvedValue)))
      .attr('height', barWidth)
      .style('fill', valueColor);
  } else if (component.orientation === Orientation.VERTICAL) {
    const barWidth = renderInfo.dataAreaSize.width / 3;
    elements.dataArea
      .append('rect')
      .attr('x', barWidth)
      .attr('y', Math.floor(scale(resolvedValue)))
      .attr('width', barWidth)
      .attr(
        'height',
        renderInfo.dataAreaSize.height - Math.floor(scale(resolvedValue))
      )
      .style('fill', valueColor);
  }
};

/**
 * Render mark line for target value
 * @param {ChartElements} elements
 * @param {RenderInfo} renderInfo
 * @param {BulletGraph} component
 * @returns
 */
export const renderMark = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: BulletGraph
): void => {
  if (!renderInfo || !component) return;

  const showMarker = component.showMarker;
  if (!showMarker) return;

  const markerValue = component.markerValue;
  const markerColor = component.markerColor;

  const scale = elements.scale;

  if (component.orientation === Orientation.HORIZONTAL) {
    const markerLength = (renderInfo.dataAreaSize.height * 2) / 3;
    elements.dataArea
      .append('rect')
      .attr('x', scale(markerValue) - 1.5)
      .attr('y', markerLength / 4)
      .attr('width', 3)
      .attr('height', markerLength)
      .style('fill', markerColor);
  } else if (component.orientation === Orientation.VERTICAL) {
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
