import * as d3 from 'd3';
import { PieChart } from '../../models/pie-chart';
import { RenderInfo } from '../../models/render-info';
import { ChartElements } from '../../models/types';
import Resolver from '../../resolver/resolver';
import { ChartUtils, DomUtils } from '../../utils';

export const setChartScale = (
  _canvas: HTMLElement,
  elements: ChartElements,
  renderInfo: RenderInfo
): void => {
  const canvas = d3.select(_canvas);
  const svg = elements.svg;
  const svgWidth = parseFloat(svg.attr('width'));
  const svgHeight = parseFloat(svg.attr('height'));
  svg
    .attr('width', null)
    .attr('height', null)
    .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  if (renderInfo.fitPanelWidth) {
    canvas.style('width', '100%');
  } else {
    canvas.style('width', (svgWidth * renderInfo.fixedScale).toString() + 'px');
    canvas.style(
      'height',
      (svgHeight * renderInfo.fixedScale).toString() + 'px'
    );
  }
};

export const createAreas = (
  elements: ChartElements,
  canvas: HTMLElement,
  renderInfo: RenderInfo,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _chart: PieChart
): ChartElements => {
  // clean areas
  d3.select(canvas).select('#svg').remove();
  const props = Object.getOwnPropertyNames(elements);
  for (let i = 0; i < props.length; i++) {
    // d3.select(elements[props[i]]).remove();
    delete elements[props[i]];
  }
  // console.log(elements);
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

export const renderTitle = (
  _canvas: HTMLElement,
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: PieChart
) => {
  // console.log("renderTitle");
  // under graphArea
  if (!renderInfo || !component) return;

  if (!component.title) return;
  const titleSize = ChartUtils.measureTextSize(
    component.title,
    'tracker-title'
  );

  // Append title
  const title = elements.graphArea
    .append('text')
    .text(component.title) // pivot at center
    .attr('id', 'title')
    .attr(
      'transform',
      `translate(
        ${renderInfo.dataAreaSize.width / 2}, ${titleSize.height / 2})`
    )
    .attr('height', titleSize.height) // for later use
    .attr('class', 'tracker-title');
  elements['title'] = title;

  // Expand parent areas
  DomUtils.expandArea(elements.svg, 0, titleSize.height);
  DomUtils.expandArea(elements.graphArea, 0, titleSize.height);

  // Move sibling areas
  DomUtils.moveArea(elements.dataArea, 0, titleSize.height);

  return;
};

export const renderLegend = (
  _canvas: HTMLElement,
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: PieChart
): void => {
  // Get chart elements
  const svg = elements.svg;

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const graphArea = elements.graphArea;

  const dataArea = elements.dataArea;
  const title = elements.title;

  // Get element width and height
  let titleHeight = 0;
  if (title) {
    titleHeight = parseFloat(title.attr('height'));
  }

  // Get names and their dimension
  const names = component.dataName;
  const nameSizes = names.map((n) => {
    return ChartUtils.measureTextSize(n, 'tracker-legend-label');
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
  if (component.legendOrientation === 'vertical') {
    legendWidth = xSpacing * 3 + markerWidth + maxNameWidth;
    legendHeight = (numNames + 1) * ySpacing;
  } else if (component.legendOrientation === 'horizontal') {
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

  const legend = elements.graphArea
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

  if (component.legendOrientation === 'vertical') {
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
  } else if (component.legendOrientation === 'horizontal') {
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
  _canvas: HTMLElement,
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: PieChart
): string => {
  let errorMessage = '';

  const radius = renderInfo.dataAreaSize.width * 0.5;
  const outerRadius = radius * 0.7;
  const innerRadius = outerRadius * component.ratioInnerRadius;

  // values
  const values: Array<number> = [];
  for (const strExpr of component.data) {
    const value = Resolver.resolveValue(strExpr, renderInfo);
    if (typeof value === 'string') {
      errorMessage = value;
      break;
    } else if (typeof value === 'number') {
      values.push(value);
    }
  }
  if (errorMessage !== '') {
    return errorMessage;
  }

  // labels
  const labels: Array<string> = [];
  for (const strExpr of component.label) {
    const label = Resolver.resolveTemplate(strExpr, renderInfo);
    if (label.startsWith('Error')) {
      errorMessage = label;
      break;
    }
    labels.push(label);
  }
  if (errorMessage !== '') {
    return errorMessage;
  }

  // hideLabelLessThan
  const hideLabelLessThan = component.hideLabelLessThan;

  // label sizes
  const labelSizes = labels.map((n) =>
    ChartUtils.measureTextSize(n, 'tracker-tick-label')
  );

  // extLabel
  const extLabels: Array<string> = [];
  for (const strExpr of component.extLabel) {
    const extLabel = Resolver.resolveTemplate(strExpr, renderInfo);
    if (extLabel.startsWith('Error')) {
      errorMessage = extLabel;
      break;
    }
    extLabels.push(extLabel);
  }
  if (errorMessage !== '') {
    return errorMessage;
  }

  // extLabel sizes
  const extLabelSizes = extLabels.map((n) => {
    return ChartUtils.measureTextSize(n, 'tracker-pie-label');
  });
  const showExtLabelOnlyIfNoLabel = component.showExtLabelOnlyIfNoLabel;

  // scale
  const colorScale = d3.scaleOrdinal().range(component.dataColor);

  const sectorsGroup = elements.dataArea.append('g');
  sectorsGroup.attr('transform', () => {
    const strTranslate = `translate(${renderInfo.dataAreaSize.width * 0.5}, ${
      renderInfo.dataAreaSize.height * 0.5
    })`;

    return strTranslate;
  });

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
    // console.log(`start/end: ${arcObj.startAngle}/${arcObj.endAngle}`);
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
