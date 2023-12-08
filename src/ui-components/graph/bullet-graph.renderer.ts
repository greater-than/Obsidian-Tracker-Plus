import * as d3 from 'd3';
import { Orientation } from '../../enums';
import { TrackerError } from '../../errors';
import * as Resolver from '../../expressions/resolver';
import { RenderInfo } from '../../models/render-info';
import { ComponentElements } from '../../models/types';
import { DomUtils, UiUtils } from '../../utils';
import { setScale } from '../../utils/ui.utils';
import { RenderTitleOptions, createElements } from '../shared';
import { BulletGraph } from './bullet-graph.model';

const renderTitle = (
  elements: ComponentElements,
  renderInfo: RenderInfo,
  component: BulletGraph,
  options?: RenderTitleOptions
): void => {
  if (!renderInfo || !component || !component.title) return;

  const { title, valueUnit, orientation } = component;
  const { dataAreaSize } = renderInfo;
  const { height, width } = dataAreaSize;

  const spacing = options?.titleSpacing || 6; // Extra spacing between title and dataArea
  const cssClass = options?.titleCssClass || 'tracker-title-small';

  const { height: titleHeight, width: titleWidth } = UiUtils.getDimensions(
    title,
    cssClass
  );

  if (orientation === Orientation.HORIZONTAL) {
    elements.title = elements.graphArea
      .append('text')
      .text(title) // pivot at center
      .attr('id', 'title')
      .attr('x', titleWidth / 2.0)
      .attr('y', height / 2.0)
      .attr('height', titleHeight) // for later use
      .attr('class', cssClass);

    // Expand parent areas
    DomUtils.expandArea(elements.svg, titleWidth + spacing, 0);
    DomUtils.expandArea(elements.graphArea, titleWidth + spacing, 0);

    // Move sibling areas
    DomUtils.moveArea(elements.dataArea, titleWidth + spacing, 0);
  } else if (orientation === Orientation.VERTICAL) {
    // if label width > dataArea width
    let xMiddle = width / 2.0;
    if (titleWidth > width) {
      DomUtils.expandArea(elements.svg, titleWidth - width, 0);
      DomUtils.expandArea(elements.graphArea, titleWidth - width, 0);
      DomUtils.moveArea(elements.dataArea, titleWidth / 2.0 - width / 2.0, 0);
      xMiddle = titleWidth / 2.0;
    }

    const axisWidth = parseFloat(elements.axis.attr('width'));

    elements.title = elements.graphArea
      .append('text')
      .text(title) // pivot at center
      .attr('id', 'title')
      .attr('x', xMiddle + axisWidth)
      .attr('y', titleHeight / 2.0)
      .attr('height', titleHeight) // TODO? for later use
      .attr('class', cssClass);

    // Expand parent areas
    DomUtils.expandArea(elements.svg, 0, titleHeight + spacing);
    DomUtils.expandArea(elements.graphArea, 0, titleHeight + spacing);

    // Move sibling areas
    DomUtils.moveArea(elements.dataArea, 0, titleHeight + spacing);
  }

  if (!valueUnit) return;

  const { height: unitHeight, width: unitWidth } = UiUtils.getDimensions(
    valueUnit,
    'tracker-tick-label'
  );

  if (orientation === Orientation.HORIZONTAL) {
    elements.unit = elements.dataArea
      .append('text')
      .text(valueUnit)
      .attr('id', 'unit')
      .attr('x', -1 * (unitWidth + spacing))
      .attr('y', height + spacing)
      .attr('height', unitHeight) // TODO? for later use
      .attr('class', 'tracker-tick-label'); // pivot at corder
  } else if (orientation === Orientation.VERTICAL) {
    elements.unit = elements.dataArea
      .append('text')
      .text(valueUnit)
      .attr('id', 'unit')
      .attr('x', width / 2 - unitWidth / 2)
      .attr('y', -(unitHeight / 2.0 + spacing))
      .attr('height', unitHeight) // TODO? for later use
      .attr('class', 'tracker-tick-label'); // pivot at corder

    // Expand parent areas
    DomUtils.expandArea(elements.svg, 0, unitHeight + spacing);
    DomUtils.expandArea(elements.graphArea, 0, unitHeight + spacing);

    // Move dataArea down
    DomUtils.moveArea(elements.dataArea, 0, unitHeight + spacing);
  }
};

// Render ticks, tick labels
const renderAxis = (
  elements: ComponentElements,
  renderInfo: RenderInfo,
  component: BulletGraph
) => {
  if (!renderInfo || !component) return;

  const { range, valueUnit, orientation } = component;
  const { dataAreaSize } = renderInfo;
  const { height, width } = dataAreaSize;

  const lastRange = range[range.length - 1];
  const domain = [0, lastRange];

  const tickLength = 6;
  const formatTick = (value: d3.NumberValue): string =>
    valueUnit && valueUnit.endsWith('%')
      ? d3.tickFormat(0, lastRange, 7)(value) + ' %'
      : d3.tickFormat(0, lastRange, 7)(value);
  const maxTickLabel = formatTick(lastRange);
  const { height: tickLabelHeight, width: tickLabelWidth } =
    UiUtils.getDimensions(maxTickLabel, 'tracker-tick-label');

  if (orientation === Orientation.HORIZONTAL) {
    elements.scale = d3.scaleLinear().domain(domain).range([0, width]);

    const axisGen = d3.axisBottom(elements.scale);
    axisGen.tickFormat(formatTick);
    const axis = elements.dataArea
      .append('g')
      .attr('id', 'axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(axisGen)
      .attr('class', 'tracker-axis');
    elements['axis'] = axis;

    axis.selectAll('path').style('stroke', 'none');
    axis.selectAll('line');
    axis.selectAll('text').attr('class', 'tracker-tick-label');
    axis.attr('width', width + tickLabelWidth);
    axis.attr('height', tickLength + tickLabelHeight);

    // Expand areas
    DomUtils.expandArea(
      elements.svg,
      +tickLabelWidth,
      tickLength + tickLabelHeight
    );
    DomUtils.expandArea(
      elements.graphArea,
      +tickLabelWidth,
      tickLength + tickLabelHeight
    );
  } else if (orientation === Orientation.VERTICAL) {
    elements.scale = d3.scaleLinear().domain(domain).range([height, 0]);

    const axisGen = d3.axisLeft(elements.scale);
    axisGen.tickFormat(formatTick);
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
    axis.attr('width', tickLength + tickLabelWidth);
    axis.attr('height', width);

    // Expand areas
    DomUtils.expandArea(elements.svg, tickLength + tickLabelWidth, 0);
    DomUtils.expandArea(elements.graphArea, tickLength + tickLabelWidth, 0);
    DomUtils.moveArea(elements.dataArea, tickLength + tickLabelWidth, 0);
  }
};

// Render quantitative range, poor/average/good/...
const renderBackPanel = (
  elements: ComponentElements,
  renderInfo: RenderInfo,
  component: BulletGraph
): void => {
  if (!renderInfo || !component) return;

  const { scale } = elements;
  const { range, rangeColor, orientation } = component;
  const { dataAreaSize } = renderInfo;
  const { height, width } = dataAreaSize;

  // Prepare data
  const data = [];
  let lastBound = 0;
  for (let ind = 0; ind < range.length; ind++) {
    data.push({ start: lastBound, end: range[ind], color: rangeColor[ind] });
    lastBound = range[ind];
  }

  if (orientation === Orientation.HORIZONTAL) {
    elements.dataArea
      .selectAll('backPanel')
      .data(data)
      .enter()
      .append('rect')
      .style('fill', (d: { color: string }) => d.color)
      .attr('x', (d: { start: number }) => Math.floor(scale(d.start)))
      .attr('y', () => 0)
      .attr('width', (d: { end: number; start: number }) =>
        Math.ceil(scale(d.end - d.start))
      )
      .attr('height', height);
  } else if (orientation === Orientation.VERTICAL) {
    elements.dataArea
      .selectAll('backPanel')
      .data(data)
      .enter()
      .append('rect')
      .style('fill', (d: { color: string }) => d.color)
      .attr('x', () => 0)
      .attr('y', (d: { end: number }) => Math.floor(scale(d.end)))
      .attr('width', width)
      .attr(
        'height',
        (d: { end: number; start: number }) =>
          height - Math.floor(scale(d.end - d.start))
      );
  }
};

// Render bar for actual value
const renderBar = (
  elements: ComponentElements,
  renderInfo: RenderInfo,
  component: BulletGraph
): void => {
  if (!renderInfo || !component) return;

  const value = Resolver.resolveValue(component.value, renderInfo);

  if (Number.isNaN(value))
    throw new TrackerError(`Invalid input value: ${value}`);

  const { orientation, valueColor } = component;
  const { dataAreaSize } = renderInfo;
  const { height, width } = dataAreaSize;
  const { scale } = elements;

  if (orientation === Orientation.HORIZONTAL) {
    const barWidth = height / 3;
    elements.dataArea
      .append('rect')
      .attr('x', scale(0))
      .attr('y', barWidth)
      .attr('width', Math.floor(scale(value)))
      .attr('height', barWidth)
      .style('fill', valueColor);
  } else if (orientation === Orientation.VERTICAL) {
    const barWidth = width / 3;
    elements.dataArea
      .append('rect')
      .attr('x', barWidth)
      .attr('y', Math.floor(scale(value)))
      .attr('width', barWidth)
      .attr('height', height - Math.floor(scale(value)))
      .style('fill', valueColor);
  }
};

// Render mark line for target value
const renderMark = (
  elements: ComponentElements,
  renderInfo: RenderInfo,
  component: BulletGraph
): void => {
  if (!renderInfo || !component || !component.showMarker) return;

  const { markerValue, markerColor, orientation } = component;
  const { scale } = elements;

  if (orientation === Orientation.HORIZONTAL) {
    const height = (renderInfo.dataAreaSize.height * 2) / 3;
    elements.dataArea
      .append('rect')
      .attr('x', scale(markerValue) - 1.5)
      .attr('y', height / 4)
      .attr('width', 3)
      .attr('height', height)
      .style('fill', markerColor);
  } else if (orientation === Orientation.VERTICAL) {
    const width = (renderInfo.dataAreaSize.width * 2) / 3;
    elements.dataArea
      .append('rect')
      .attr('x', width / 4)
      .attr('y', scale(markerValue) - 1.5)
      .attr('width', width)
      .attr('height', 3)
      .style('fill', markerColor);
  }
};

// Bullet graph https://en.wikipedia.org/wiki/Bullet_graph
export const renderBulletGraph = (
  container: HTMLElement,
  renderInfo: RenderInfo,
  component: BulletGraph
): string => {
  if (!renderInfo || !component) return;

  // Set initial dataArea size
  if (component.orientation === Orientation.HORIZONTAL)
    renderInfo.dataAreaSize = { width: 250, height: 24 };
  else if (component.orientation === Orientation.VERTICAL)
    renderInfo.dataAreaSize = { width: 24, height: 250 };

  const elements = createElements(container, renderInfo);

  renderAxis(elements, renderInfo, component);
  renderTitle(elements, renderInfo, component);
  renderBackPanel(elements, renderInfo, component);
  renderBar(elements, renderInfo, component);
  renderMark(elements, renderInfo, component);
  setScale(container, elements, renderInfo);
};
