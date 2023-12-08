import * as d3 from 'd3';
import { Orientation, Position } from '../../enums';
import { TrackerError } from '../../errors';
import { ComponentType, TYAxisLocation, ValueType } from '../../models/enums';
import { RenderInfo } from '../../models/render-info';
import { ComponentElements } from '../../models/types';
import { BarChart } from '../../ui-components/chart/bar-chart.model';
import { CartesianChart } from '../../ui-components/chart/cartesian-chart.model';
import { LineChart } from '../../ui-components/chart/line-chart.model';
import { DateTimeUtils, DomUtils, UiUtils } from '../../utils';
import {
  getXTickLabelFormatter,
  getXTicks,
  getYTickLabelFormatter,
  getYTicks,
} from './cartesian-chart.helper';

/**
 * @summary Renders the X-Axis for Cartesian Charts
 * @param {ComponentElements} elements
 * @param {RenderInfo} renderInfo
 * @param {CartesianChart} component
 */
export const renderXAxis = (
  elements: ComponentElements,
  renderInfo: RenderInfo,
  component: CartesianChart
): void => {
  if (!renderInfo || !component) return;

  const { datasets, dataAreaSize } = renderInfo;
  const { dates } = datasets;
  const { height, width } = dataAreaSize;
  const {
    xAxisColor,
    xAxisLabel,
    xAxisLabelColor,
    xAxisTickInterval,
    xAxisTickLabelFormat,
  } = component;

  const domain = d3.extent(datasets.dates);
  const scale = d3.scaleTime().domain(domain).range([0, width]);
  const axisGen = d3.axisBottom(scale);
  elements.xScale = scale;

  const tickIntervalInDuration = DateTimeUtils.parseDuration(xAxisTickInterval);

  const { values, interval } = getXTicks(dates, tickIntervalInDuration);
  if (values && values.length !== 0) axisGen.tickValues(values);
  else if (interval) axisGen.ticks(interval);

  const formatter = getXTickLabelFormatter(dates, xAxisTickLabelFormat);
  if (formatter) axisGen.tickFormat(formatter);

  const xAxis = elements.dataArea // axis includes ticks
    .append('g')
    .attr('id', 'xAxis')
    .attr('transform', `translate(0, ${height})`) // relative to graphArea
    .call(axisGen)
    .attr('class', 'tracker-axis');
  if (xAxisColor) xAxis.style('stroke', xAxisColor);
  elements.xAxis = xAxis;

  const { height: textHeight, width: textWidth } =
    UiUtils.getDimensions('99-99-99');

  const xAxisTickLabels = xAxis
    .selectAll('text')
    .attr('x', -1 * textHeight * Math.cos((65 / 180) * Math.PI))
    .attr('y', 0)
    .attr('transform', 'rotate(-65)')
    .style('text-anchor', 'end')
    .attr('class', 'tracker-tick-label');

  if (xAxisColor) xAxisTickLabels.style('fill', xAxisColor);

  const tickLength = 6;
  const tickLabelHeight = textWidth * Math.sin((65 / 180) * Math.PI);

  const axisLabel = xAxis
    .append('text')
    .text(xAxisLabel)
    .attr(
      'transform',
      `translate(${width / 2}, ${tickLength + tickLabelHeight})`
    )
    .attr('class', 'tracker-axis-label');

  if (xAxisLabelColor) axisLabel.style('fill', xAxisLabelColor);

  // xAxis height
  xAxis.attr('height', tickLength + tickLabelHeight);

  // Expand areas
  DomUtils.expandArea(elements.svg, 0, tickLength + tickLabelHeight);
  DomUtils.expandArea(elements.graphArea, 0, tickLength + tickLabelHeight);
};

/**
 * @summary Renders the Y-Axis for Cartesian Charts
 * @param {ComponentElements} elements
 * @param {RenderInfo} renderInfo
 * @param {CartesianChart} component
 * @param {'left' | 'right'} position
 * @param {number[]} datasetIds
 */
export const renderYAxis = (
  elements: ComponentElements,
  renderInfo: RenderInfo,
  component: CartesianChart,
  position: TYAxisLocation,
  datasetIds: Array<number>
): void => {
  if (!renderInfo || !component || datasetIds.length === 0) return;
  if (![Position.LEFT, Position.RIGHT].includes(position))
    throw new TrackerError(`Y-Axis location must be either 'left' or 'right'`);

  const { datasets, dataAreaSize } = renderInfo;
  const { height, width } = dataAreaSize;

  if (position !== Position.LEFT && position !== Position.RIGHT) return;

  let axisMin = null;
  let axisMax = null;
  let tmpValueIsTime = null;
  let valueIsTime = false;
  for (const datasetId of datasetIds) {
    const dataset = datasets.getDatasetById(datasetId);
    if (dataset.query.usedAsXDataset) continue;
    if (axisMin === null || dataset.yMin < axisMin) axisMin = dataset.yMin;
    if (axisMax === null || dataset.yMax > axisMax) axisMax = dataset.yMax;

    // Need all datasets have same settings for time value
    valueIsTime = dataset.valueType === ValueType.Time;
    if (tmpValueIsTime === null) tmpValueIsTime = valueIsTime;
    else if (valueIsTime !== tmpValueIsTime)
      throw new TrackerError('Not all values in time format');
  }
  let min = null;
  if (position === Position.LEFT) min = component.yMin[0];
  else if (position === Position.RIGHT) min = component.yMin[1];

  let minAssigned = false;
  if (typeof min !== 'number') min = axisMin;
  else minAssigned = true;

  let max = null;
  if (position === Position.LEFT) max = component.yMax[0];
  else if (position === Position.RIGHT) max = component.yMax[1];

  let maxAssigned = false;
  if (typeof max !== 'number') max = axisMax;
  else maxAssigned = true;

  if (max < min) {
    const yTmp = min;
    min = max;
    max = yTmp;
    const yTmpAssigned = minAssigned;
    minAssigned = maxAssigned;
    maxAssigned = yTmpAssigned;
  }

  const span = max - min;

  let lower = minAssigned ? min : min - span * 0.2;
  let upper = maxAssigned ? max : max + span * 0.2;

  // if it is bar chart, zero must be contained in the range
  if (component.componentType === ComponentType.BarChart) {
    if (upper < 0) upper = 0;
    if (lower > 0) lower = 0;
  }

  const domain =
    (position === Position.LEFT && component.reverseYAxis[0]) ||
    (position === Position.RIGHT && component.reverseYAxis[1])
      ? [upper, lower]
      : [lower, upper];

  const scale = d3.scaleLinear();
  scale.domain(domain).range([height, 0]);
  elements[`${position}YScale`] = scale;

  let axisColor = '';
  if (position === Position.LEFT) axisColor = component.yAxisColor[0];
  else if (position === Position.RIGHT) axisColor = component.yAxisColor[1];

  let labelColor = '';
  if (position === Position.LEFT) labelColor = component.yAxisLabelColor[0];
  else if (position === Position.RIGHT)
    labelColor = component.yAxisLabelColor[1];

  let labelText = '';
  if (position === Position.LEFT) labelText = component.yAxisLabel[0];
  else if (position === Position.RIGHT) labelText = component.yAxisLabel[1];

  let unitText = '';
  let interval = null;
  let labelFormat = null;
  if (position === Position.LEFT) {
    unitText = component.yAxisUnit[0];
    interval = component.yAxisTickInterval[0]; // string
    labelFormat = component.yAxisTickLabelFormat[0];
  } else if (position === Position.RIGHT) {
    unitText = component.yAxisUnit[1];
    interval = component.yAxisTickInterval[1]; // string
    labelFormat = component.yAxisTickLabelFormat[1];
  }

  let tickInterval = null;
  if (valueIsTime) tickInterval = DateTimeUtils.parseDuration(interval);
  else {
    tickInterval = parseFloat(interval);
    if (!Number.isNumber(tickInterval) || Number.isNaN(tickInterval))
      tickInterval = null;
  }

  let axisGen;
  if (position === Position.LEFT) axisGen = d3.axisLeft(scale);
  else if (position === Position.RIGHT) axisGen = d3.axisRight(scale);

  if (axisGen) {
    const labelFormatter = getYTickLabelFormatter(
      lower,
      upper,
      labelFormat,
      valueIsTime
    );
    if (labelFormatter) axisGen.tickFormat(labelFormatter);

    const ticks = getYTicks(lower, upper, tickInterval, valueIsTime);
    if (ticks) axisGen.tickValues(ticks);
  }

  const axis = elements.dataArea
    .append('g')
    .attr('id', 'yAxis')
    .call(axisGen)
    .attr('class', 'tracker-axis');
  if (position == Position.RIGHT)
    axis.attr('transform', 'translate(' + width + ' ,0)');

  elements[`${position}YAxis`] = axis;

  if (axisColor) {
    axis.selectAll('path').style('stroke', axisColor);
    axis.selectAll('line').style('stroke', axisColor);
  }

  const tickLabels = axis.selectAll('text').attr('class', 'tracker-tick-label');
  if (axisColor) tickLabels.style('fill', axisColor);

  // Get max tick label width
  let maxTickLabelWidth = 0;
  for (const tickLabel of tickLabels) {
    if (tickLabel.textContent) {
      const tickLabelWidth = UiUtils.getDimensions(
        tickLabel.textContent,
        'tracker-axis-label'
      ).width;
      if (tickLabelWidth > maxTickLabelWidth)
        maxTickLabelWidth = tickLabelWidth;
    }
  }
  if (unitText !== '') labelText += ' (' + unitText + ')';

  const tickLength = 6;
  const labelHeight = UiUtils.getDimensions(labelText).height;
  const label = axis
    .append('text')
    .text(labelText)
    .attr('transform', 'rotate(-90)')
    .attr('x', (-1 * height) / 2)
    .attr('class', 'tracker-axis-label');
  if (position === Position.LEFT)
    label.attr('y', -tickLength - maxTickLabelWidth - labelHeight / 2);
  else label.attr('y', +tickLength + maxTickLabelWidth + labelHeight);

  if (labelColor) label.style('fill', labelColor);

  const axisWidth = labelHeight + maxTickLabelWidth + tickLength;
  axis.attr('width', axisWidth);

  // Expand areas
  DomUtils.expandArea(elements.svg, axisWidth, 0);
  DomUtils.expandArea(elements.graphArea, axisWidth, 0);

  // Move areas
  if (position === Position.LEFT) {
    // Move dataArea
    DomUtils.moveArea(elements.dataArea, axisWidth, 0);
    // Move title
    if (elements.title) DomUtils.moveArea(elements.title, axisWidth, 0);
  }
};

export const renderLegend = (
  elements: ComponentElements,
  renderInfo: RenderInfo,
  component: CartesianChart
): void => {
  const { svg, graphArea, dataArea, title, xAxis, leftYAxis, rightYAxis } =
    elements;
  const {
    legendOrientation,
    legendPosition,
    componentType,
    legendBgColor,
    legendBorderColor,
  } = component;
  const { dataAreaSize, datasets } = renderInfo;

  // Get element width and height
  let titleHeight = 0;
  if (title) titleHeight = parseFloat(title.attr('height'));

  const xAxisHeight = parseFloat(xAxis.attr('height'));
  let leftYAxisWidth = 0;
  if (leftYAxis) leftYAxisWidth = parseFloat(leftYAxis.attr('width'));

  let rightYAxisWidth = 0;
  if (rightYAxis) rightYAxisWidth = parseFloat(rightYAxis.attr('width'));

  // Get datasets
  const xDatasetIds = datasets.getXDatasetIds();

  // Get names and their dimension
  const names = datasets.names; // xDataset name included
  const nameSizes = names.map((n) => {
    return UiUtils.getDimensions(n, 'tracker-legend-label');
  });
  let indMaxName = 0;
  let maxNameWidth = 0;
  for (let ind = 0; ind < names.length; ind++) {
    if (xDatasetIds.includes(ind)) continue;
    if (nameSizes[ind].width > maxNameWidth) {
      maxNameWidth = nameSizes[ind].width;
      indMaxName = ind;
    }
  }
  const maxName = names[indMaxName];
  const characterWidth = maxNameWidth / maxName.length;
  const nameHeight = nameSizes[indMaxName].height;
  const numNames = names.length - xDatasetIds.length;

  const xSpacing = 2 * characterWidth;
  const ySpacing = nameHeight;
  const markerWidth = 2 * characterWidth;

  // Get legend width and height
  let legendWidth = 0;
  let legendHeight = 0;
  if (legendOrientation === Orientation.VERTICAL) {
    legendWidth = xSpacing * 3 + markerWidth + maxNameWidth;
    legendHeight = (numNames + 1) * ySpacing;
  } else if (legendOrientation === Orientation.HORIZONTAL) {
    legendWidth =
      (2 * xSpacing + markerWidth) * numNames +
      xSpacing +
      d3.sum(nameSizes, (s, i) => (xDatasetIds.includes(i) ? 0 : s.width));
    legendHeight = ySpacing + nameHeight;
  }

  // Calculate legendX and legendY
  let legendX = 0; // relative to graphArea
  let legendY = 0;
  if (legendPosition === Position.TOP) {
    // below title
    legendX = leftYAxisWidth + dataAreaSize.width / 2 - legendWidth / 2;
    legendY = titleHeight;
    // Expand svg
    DomUtils.expandArea(svg, 0, legendHeight + ySpacing);
    // Move dataArea down
    DomUtils.moveArea(dataArea, 0, legendHeight + ySpacing);
  } else if (legendPosition === Position.BOTTOM) {
    // bellow x-axis label
    legendX = leftYAxisWidth + dataAreaSize.width / 2 - legendWidth / 2;
    legendY = titleHeight + dataAreaSize.height + xAxisHeight + ySpacing;
    // Expand svg
    DomUtils.expandArea(svg, 0, legendHeight + ySpacing);
  } else if (legendPosition === Position.LEFT) {
    legendX = 0;
    legendY = titleHeight + dataAreaSize.height / 2 - legendHeight / 2;
    // Expand svg
    DomUtils.expandArea(svg, legendWidth + xSpacing, 0);
    // Move dataArea right
    DomUtils.moveArea(dataArea, legendWidth + xSpacing, 0);
  } else if (legendPosition === Position.RIGHT) {
    legendX = dataAreaSize.width + leftYAxisWidth + rightYAxisWidth + xSpacing;
    legendY = titleHeight + dataAreaSize.height / 2 - legendHeight / 2;
    // Expand svg
    DomUtils.expandArea(svg, legendWidth + xSpacing, 0);
  } else {
    return;
  }

  const legend = graphArea
    .append('g')
    .attr('id', 'legend')
    .attr('transform', 'translate(' + legendX + ',' + legendY + ')');

  const legendBg = legend
    .append('rect')
    .attr('class', 'tracker-legend')
    .attr('width', legendWidth)
    .attr('height', legendHeight);
  if (legendBgColor) legendBg.style('fill', legendBgColor);
  if (legendBorderColor) legendBg.style('stroke', legendBorderColor);

  const firstMarkerX = xSpacing;
  const firstMarkerY = nameHeight;
  const firstLabelX = firstMarkerX + xSpacing + markerWidth; // xSpacing + 2 * xSpacing
  const firstLabelY = firstMarkerY;

  if (legendOrientation === Orientation.VERTICAL) {
    if (componentType === ComponentType.LineChart) {
      // lines
      legend
        .selectAll('markers')
        .data(names)
        .enter()
        .append('line')
        .attr('x1', firstMarkerX)
        .attr('x2', firstMarkerX + markerWidth)
        .attr('y1', (name: string, i: number) => {
          const numElemsExcluded = xDatasetIds.filter((id) => {
            return id < i;
          }).length;
          i = i - numElemsExcluded;
          return firstMarkerY + i * ySpacing;
        })
        .attr('y2', (name: string, i: number) => {
          const numElemsExcluded = xDatasetIds.filter((id) => {
            return id < i;
          }).length;
          i = i - numElemsExcluded;
          return firstMarkerY + i * ySpacing;
        })
        .style('stroke', (name: string, i: number) => {
          if (xDatasetIds.includes(i)) return;
          return (component as LineChart).lineColor[i];
        });

      // points
      legend
        .selectAll('markers')
        .data(names)
        .enter()
        .append('circle')
        .attr('cx', firstMarkerX + markerWidth / 2)
        .attr('cy', (name: string, i: number) => {
          const numElemsExcluded = xDatasetIds.filter((id) => {
            return id < i;
          }).length;
          i = i - numElemsExcluded;
          return firstMarkerY + i * ySpacing;
        })
        .attr('r', (name: string, i: number) => {
          if (xDatasetIds.includes(i)) return;
          if ((component as LineChart).showPoint[i]) {
            return (component as LineChart).pointSize[i];
          }
          return 0;
        })
        .style('fill', (name: string, i: number) => {
          if (xDatasetIds.includes(i)) return;
          return (component as LineChart).pointColor[i];
        });
    } else if (component.componentType === ComponentType.BarChart) {
      // bars
      legend
        .selectAll('markers')
        .data(names)
        .enter()
        .append('rect')
        .attr('x', firstMarkerX)
        .attr('y', (name: string, i: number) => {
          const numElemsExcluded = xDatasetIds.filter((id) => {
            return id < i;
          }).length;
          i = i - numElemsExcluded;
          return firstMarkerY + i * ySpacing - nameHeight / 2;
        })
        .attr('width', markerWidth)
        .attr('height', nameHeight)
        .style('fill', (name: string, i: number) => {
          if (xDatasetIds.includes(i)) return;
          return (component as BarChart).barColor[i];
        });
    }

    // names
    const nameLabels = legend
      .selectAll('labels')
      .data(names)
      .enter()
      .append('text')
      .attr('x', firstLabelX)
      .attr('y', (name: string, i: number) => {
        const numElemsExcluded = xDatasetIds.filter((id) => {
          return id < i;
        }).length;
        i = i - numElemsExcluded;
        return firstLabelY + i * ySpacing;
      })
      .text((name: string, i: number) => {
        if (xDatasetIds.includes(i)) return '';
        return name;
      })
      .style('alignment-baseline', 'middle')
      .attr('class', 'tracker-legend-label');

    if (componentType === ComponentType.LineChart) {
      nameLabels.style('fill', (name: string, i: number) => {
        if (xDatasetIds.includes(i)) return;
        return (component as LineChart).lineColor[i];
      });
    } else if (componentType === ComponentType.BarChart) {
      nameLabels.style('fill', (name: string, i: number) => {
        if (xDatasetIds.includes(i)) return;
        return (component as BarChart).barColor[i];
      });
    }
  } else if (legendOrientation === Orientation.HORIZONTAL) {
    if (componentType === ComponentType.LineChart) {
      // lines
      legend
        .selectAll('markers')
        .data(names)
        .enter()
        .append('line')
        .attr('x1', (name: string, i: number) => {
          let posX = xSpacing;
          for (const [ind, size] of nameSizes.entries()) {
            if (xDatasetIds.includes(ind)) continue;
            if (ind < i) posX += markerWidth + xSpacing + size.width + xSpacing;
            else break;
          }
          return posX;
        })
        .attr('x2', (name: string, i: number) => {
          let posX = xSpacing + markerWidth;
          for (const [ind, size] of nameSizes.entries()) {
            if (xDatasetIds.includes(ind)) continue;
            if (ind < i) posX += xSpacing + size.width + xSpacing + markerWidth;
            else break;
          }
          return posX;
        })
        .attr('y1', firstMarkerY)
        .attr('y2', firstMarkerY)
        .style('stroke', (name: string, i: number) => {
          if (xDatasetIds.includes(i)) return;
          return (component as LineChart).lineColor[i];
        });

      // points
      legend
        .selectAll('markers')
        .data(names)
        .enter()
        .append('circle')
        .attr('cx', (name: string, i: number) => {
          let posX = xSpacing + markerWidth / 2;
          for (const [ind, size] of nameSizes.entries()) {
            if (xDatasetIds.includes(ind)) continue;
            if (ind < i) {
              posX +=
                markerWidth / 2 +
                xSpacing +
                size.width +
                xSpacing +
                markerWidth / 2;
            } else {
              break;
            }
          }
          return posX;
        })
        .attr('cy', firstMarkerY)
        .attr('r', (name: string, i: number) => {
          if (xDatasetIds.includes(i)) return;
          if ((component as LineChart).showPoint[i])
            return (component as LineChart).pointSize[i];
          return 0;
        })
        .style('fill', (name: string, i: number) => {
          if (xDatasetIds.includes(i)) return;
          return (component as LineChart).pointColor[i];
        });
    } else if (componentType === ComponentType.BarChart) {
      // bars
      legend
        .selectAll('markers')
        .data(
          names.filter((n, i) => {
            return !xDatasetIds.includes(i);
          })
        )
        .enter()
        .append('rect')
        .attr('x', (name: string, i: number) => {
          let posX = xSpacing;
          for (const [ind, size] of nameSizes.entries()) {
            if (xDatasetIds.includes(ind)) continue;
            if (ind < i) {
              posX += markerWidth + xSpacing + size.width + xSpacing;
            } else {
              break;
            }
          }
          return posX;
        })
        .attr('y', firstMarkerY - nameHeight / 2)
        .attr('width', markerWidth)
        .attr('height', nameHeight)
        .style('fill', (name: string, i: number) => {
          if (xDatasetIds.includes(i)) return;
          return (component as BarChart).barColor[i];
        });
    }

    // names
    const nameLabels = legend
      .selectAll('labels')
      .data(names)
      .enter()
      .append('text')
      .attr('x', (name: string, i: number) => {
        let posX = xSpacing + markerWidth + xSpacing;
        for (const [ind, size] of nameSizes.entries()) {
          if (xDatasetIds.includes(ind)) continue;
          if (ind < i) {
            posX += size.width + xSpacing + markerWidth + xSpacing;
          } else {
            break;
          }
        }
        return posX;
      })
      .attr('y', firstLabelY)
      .text((name: string, i: number) => {
        if (xDatasetIds.includes(i)) return '';
        return name;
      })
      .style('alignment-baseline', 'middle')
      .attr('class', 'tracker-legend-label');

    if (componentType === ComponentType.LineChart) {
      nameLabels.style('fill', (name: string, i: number) => {
        if (xDatasetIds.includes(i)) return;
        return (component as LineChart).lineColor[i];
      });
    } else if (componentType === ComponentType.BarChart) {
      nameLabels.style('fill', (name: string, i: number) => {
        if (xDatasetIds.includes(i)) return;
        return (component as BarChart).barColor[i];
      });
    }
  }
};
