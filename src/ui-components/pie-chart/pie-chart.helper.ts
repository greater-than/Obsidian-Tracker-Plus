import * as d3 from 'd3';
import { Orientation } from 'src/enums';
import { RenderInfo } from '../../models/render-info';
import { ChartElements } from '../../models/types';
import Resolver from '../../resolver/resolver';
import { DomUtils, UiUtils } from '../../utils';
import { PieChart } from './pie-chart.model';

export interface CreateElementsOptions {
  clearContents: boolean;
}

/**
 * Create Elements
 * @param {HTMLElement} container
 * @param {RenderInfo} renderInfo
 * @param {CreateElementsOptions} options
 * @returns {ChartElements}
 */
export const createElements = (
  container: HTMLElement,
  renderInfo: RenderInfo,
  options: CreateElementsOptions = { clearContents: false }
): ChartElements => {
  if (!renderInfo) return;

  const elements: ChartElements = {};
  const { dataAreaSize, margin } = renderInfo;
  const { height, width } = dataAreaSize;
  const { top, right, bottom, left } = margin;

  // Start with a clean slate
  if (options?.clearContents) {
    d3.select(container).select('#svg').remove();
    Object.getOwnPropertyNames(elements).forEach(
      (name) => delete elements[name]
    );
  }

  // container for plotting
  const svg = d3
    .select(container)
    .append('svg')
    .attr('id', 'svg')
    .attr('width', width + left + right)
    .attr('height', height + top + bottom);
  elements.svg = svg;

  // graphArea: contains chartArea, title, legend
  const graphArea = svg
    .append('g')
    .attr('id', 'graphArea')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .attr('width', width + right)
    .attr('height', height + bottom);
  elements.graphArea = graphArea;

  // dataArea: contained by graphArea, contains points, lines, xAxis, yAxis
  elements.dataArea = graphArea
    .append('g')
    .attr('id', 'dataArea')
    .attr('width', width)
    .attr('height', height);

  return elements;
};

export interface RenderTitleOptions {
  titleSpacing?: number;
  titleCssClass?: string;
}

/**
 * Render Title
 * @param {ChartElements} elements
 * @param {RenderInfo} renderInfo
 * @param {PieChart} component
 * @param {RenderTitleOptions} options
 * @returns {void}
 */
export const renderTitle = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: PieChart,
  options: RenderTitleOptions = { titleSpacing: 0 }
): void => {
  if (!renderInfo || (!component && !component.title)) return;

  const spacing = options?.titleSpacing || 0; // Extra spacing between title and dataArea
  const cssClass = options?.titleCssClass || 'tracker-title';
  const dimensions = UiUtils.getTextDimensions(component.title, cssClass);

  // Append title
  elements.title = elements.graphArea
    .append('text')
    .text(component.title) // pivot at center
    .attr('id', 'title')
    .attr(
      'transform',
      `translate(
        ${renderInfo.dataAreaSize.width / 2}, ${dimensions.height / 2})`
    )
    .attr('height', dimensions.height) // for later use
    .attr('class', cssClass);

  // Expand parent areas
  DomUtils.expandArea(elements.svg, 0, dimensions.height + spacing);
  DomUtils.expandArea(elements.graphArea, 0, dimensions.height + spacing);

  // Move sibling areas
  DomUtils.moveArea(elements.dataArea, 0, dimensions.height + spacing);
};

/**
 * Renders component legend
 * @param {ChartElements} elements
 * @param {RenderInfo} renderInfo
 * @param {PieChart} component
 * @returns
 */
export const renderLegend = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: PieChart
): void => {
  // Get chart elements
  const { svg, dataArea, title, graphArea } = elements;

  // Get element width and height
  let titleHeight = 0;
  if (title) {
    titleHeight = parseFloat(title.attr('height'));
  }

  // Get names and their dimension
  const names = component.dataName;
  const nameSizes = names.map((n) => {
    return UiUtils.getTextDimensions(n, 'tracker-legend-label');
  });
  let indMaxName = 0;
  let maxNameWidth = 0;
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
  let legendX = 0; // relative to graphArea
  let legendY = 0;
  if (component.legendPosition === 'top') {
    // below title
    legendX = renderInfo.dataAreaSize.width / 2 - legendWidth / 2;
    legendY = titleHeight;
    // Expand svg
    DomUtils.expandArea(svg, 0, legendHeight + ySpacing);
    // Move dataArea down
    DomUtils.moveArea(dataArea, 0, legendHeight + ySpacing);
  } else if (component.legendPosition === 'bottom') {
    // bellow x-axis label
    legendX = renderInfo.dataAreaSize.width / 2 - legendWidth / 2;
    legendY = titleHeight + renderInfo.dataAreaSize.height + ySpacing;
    // Expand svg
    DomUtils.expandArea(svg, 0, legendHeight + ySpacing);
  } else if (component.legendPosition === 'left') {
    legendX = 0;
    legendY =
      titleHeight + renderInfo.dataAreaSize.height / 2 - legendHeight / 2;
    // Expand svg
    DomUtils.expandArea(svg, legendWidth + xSpacing, 0);
    // Move dataArea right
    DomUtils.moveArea(dataArea, legendWidth + xSpacing, 0);
  } else if (component.legendPosition === 'right') {
    legendX = renderInfo.dataAreaSize.width + xSpacing;
    legendY =
      titleHeight + renderInfo.dataAreaSize.height / 2 - legendHeight / 2;
    // Expand svg
    DomUtils.expandArea(svg, legendWidth + xSpacing, 0);
  } else {
    return;
  }

  const legend = graphArea
    .append('g')
    .attr('id', 'legend')
    .attr('transform', `translate(${legendX}, ${legendY})`);

  const legendBg = legend
    .append('rect')
    .attr('class', 'tracker-legend')
    .attr('width', legendWidth)
    .attr('height', legendHeight);
  if (component.legendBgColor) {
    legendBg.style('fill', component.legendBgColor);
  }
  if (component.legendBorderColor) {
    legendBg.style('stroke', component.legendBorderColor);
  }

  const markerRadius = 5;
  const firstMarkerX = xSpacing;
  const firstMarkerY = nameHeight;
  const firstLabelX = firstMarkerX + xSpacing + markerWidth;
  const firstLabelY = firstMarkerY;

  if (component.legendOrientation === Orientation.VERTICAL) {
    // points
    legend
      .selectAll('markers')
      .data(names)
      .enter()
      .append('circle')
      .attr('cx', firstMarkerX + markerWidth / 2)
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
    let currRenderPosX = 0;

    // TODO Why is this here?
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const currRenderPosX2 = 0;

    // points
    currRenderPosX = 0;
    legend
      .selectAll('markers')
      .data(names)
      .enter()
      .append('circle')
      .attr('cx', (_name: string, i: number) => {
        if (i === 0) {
          currRenderPosX = firstMarkerX + markerWidth / 2;
        } else {
          currRenderPosX +=
            nameSizes[i].width + xSpacing + markerWidth + xSpacing;
        }
        return currRenderPosX;
      })
      .attr('cy', firstMarkerY)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .attr('r', (_name: string, _i: number) => markerRadius)
      .style('fill', (_name: string, i: number) => component.dataColor[i]);

    // names
    currRenderPosX = 0;
    const nameLabels = legend
      .selectAll('labels')
      .data(names)
      .enter()
      .append('text')
      .attr('x', (_name: string, i: number) => {
        if (i === 0) {
          currRenderPosX = firstLabelX;
        } else {
          currRenderPosX +=
            nameSizes[i].width + xSpacing + markerWidth + xSpacing;
        }
        return currRenderPosX;
      })
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
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: PieChart
): void => {
  const radius = renderInfo.dataAreaSize.width * 0.5;
  const outerRadius = radius * 0.7;
  const innerRadius = outerRadius * component.ratioInnerRadius;

  // values
  const values: Array<number> = [];
  for (const strExpr of component.data) {
    const value = Resolver.resolveValue(strExpr, renderInfo);
    if (typeof value === 'number') values.push(value);
  }

  // labels
  const labels: Array<string> = [];
  for (const strExpr of component.label) {
    const label = Resolver.resolveTemplate(strExpr, renderInfo);
    labels.push(label);
  }

  // hideLabelLessThan
  const hideLabelLessThan = component.hideLabelLessThan;

  // label sizes
  const labelSizes = labels.map((n) =>
    UiUtils.getTextDimensions(n, 'tracker-tick-label')
  );

  // extLabel
  const extLabels: Array<string> = [];
  for (const strExpr of component.extLabel) {
    const extLabel = Resolver.resolveTemplate(strExpr, renderInfo);
    extLabels.push(extLabel);
  }

  // extLabel sizes
  const extLabelSizes = extLabels.map((n) => {
    return UiUtils.getTextDimensions(n, 'tracker-pie-label');
  });
  const showExtLabelOnlyIfNoLabel = component.showExtLabelOnlyIfNoLabel;

  // scale
  const colorScale = d3.scaleOrdinal().range(component.dataColor);

  const sectorsGroup = elements.dataArea.append('g');
  sectorsGroup.attr(
    'transform',
    () =>
      `translate(${renderInfo.dataAreaSize.width * 0.5}, ${
        renderInfo.dataAreaSize.height * 0.5
      })`
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .attr('fill', (_d: any, i: number) => colorScale(i.toString()))
    .attr('d', arc);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isLabelHidden = (arcObj: any) => {
    const fraction = (arcObj.endAngle - arcObj.startAngle) / (2 * Math.PI);
    return fraction < hideLabelLessThan ? true : false;
  };

  // label elements
  sectorsGroup
    .selectAll('label')
    .data(pie(values))
    .enter()
    .append('text')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .text((arcObj: any, i: number) => (isLabelHidden(arcObj) ? '' : labels[i]))
    .attr(
      'transform',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (d: any) => `translate(${arc.centroid(d)[0]}, ${arc.centroid(d)[1]})`
    )
    .style('text-anchor', 'middle')
    .attr('class', 'tracker-pie-label');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getMidAngle = (arcObj: any) => {
    return arcObj.startAngle + (arcObj.endAngle - arcObj.startAngle) / 2;
  };

  // external label elements
  sectorsGroup
    .selectAll('extLabel')
    .data(pieValues)
    .enter()
    .append('text')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .text((arcObj: any, i: number) => {
      if (showExtLabelOnlyIfNoLabel) {
        return labels[i] === '' || isLabelHidden(arcObj) ? extLabels[i] : '';
      } else {
        return extLabels[i];
      }
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .attr('transform', (arcObj: any, i: number) => {
      const posLabel = hiddenArc.centroid(arcObj);
      const midAngle = getMidAngle(arcObj);

      posLabel[0] =
        (radius * 0.99 - extLabelSizes[i].width) *
        (midAngle < Math.PI ? 1 : -1);
      return `translate(${posLabel[0]}, ${posLabel[1]})`;
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .style('text-anchor', (arcObj: any) => {
      const midAngle = getMidAngle(arcObj);
      return midAngle < Math.PI ? 'start' : 'end';
    })
    .attr('class', 'tracker-pie-label');

  const getPointsForConnectionLines = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    arcObj: any,
    i: number
  ): [number, number][] => {
    const labelWidth = labelSizes[i].width;
    const extLabelWidth = extLabelSizes[i].width;

    // TODO Why is this here?
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const labelHidden = isLabelHidden(arcObj);

    const midAngle = getMidAngle(arcObj);

    const posLabel = arc.centroid(arcObj); // line insertion in the slice
    const posMiddle = hiddenArc.centroid(arcObj); // line break: we use the other arc generator that has been built only for that
    const posExtLabel = hiddenArc.centroid(arcObj); // Label position = almost the same as posB

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
    .attr('points', (arcObj: any, i: number) => {
      if (showExtLabelOnlyIfNoLabel) {
        if (labels[i] === '' || isLabelHidden(arcObj)) {
          if (extLabels[i] !== '') {
            return getPointsForConnectionLines(arcObj, i);
          }
        }
      } else {
        if (extLabels[i] !== '') {
          return getPointsForConnectionLines(arcObj, i);
        }
      }
    })
    .attr('class', 'tracker-axis');
};
