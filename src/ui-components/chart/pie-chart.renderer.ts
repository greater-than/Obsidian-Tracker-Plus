import * as d3 from 'd3';
import { Orientation, Position } from '../../enums';
import * as Resolver from '../../expressions/resolver';
import { RenderInfo } from '../../models/render-info';
import { ComponentElements } from '../../models/types';
import { DomUtils, UiUtils } from '../../utils';
import { setScale } from '../../utils/ui.utils';
import { createElements, renderTitle } from '../shared';
import { PieChart } from './pie-chart.model';

export const renderLegend = (
  elements: ComponentElements,
  renderInfo: RenderInfo,
  component: PieChart
): void => {
  if (!component.showLegend) return;
  // Get chart elements
  const { svg } = elements;

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const graphArea = elements.graphArea;

  const dataArea = elements.dataArea;
  const title = elements.title;

  // Get element width and height
  const titleHeight = title ? parseFloat(title.attr('height')) : 0.0;

  // Get names and their dimension
  const names = component.dataName;
  const nameSizes = names.map((n) =>
    UiUtils.getDimensions(n, 'tracker-legend-label')
  );
  let indMaxName = 0;
  let maxNameWidth = 0.0;
  for (let ind = 0; ind < names.length; ind++) {
    if (nameSizes[ind].width > maxNameWidth) {
      maxNameWidth = nameSizes[ind].width;
      indMaxName = ind;
    }
  }
  const maxName = names[indMaxName];
  const characterWidth = maxNameWidth / maxName.length;
  const nameHeight = nameSizes[indMaxName].height;
  const numNames = names.length;

  const xSpacing = 2 * characterWidth;
  const ySpacing = nameHeight;
  const markerWidth = 2 * characterWidth;

  // Get legend width and height
  let legendWidth = 0;
  let legendHeight = 0;
  if (component.legendOrientation === Orientation.VERTICAL) {
    legendWidth = xSpacing * 3 + markerWidth + maxNameWidth;
    legendHeight = (numNames + 1) * ySpacing;
  } else if (component.legendOrientation === Orientation.HORIZONTAL) {
    legendWidth =
      (2 * xSpacing + markerWidth) * numNames +
      xSpacing +
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      d3.sum(nameSizes, (s, _i) => s.width);
    legendHeight = ySpacing + nameHeight;
  }

  // Calculate legendX and legendY
  let legendX = 0.0; // relative to graphArea
  let legendY = 0.0;
  if (component.legendPosition === Position.TOP) {
    // below title
    legendX = renderInfo.dataAreaSize.width / 2.0 - legendWidth / 2.0;
    legendY = titleHeight;
    // Expand svg
    DomUtils.expandArea(svg, 0, legendHeight + ySpacing);
    // Move dataArea down
    DomUtils.moveArea(dataArea, 0, legendHeight + ySpacing);
  } else if (component.legendPosition === Position.BOTTOM) {
    // bellow x-axis label
    legendX = renderInfo.dataAreaSize.width / 2.0 - legendWidth / 2.0;
    legendY = titleHeight + renderInfo.dataAreaSize.height + ySpacing;
    // Expand svg
    DomUtils.expandArea(svg, 0, legendHeight + ySpacing);
  } else if (component.legendPosition === Position.LEFT) {
    legendX = 0;
    legendY =
      titleHeight + renderInfo.dataAreaSize.height / 2.0 - legendHeight / 2.0;
    // Expand svg
    DomUtils.expandArea(svg, legendWidth + xSpacing, 0);
    // Move dataArea right
    DomUtils.moveArea(dataArea, legendWidth + xSpacing, 0);
  } else if (component.legendPosition === Position.RIGHT) {
    legendX = renderInfo.dataAreaSize.width + xSpacing;
    legendY =
      titleHeight + renderInfo.dataAreaSize.height / 2.0 - legendHeight / 2.0;
    // Expand svg
    DomUtils.expandArea(svg, legendWidth + xSpacing, 0);
  } else {
    return;
  }

  const legend = elements.graphArea
    .append('g')
    .attr('id', 'legend')
    .attr('transform', `translate(${legendX}, ${legendY})`);

  const legendBg = legend
    .append('rect')
    .attr('class', 'tracker-legend')
    .attr('width', legendWidth)
    .attr('height', legendHeight);
  if (component.legendBgColor) legendBg.style('fill', component.legendBgColor);

  if (component.legendBorderColor)
    legendBg.style('stroke', component.legendBorderColor);

  const markerRadius = 5.0;
  const firstMarkerX = xSpacing;
  const firstMarkerY = nameHeight;
  const firstLabelX = firstMarkerX + xSpacing + markerWidth; // xSpacing + 2 * xSpacing
  const firstLabelY = firstMarkerY;

  if (component.legendOrientation === Orientation.VERTICAL) {
    // points
    legend
      .selectAll('markers')
      .data(names)
      .enter()
      .append('circle')
      .attr('cx', firstMarkerX + markerWidth / 2.0)
      .attr('cy', (_name: string, i: number) => firstMarkerY + i * ySpacing)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .attr('r', (_name: string, _i: number) => markerRadius)
      .style('fill', (_name: string, i: number) => component.dataColor[i]);

    // names
    const nameLabels = legend
      .selectAll('labels')
      .data(names)
      .enter()
      .append('text')
      .attr('x', firstLabelX)
      .attr('y', (_name: string, i: number) => firstLabelY + i * ySpacing)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .text((name: string, _i: number) => name)
      .style('alignment-baseline', 'middle')
      .attr('class', 'tracker-legend-label');

    nameLabels.style(
      'fill',
      (_name: string, i: number) => component.dataColor[i]
    );
  } else if (component.legendOrientation === Orientation.HORIZONTAL) {
    let currRenderPosX = 0.0;

    // TODO Why is this here?
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const currRenderPosX2 = 0.0;

    // points
    currRenderPosX = 0.0;
    legend
      .selectAll('markers')
      .data(names)
      .enter()
      .append('circle')
      .attr('cx', (_name: string, i: number) =>
        i === 0
          ? firstMarkerX + markerWidth / 2.0
          : currRenderPosX + nameSizes[i].width + markerWidth + xSpacing * 2
      )
      .attr('cy', firstMarkerY)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .attr('r', (_name: string, _i: number) => markerRadius)
      .style('fill', (_name: string, i: number) => component.dataColor[i]);

    // names
    currRenderPosX = 0.0;
    const nameLabels = legend
      .selectAll('labels')
      .data(names)
      .enter()
      .append('text')
      .attr('x', (_name: string, index: number) =>
        index === 0
          ? firstLabelX
          : currRenderPosX + nameSizes[index].width + markerWidth + xSpacing * 2
      )
      .attr('y', firstLabelY)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .text((name: string, _i: number) => name)
      .style('alignment-baseline', 'middle')
      .attr('class', 'tracker-legend-label');

    nameLabels.style(
      'fill',
      (_name: string, i: number) => component.dataColor[i]
    );
  }
};

export const renderPie = (
  elements: ComponentElements,
  renderInfo: RenderInfo,
  component: PieChart
): void => {
  const {
    hideLabelLessThan,
    showExtLabelOnlyIfNoLabel,
    data,
    label,
    extLabel,
    dataColor,
  } = component;
  const { dataAreaSize } = renderInfo;
  const { height, width } = dataAreaSize;

  const radius = renderInfo.dataAreaSize.width * 0.5;
  const outerRadius = radius * 0.7;
  const innerRadius = outerRadius * component.ratioInnerRadius;

  // values
  const values: Array<number> = [];
  for (const expr of data) {
    const value = Resolver.resolveValue(expr, renderInfo);
    if (typeof value === 'number') values.push(value);
  }

  // labels
  const labels: Array<string> = [];
  for (const expr of label)
    labels.push(Resolver.resolveTemplate(expr, renderInfo));

  // hideLabelLessThan

  // label sizes
  const labelSizes = labels.map((n) =>
    UiUtils.getDimensions(n, 'tracker-tick-label')
  );

  // extLabel
  const extLabels = extLabel.map((label) =>
    Resolver.resolveTemplate(label, renderInfo)
  );

  // extLabel sizes
  const extLabelSizes = extLabels.map((n) =>
    UiUtils.getDimensions(n, 'tracker-pie-label')
  );

  // scale
  const colorScale = d3.scaleOrdinal().range(dataColor);

  const sectorsGroup = elements.dataArea.append('g');
  sectorsGroup.attr(
    'transform',
    () => `translate(${width * 0.5}, ${height * 0.5})`
  );

  const pie = d3.pie();
  const pieValues = pie(values);

  const sectors = sectorsGroup
    .selectAll('sector')
    .data(pieValues)
    .enter()
    .append('g')
    .attr('class', 'sector');

  const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
  const hiddenArc = d3
    .arc()
    .innerRadius(radius * 0.9)
    .outerRadius(radius * 0.9);

  sectors
    .append('path')
    .attr('fill', (_d: d3.DefaultArcObject, i: number) =>
      colorScale(i.toString())
    )
    .attr('d', arc);

  const isLabelHidden = (arc: d3.DefaultArcObject) =>
    (arc.endAngle - arc.startAngle) / (2.0 * Math.PI) < hideLabelLessThan
      ? true
      : false;

  // label elements
  sectorsGroup
    .selectAll('label')
    .data(pie(values))
    .enter()
    .append('text')
    .text((arc: d3.DefaultArcObject, i: number) =>
      isLabelHidden(arc) ? '' : labels[i]
    )
    .attr(
      'transform',
      (d: d3.DefaultArcObject) =>
        `translate(${arc.centroid(d)[0]}, ${arc.centroid(d)[1]})`
    )
    .style('text-anchor', 'middle')
    .attr('class', 'tracker-pie-label');

  const getMidAngle = (arc: d3.DefaultArcObject) =>
    arc.startAngle + (arc.endAngle - arc.startAngle) / 2;

  // external label elements
  sectorsGroup
    .selectAll('extLabel')
    .data(pieValues)
    .enter()
    .append('text')
    .text((arc: d3.DefaultArcObject, i: number) => {
      if (!showExtLabelOnlyIfNoLabel) return extLabels[i];
      return labels[i] === '' || isLabelHidden(arc) ? extLabels[i] : '';
    })
    .attr('transform', (arc: d3.DefaultArcObject, i: number) => {
      const posLabel = hiddenArc.centroid(arc);
      const midAngle = getMidAngle(arc);
      posLabel[0] =
        (radius * 0.99 - extLabelSizes[i].width) *
        (midAngle < Math.PI ? 1 : -1);
      return `translate(${posLabel[0]}, ${posLabel[1]})`;
    })
    .style('text-anchor', (arc: d3.DefaultArcObject) =>
      getMidAngle(arc) < Math.PI ? 'start' : 'end'
    )
    .attr('class', 'tracker-pie-label');

  const getPointsForConnectionLines = (
    obj: d3.DefaultArcObject,
    i: number
  ): [number, number][] => {
    const labelWidth = labelSizes[i].width;
    const extLabelWidth = extLabelSizes[i].width;

    const midAngle = getMidAngle(obj);

    const posLabel = arc.centroid(obj); // line insertion in the slice
    const posMiddle = hiddenArc.centroid(obj); // line break: we use the other arc generator that has been built only for that
    const posExtLabel = hiddenArc.centroid(obj); // Label position = almost the same as posB

    let distMiddleToLabel = Math.sqrt(
      (posMiddle[0] - posLabel[0]) ** 2 + (posMiddle[1] - posLabel[1]) ** 2
    );

    if (labels[i] !== '') {
      // shift posLabel, toward the middle point
      posLabel[0] =
        posLabel[0] +
        ((posMiddle[0] - posLabel[0]) * labelWidth) / distMiddleToLabel;
      posLabel[1] =
        posLabel[1] +
        ((posMiddle[1] - posLabel[1]) * labelWidth) / distMiddleToLabel;

      // shift posExtLabel
      posExtLabel[0] =
        (radius * 0.99 - extLabelWidth - 3) * (midAngle < Math.PI ? 1 : -1); // multiply by 1 or -1 to put it on the right or on the left
    }

    distMiddleToLabel = Math.sqrt(
      (posMiddle[0] - posLabel[0]) ** 2 + (posMiddle[1] - posLabel[1]) ** 2
    );

    const distExtLabelToLabel = Math.sqrt(
      (posExtLabel[0] - posLabel[0]) ** 2 + (posExtLabel[1] - posLabel[1]) ** 2
    );

    return distMiddleToLabel > distExtLabelToLabel
      ? [posLabel, posExtLabel]
      : [posLabel, posMiddle, posExtLabel];
  };

  // Add lines between sectors and external labels
  sectorsGroup
    .selectAll('line')
    .data(pieValues)
    .enter()
    .append('polyline')
    .attr('stroke', 'black')
    .style('fill', 'none')
    .attr('stroke-width', 1)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .attr('points', (arc: any, i: number) => {
      if (showExtLabelOnlyIfNoLabel) {
        if (labels[i] === '' || isLabelHidden(arc)) {
          if (extLabels[i] !== '') {
            return getPointsForConnectionLines(arc, i);
          }
        }
      } else {
        if (extLabels[i] !== '') return getPointsForConnectionLines(arc, i);
      }
    })
    .attr('class', 'tracker-axis');
};

export const renderPieChart = (
  container: HTMLElement,
  renderInfo: RenderInfo,
  component: PieChart
) => {
  if (!renderInfo || !component) return;

  const elements = createElements(container, renderInfo);
  const colorCount = component.dataColor.length;

  // Set default dataColor if no dataColor provided
  const defaultColors = d3.schemeSpectral[colorCount];
  component.dataColor.forEach((color, index) => {
    if (color === null) component.dataColor[index] = defaultColors[index];
  });

  renderTitle(elements, renderInfo, component);
  renderPie(elements, renderInfo, component);
  renderLegend(elements, renderInfo, component);
  setScale(container, elements, renderInfo);
};
