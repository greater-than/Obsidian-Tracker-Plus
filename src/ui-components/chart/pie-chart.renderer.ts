import * as d3 from 'd3';
import * as expr from '../../expressions/resolver';
import { RenderInfo } from '../../models/render-info';
import { ComponentElements } from '../../models/types';
import * as helper from '../../utils/helper';
import { PieChart } from './pie-chart.model';

const setChartScale = (
  _canvas: HTMLElement,
  chartElements: ComponentElements,
  renderInfo: RenderInfo
): void => {
  const canvas = d3.select(_canvas);
  const svg = chartElements.svg;
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

const createAreas = (
  chartElements: ComponentElements,
  canvas: HTMLElement,
  renderInfo: RenderInfo,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _pieInfo: PieChart
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

const renderTitle = (
  _canvas: HTMLElement,
  chartElements: ComponentElements,
  renderInfo: RenderInfo,
  pieInfo: PieChart
) => {
  // console.log("renderTitle");
  // under graphArea

  if (!renderInfo || !pieInfo) return;

  if (!pieInfo.title) return;
  const titleSize = helper.measureTextSize(pieInfo.title, 'tracker-title');

  // Append title
  const title = chartElements.graphArea
    .append('text')
    .text(pieInfo.title) // pivot at center
    .attr('id', 'title')
    .attr(
      'transform',
      'translate(' +
        renderInfo.dataAreaSize.width / 2.0 +
        ',' +
        titleSize.height / 2.0 +
        ')'
    )
    .attr('height', titleSize.height) // for later use
    .attr('class', 'tracker-title');
  chartElements['title'] = title;

  // Expand parent areas
  helper.expandArea(chartElements.svg, 0, titleSize.height);
  helper.expandArea(chartElements.graphArea, 0, titleSize.height);

  // Move sibling areas
  helper.moveArea(chartElements.dataArea, 0, titleSize.height);

  return;
};

const renderLegend = (
  _canvas: HTMLElement,
  chartElements: ComponentElements,
  renderInfo: RenderInfo,
  pieInfo: PieChart
): void => {
  // console.log("renderLegend");
  // console.log(piInfo.legendPosition);
  // console.log(piInfo.legendOrientation);

  // Get chart elements
  const svg = chartElements.svg;

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const graphArea = chartElements.graphArea;

  const dataArea = chartElements.dataArea;
  const title = chartElements.title;

  // Get element width and height
  let titleHeight = 0.0;
  if (title) {
    titleHeight = parseFloat(title.attr('height'));
  }

  // Get names and their dimension
  const names = pieInfo.dataName;
  const nameSizes = names.map((n) => {
    return helper.measureTextSize(n, 'tracker-legend-label');
  });
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
  if (pieInfo.legendOrientation === 'vertical') {
    legendWidth = xSpacing * 3 + markerWidth + maxNameWidth;
    legendHeight = (numNames + 1) * ySpacing;
  } else if (pieInfo.legendOrientation === 'horizontal') {
    legendWidth =
      (2 * xSpacing + markerWidth) * numNames +
      xSpacing +
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      d3.sum(nameSizes, (s, _i) => s.width);
    legendHeight = ySpacing + nameHeight;
  }
  // console.log(
  //     `maxName: ${maxName}, characterWidth: ${characterWidth}, maxNameWidth: ${maxNameWidth}`
  // );
  // console.log(`xSpacing:${xSpacing}, numNames: ${numNames}, markerWidth: ${markerWidth}`);
  // console.log(`legendWidth: ${legendWidth}, legendHeight: ${legendHeight}`);

  // Calculate legendX and legendY
  let legendX = 0.0; // relative to graphArea
  let legendY = 0.0;
  if (pieInfo.legendPosition === 'top') {
    // below title
    legendX = renderInfo.dataAreaSize.width / 2.0 - legendWidth / 2.0;
    legendY = titleHeight;
    // Expand svg
    helper.expandArea(svg, 0, legendHeight + ySpacing);
    // Move dataArea down
    helper.moveArea(dataArea, 0, legendHeight + ySpacing);
  } else if (pieInfo.legendPosition === 'bottom') {
    // bellow x-axis label
    legendX = renderInfo.dataAreaSize.width / 2.0 - legendWidth / 2.0;
    legendY = titleHeight + renderInfo.dataAreaSize.height + ySpacing;
    // Expand svg
    helper.expandArea(svg, 0, legendHeight + ySpacing);
  } else if (pieInfo.legendPosition === 'left') {
    legendX = 0;
    legendY =
      titleHeight + renderInfo.dataAreaSize.height / 2.0 - legendHeight / 2.0;
    // Expand svg
    helper.expandArea(svg, legendWidth + xSpacing, 0);
    // Move dataArea right
    helper.moveArea(dataArea, legendWidth + xSpacing, 0);
  } else if (pieInfo.legendPosition === 'right') {
    legendX = renderInfo.dataAreaSize.width + xSpacing;
    legendY =
      titleHeight + renderInfo.dataAreaSize.height / 2.0 - legendHeight / 2.0;
    // Expand svg
    helper.expandArea(svg, legendWidth + xSpacing, 0);
  } else {
    return;
  }
  // console.log(`legendX: ${legendX}, legendY: ${legendY}`);

  const legend = chartElements.graphArea
    .append('g')
    .attr('id', 'legend')
    .attr('transform', 'translate(' + legendX + ',' + legendY + ')');
  // console.log('legendX: %d, legendY: %d', legendX, legendY);

  const legendBg = legend
    .append('rect')
    .attr('class', 'tracker-legend')
    .attr('width', legendWidth)
    .attr('height', legendHeight);
  if (pieInfo.legendBgColor) {
    legendBg.style('fill', pieInfo.legendBgColor);
  }
  if (pieInfo.legendBorderColor) {
    legendBg.style('stroke', pieInfo.legendBorderColor);
  }

  const markerRadius = 5.0;
  const firstMarkerX = xSpacing;
  const firstMarkerY = nameHeight;
  const firstLabelX = firstMarkerX + xSpacing + markerWidth; // xSpacing + 2 * xSpacing
  const firstLabelY = firstMarkerY;

  if (pieInfo.legendOrientation === 'vertical') {
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
      .style('fill', (_name: string, i: number) => pieInfo.dataColor[i]);

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
      (_name: string, i: number) => pieInfo.dataColor[i]
    );
  } else if (pieInfo.legendOrientation === 'horizontal') {
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
      .attr('cx', (_name: string, i: number) => {
        if (i === 0) {
          currRenderPosX = firstMarkerX + markerWidth / 2.0;
        } else {
          currRenderPosX +=
            nameSizes[i].width + xSpacing + markerWidth + xSpacing;
        }
        return currRenderPosX;
      })
      .attr('cy', firstMarkerY)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .attr('r', (_name: string, _i: number) => markerRadius)
      .style('fill', (_name: string, i: number) => pieInfo.dataColor[i]);

    // names
    currRenderPosX = 0.0;
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
      (_name: string, i: number) => pieInfo.dataColor[i]
    );
  }
};

const renderPie = (
  _canvas: HTMLElement,
  chartElements: ComponentElements,
  renderInfo: RenderInfo,
  pieInfo: PieChart
): string => {
  // console.log("renderPie");
  // console.log(renderInfo);
  let errorMessage = '';

  const radius = renderInfo.dataAreaSize.width * 0.5;
  const outerRadius = radius * 0.7;
  const innerRadius = outerRadius * pieInfo.ratioInnerRadius;

  // values
  const values: Array<number> = [];
  for (const strExpr of pieInfo.data) {
    const retValue = expr.resolveValue(strExpr, renderInfo);
    if (typeof retValue === 'string') {
      errorMessage = retValue;
      break;
    } else if (typeof retValue === 'number') {
      values.push(retValue);
    }
  }
  if (errorMessage !== '') {
    return errorMessage;
  }
  // console.log(values);

  // labels
  const labels: Array<string> = [];
  for (const strExpr of pieInfo.label) {
    const retLabel = expr.resolveTemplate(strExpr, renderInfo);
    // console.log(retLabel);
    if (retLabel.startsWith('Error')) {
      errorMessage = retLabel;
      break;
    }
    labels.push(retLabel);
  }
  if (errorMessage !== '') {
    return errorMessage;
  }
  // console.log(labels);

  // hideLabelLessThan
  const hideLabelLessThan = pieInfo.hideLabelLessThan;

  // label sizes
  const labelSizes = labels.map((n) =>
    helper.measureTextSize(n, 'tracker-tick-label')
  );

  // extLabel
  const extLabels: Array<string> = [];
  for (const strExpr of pieInfo.extLabel) {
    const retExtLabel = expr.resolveTemplate(strExpr, renderInfo);
    if (retExtLabel.startsWith('Error')) {
      errorMessage = retExtLabel;
      break;
    }
    extLabels.push(retExtLabel);
  }
  if (errorMessage !== '') {
    return errorMessage;
  }
  // console.log(extLabels);

  // extLabel sizes
  const extLabelSizes = extLabels.map((n) => {
    return helper.measureTextSize(n, 'tracker-pie-label');
  });
  // console.log(extLabelSizes);

  const showExtLabelOnlyIfNoLabel = pieInfo.showExtLabelOnlyIfNoLabel;

  // scale
  const colorScale = d3.scaleOrdinal().range(pieInfo.dataColor);

  const sectorsGroup = chartElements.dataArea.append('g');
  sectorsGroup.attr('transform', () => {
    const strTranslate =
      'translate(' +
      renderInfo.dataAreaSize.width * 0.5 +
      ',' +
      renderInfo.dataAreaSize.height * 0.5 +
      ')';

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
    .attr('fill', (_d: any, i: number) => {
      return colorScale(i.toString());
    })
    .attr('d', arc);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isLabelHidden = (arcObj: any) => {
    // console.log(`start/end: ${arcObj.startAngle}/${arcObj.endAngle}`);
    const fraction = (arcObj.endAngle - arcObj.startAngle) / (2.0 * Math.PI);
    if (fraction < hideLabelLessThan) {
      return true;
    }
    return false;
  };

  // label elements
  sectorsGroup
    .selectAll('label')
    .data(pie(values))
    .enter()
    .append('text')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .text((arcObj: any, i: number) => {
      if (isLabelHidden(arcObj)) {
        return '';
      }
      return labels[i];
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .attr('transform', (d: any) => {
      return 'translate(' + arc.centroid(d)[0] + ',' + arc.centroid(d)[1] + ')';
    })
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
        if (labels[i] === '' || isLabelHidden(arcObj)) {
          return extLabels[i];
        }
        return '';
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
      return 'translate(' + posLabel[0] + ',' + posLabel[1] + ')';
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
    // console.log(labels[i]);
    // console.log(`label/middle/extLabel: ${posLabel}/${posMiddle}/${posExtLabel}`);

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

    if (distMiddleToLabel > distExtLabelToLabel) {
      // console.log("two points");
      return [posLabel, posExtLabel];
    }
    return [posLabel, posMiddle, posExtLabel];
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

export const renderPieChart = (
  canvas: HTMLElement,
  renderInfo: RenderInfo,
  pieInfo: PieChart
) => {
  // console.log("renderPieChart");
  // console.log(renderInfo);
  if (!renderInfo || !pieInfo) return;

  // return "Under construction";

  let chartElements: ComponentElements = {};
  chartElements = createAreas(chartElements, canvas, renderInfo, pieInfo);

  // Set default dataColor if no dataColor provided
  const defaultDataColor = d3.schemeSpectral[pieInfo.dataColor.length];
  for (let i = 0; i < pieInfo.dataColor.length; i++) {
    if (pieInfo.dataColor[i] === null) {
      pieInfo.dataColor[i] = defaultDataColor[i];
    }
  }

  renderTitle(canvas, chartElements, renderInfo, pieInfo);

  renderPie(canvas, chartElements, renderInfo, pieInfo);

  if (pieInfo.showLegend) {
    renderLegend(canvas, chartElements, renderInfo, pieInfo);
  }

  setChartScale(canvas, chartElements, renderInfo);
};
