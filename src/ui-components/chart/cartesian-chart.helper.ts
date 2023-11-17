import * as d3 from 'd3';
import { sprintf } from 'sprintf-js';
import { Position } from '../../enums';
import { TrackerError } from '../../errors';
import { DataPoint } from '../../models/data-point.model';
import { Dataset } from '../../models/dataset';
import { ComponentType, ValueType } from '../../models/enums';
import { RenderInfo } from '../../models/render-info';
import { ComponentElements } from '../../models/types';
import { BarChart } from '../../ui-components/chart/bar-chart.model';
import { CartesianChart } from '../../ui-components/chart/cartesian-chart.model';
import { LineChart } from '../../ui-components/chart/line-chart.model';
import { DateTimeUtils, DomUtils, UiUtils } from '../../utils';
import Duration = moment.Duration;
import Moment = moment.Moment;

export const getXTicks = (
  dates: Moment[],
  interval: Duration
): { tickValues: Array<Date>; tickInterval: d3.TimeInterval } => {
  // The input interval could be null,
  // generate tick values even if interval is null
  let tickValues: Array<Date> = [];
  let tickInterval = null;

  // y values are time values
  if (interval) {
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    tickValues = d3.timeDay.range(
      firstDate.toDate(),
      lastDate.toDate(),
      interval.asDays()
    );
  } else {
    const days = dates.length;
    if (days <= 15) {
      // number of ticks: 0-15
      tickInterval = d3.timeDay;
    } else if (days <= 4 * 15) {
      // number of ticks: 4-15
      tickInterval = d3.timeDay.every(4);
    } else if (days <= 7 * 15) {
      // number of ticks: 8-15
      tickInterval = d3.timeWeek;
    } else if (days <= 15 * 30) {
      // number of ticks: 4-15
      tickInterval = d3.timeMonth;
    } else if (days <= 15 * 60) {
      // number of ticks: 8-15
      tickInterval = d3.timeMonth.every(2);
    } else {
      tickInterval = d3.timeYear;
    }
  }
  return { tickValues, tickInterval };
};

export const getXTickLabelFormatter = (
  dates: Moment[],
  inTickLabelFormat: string
): ((date: Date) => string) => {
  if (inTickLabelFormat) {
    return (date: Date): string =>
      DateTimeUtils.dateToString(window.moment(date), inTickLabelFormat);
  } else {
    const days = dates.length;
    if (days <= 15) {
      // number of ticks: 0-15
      return d3.timeFormat('%y-%m-%d');
    } else if (days <= 4 * 15) {
      // number of ticks: 4-15
      return d3.timeFormat('%y-%m-%d');
    } else if (days <= 7 * 15) {
      // number of ticks: 8-15
      return d3.timeFormat('%y-%m-%d');
    } else if (days <= 15 * 30) {
      // number of ticks: 4-15
      return d3.timeFormat('%y %b');
    } else if (days <= 15 * 60) {
      // number of ticks: 8-15
      return d3.timeFormat('%y %b');
    } else {
      return d3.timeFormat('%Y');
    }

    return null;
  }
};

export const getYTicks = (
  yLower: number,
  yUpper: number,
  interval: number | Duration,
  isTimeValue = false
): number[] => {
  // The input interval could be null,
  // generate tick values for time values even if interval is null
  const absExtent = Math.abs(yUpper - yLower);
  let tickValues: Array<number> = [];

  if (!isTimeValue) {
    // y values are numbers
    if (interval && typeof interval === 'number') {
      // !==null && !== 0
      tickValues = d3.range(yLower, yUpper, interval);
    }
  } else {
    // y values are time values
    if (interval && window.moment.isDuration(interval)) {
      const intervalInSeconds = Math.abs(interval.asSeconds());
      tickValues = d3.range(yLower, yUpper, intervalInSeconds);
    } else {
      // auto interval for time values
      if (absExtent > 5 * 60 * 60) {
        // extent over than 5 hours
        // tick on the hour
        yLower = Math.floor(yLower / 3600) * 3600;
        yUpper = Math.ceil(yUpper / 3600) * 3600;

        tickValues = d3.range(yLower, yUpper, 3600);
      } else {
        // tick on the half hour
        yLower = Math.floor(yLower / 1800) * 1800;
        yUpper = Math.ceil(yUpper / 1800) * 1800;

        tickValues = d3.range(yLower, yUpper, 1800);
      }
    }
  }

  if (tickValues.length === 0) return null;
  return tickValues;
};

export const getYTickLabelFormatter = (
  yLower: number,
  yUpper: number,
  inTickLabelFormat: string,
  isTimeValue = false
): ((value: number) => string) => {
  // return a function convert value to time string
  if (!isTimeValue) {
    if (inTickLabelFormat) {
      const tickFormat = (value: number): string => {
        const strValue = sprintf('%' + inTickLabelFormat, value);
        return strValue;
      };

      return tickFormat;
    }
    return d3.tickFormat(yLower, yUpper, 10);
  } else {
    // values in seconds
    if (inTickLabelFormat) {
      return (value: number): string => {
        const dayStart = window.moment('00:00', 'HH:mm', true);
        const tickTime = dayStart.add(value, 'seconds');
        const format = tickTime.format(inTickLabelFormat);

        const devHour = (value - yLower) / 3600;

        // TODO Why is this here?
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const interleave = devHour % 2;

        return format;
      };
    } else {
      return (value: number): string => {
        const absExtent = Math.abs(yUpper - yLower);
        const dayStart = window.moment('00:00', 'HH:mm', true);
        const tickTime = dayStart.add(value, 'seconds');
        let format = tickTime.format('HH:mm');
        // auto interleave if extent over 12 hours
        if (absExtent > 12 * 60 * 60) {
          const devHour = (value - yLower) / 3600;
          const interleave = devHour % 2;
          if (value < yLower || value > yUpper || interleave < 1) {
            format = '';
          }
        }

        return format;
      };
    }
  }
};

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

  const { tickValues, tickInterval } = getXTicks(dates, tickIntervalInDuration);
  if (tickValues && tickValues.length !== 0) axisGen.tickValues(tickValues);
  else if (tickInterval) axisGen.ticks(tickInterval);

  const formatter = getXTickLabelFormatter(dates, xAxisTickLabelFormat);
  if (formatter) axisGen.tickFormat(formatter);

  const xAxis = elements.dataArea // axis includes ticks
    .append('g')
    .attr('id', 'xAxis')
    .attr('transform', 'translate(0,' + height + ')') // relative to graphArea
    .call(axisGen)
    .attr('class', 'tracker-axis');
  if (xAxisColor) xAxis.style('stroke', xAxisColor);
  elements.xAxis = xAxis;

  const textSize = UiUtils.getTextDimensions('99-99-99');

  const xAxisTickLabels = xAxis
    .selectAll('text')
    .attr('x', -1 * textSize.height * Math.cos((65 / 180) * Math.PI))
    .attr('y', 0)
    .attr('transform', 'rotate(-65)')
    .style('text-anchor', 'end')
    .attr('class', 'tracker-tick-label');

  if (xAxisColor) xAxisTickLabels.style('fill', xAxisColor);

  const tickLength = 6;
  const tickLabelHeight = textSize.width * Math.sin((65 / 180) * Math.PI);

  const axisLabel = xAxis
    .append('text')
    .text(xAxisLabel)
    .attr(
      'transform',
      'translate(' + width / 2 + ',' + (tickLength + tickLabelHeight) + ')'
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
  position: 'left' | 'right',
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

  const extent = max - min;

  let lower = minAssigned ? min : min - extent * 0.2;
  let upper = maxAssigned ? max : max + extent * 0.2;

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

    const tickValues = getYTicks(lower, upper, tickInterval, valueIsTime);
    if (tickValues) axisGen.tickValues(tickValues);
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
      const tickLabelWidth = UiUtils.getTextDimensions(
        tickLabel.textContent,
        'tracker-axis-label'
      ).width;
      if (tickLabelWidth > maxTickLabelWidth)
        maxTickLabelWidth = tickLabelWidth;
    }
  }
  if (unitText !== '') labelText += ' (' + unitText + ')';

  const tickLength = 6;
  const labelHeight = UiUtils.getTextDimensions(labelText).height;
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

export interface CreateElementsOptions {
  clearContents?: boolean;
  elements?: ComponentElements;
}

export interface RenderTitleOptions {
  titleSpacing?: number;
  titleCssClass?: string;
}

export const renderBar = (
  chartElements: ComponentElements,
  renderInfo: RenderInfo,
  barInfo: BarChart,
  dataset: Dataset,
  yAxisLocation: string,
  currBarSet: number,
  totalNumOfBarSets: number
): void => {
  if (!renderInfo || !barInfo) return;

  const barGap = 1;
  const barSetWidth = renderInfo.dataAreaSize.width / dataset.values.length;
  let barWidth = barSetWidth;
  if (barSetWidth - barGap > 0) {
    barWidth = barSetWidth - barGap;
  }
  barWidth = barWidth / totalNumOfBarSets;

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const portionLeft = (currBarSet + 1) / totalNumOfBarSets;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let yScale: any = null;
  if (yAxisLocation === 'left') {
    yScale = chartElements.leftYScale;
  } else if (yAxisLocation === 'right') {
    yScale = chartElements.rightYScale;
  }

  const bars = chartElements.dataArea
    .selectAll('bar')
    .data(Array.from(dataset).filter((p: DataPoint) => p.value !== null))
    .enter()
    .append('rect')
    .attr('x', (p: DataPoint, i: number) => {
      if (i === 0) {
        const portionVisible = currBarSet + 1 - totalNumOfBarSets / 2;
        if (portionVisible < 1) {
          return (
            chartElements.xScale(p.date) -
            barSetWidth / 2 +
            currBarSet * barWidth +
            portionVisible * barWidth
          );
        }
      }
      return (
        chartElements.xScale(p.date) - barSetWidth / 2 + currBarSet * barWidth
      );
    })
    .attr('y', (p: DataPoint) => yScale(Math.max(p.value, 0)))
    .attr('width', (p: DataPoint, i: number) => {
      if (i === 0) {
        const portionVisible = currBarSet + 1 - totalNumOfBarSets / 2;
        if (portionVisible < 0) {
          return 0;
        } else if (portionVisible < 1) {
          return barWidth * portionVisible;
        }
        return barWidth;
      } else if (i === dataset.values.length - 1) {
        const portionVisible = 1 - (currBarSet + 1 - totalNumOfBarSets / 2);
        if (portionVisible < 0) {
          return 0;
        } else if (portionVisible < 1) {
          return barWidth * portionVisible;
        }
        return barWidth;
      }
      return barWidth;
    })
    .attr('height', (p: DataPoint) => {
      if (p.value !== null) {
        return Math.abs(yScale(p.value) - yScale(0));
      }
    })
    .attr('class', 'tracker-bar');

  if (barInfo.barColor[dataset.id]) {
    bars.style('fill', barInfo.barColor[dataset.id]);
  }
};

export const renderLegend = (
  chartElements: ComponentElements,
  renderInfo: RenderInfo,
  chartInfo: CartesianChart
): void => {
  // Get chart elements
  const svg = chartElements.svg;
  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const graphArea = chartElements.graphArea;
  const dataArea = chartElements.dataArea;
  const title = chartElements.title;
  const xAxis = chartElements.xAxis;
  const leftYAxis = chartElements.leftYAxis;
  const rightYAxis = chartElements.rightYAxis;

  // Get element width and height
  let titleHeight = 0;
  if (title) {
    titleHeight = parseFloat(title.attr('height'));
  }
  const xAxisHeight = parseFloat(xAxis.attr('height'));
  let leftYAxisWidth = 0;
  if (leftYAxis) {
    leftYAxisWidth = parseFloat(leftYAxis.attr('width'));
  }
  let rightYAxisWidth = 0;
  if (rightYAxis) {
    rightYAxisWidth = parseFloat(rightYAxis.attr('width'));
  }
  // Get datasets
  const datasets = renderInfo.datasets;
  const xDatasetIds = datasets.getXDatasetIds();

  // Get names and their dimension
  const names = datasets.names; // xDataset name included
  const nameSizes = names.map((n) => {
    return UiUtils.getTextDimensions(n, 'tracker-legend-label');
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
  if (chartInfo.legendOrientation === 'vertical') {
    legendWidth = xSpacing * 3 + markerWidth + maxNameWidth;
    legendHeight = (numNames + 1) * ySpacing;
  } else if (chartInfo.legendOrientation === 'horizontal') {
    legendWidth =
      (2 * xSpacing + markerWidth) * numNames +
      xSpacing +
      d3.sum(nameSizes, (s, i) => (xDatasetIds.includes(i) ? 0 : s.width));
    legendHeight = ySpacing + nameHeight;
  }

  // Calculate legendX and legendY
  let legendX = 0; // relative to graphArea
  let legendY = 0;
  if (chartInfo.legendPosition === 'top') {
    // below title
    legendX =
      leftYAxisWidth + renderInfo.dataAreaSize.width / 2 - legendWidth / 2;
    legendY = titleHeight;
    // Expand svg
    DomUtils.expandArea(svg, 0, legendHeight + ySpacing);
    // Move dataArea down
    DomUtils.moveArea(dataArea, 0, legendHeight + ySpacing);
  } else if (chartInfo.legendPosition === 'bottom') {
    // bellow x-axis label
    legendX =
      leftYAxisWidth + renderInfo.dataAreaSize.width / 2 - legendWidth / 2;
    legendY =
      titleHeight + renderInfo.dataAreaSize.height + xAxisHeight + ySpacing;
    // Expand svg
    DomUtils.expandArea(svg, 0, legendHeight + ySpacing);
  } else if (chartInfo.legendPosition === 'left') {
    legendX = 0;
    legendY =
      titleHeight + renderInfo.dataAreaSize.height / 2 - legendHeight / 2;
    // Expand svg
    DomUtils.expandArea(svg, legendWidth + xSpacing, 0);
    // Move dataArea right
    DomUtils.moveArea(dataArea, legendWidth + xSpacing, 0);
  } else if (chartInfo.legendPosition === 'right') {
    legendX =
      renderInfo.dataAreaSize.width +
      leftYAxisWidth +
      rightYAxisWidth +
      xSpacing;
    legendY =
      titleHeight + renderInfo.dataAreaSize.height / 2 - legendHeight / 2;
    // Expand svg
    DomUtils.expandArea(svg, legendWidth + xSpacing, 0);
  } else {
    return;
  }

  const legend = chartElements.graphArea
    .append('g')
    .attr('id', 'legend')
    .attr('transform', 'translate(' + legendX + ',' + legendY + ')');

  const legendBg = legend
    .append('rect')
    .attr('class', 'tracker-legend')
    .attr('width', legendWidth)
    .attr('height', legendHeight);
  if (chartInfo.legendBgColor) {
    legendBg.style('fill', chartInfo.legendBgColor);
  }
  if (chartInfo.legendBorderColor) {
    legendBg.style('stroke', chartInfo.legendBorderColor);
  }

  const firstMarkerX = xSpacing;
  const firstMarkerY = nameHeight;
  const firstLabelX = firstMarkerX + xSpacing + markerWidth; // xSpacing + 2 * xSpacing
  const firstLabelY = firstMarkerY;

  if (chartInfo.legendOrientation === 'vertical') {
    if (chartInfo.componentType === ComponentType.LineChart) {
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
          return (chartInfo as LineChart).lineColor[i];
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
          if ((chartInfo as LineChart).showPoint[i]) {
            return (chartInfo as LineChart).pointSize[i];
          }
          return 0;
        })
        .style('fill', (name: string, i: number) => {
          if (xDatasetIds.includes(i)) return;
          return (chartInfo as LineChart).pointColor[i];
        });
    } else if (chartInfo.componentType === ComponentType.BarChart) {
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
          return (chartInfo as BarChart).barColor[i];
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

    if (chartInfo.componentType === ComponentType.LineChart) {
      nameLabels.style('fill', (name: string, i: number) => {
        if (xDatasetIds.includes(i)) return;
        return (chartInfo as LineChart).lineColor[i];
      });
    } else if (chartInfo.componentType === ComponentType.BarChart) {
      nameLabels.style('fill', (name: string, i: number) => {
        if (xDatasetIds.includes(i)) return;
        return (chartInfo as BarChart).barColor[i];
      });
    }
  } else if (chartInfo.legendOrientation === 'horizontal') {
    if (chartInfo.componentType === ComponentType.LineChart) {
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
            if (ind < i) {
              posX += markerWidth + xSpacing + size.width + xSpacing;
            } else {
              break;
            }
          }
          return posX;
        })
        .attr('x2', (name: string, i: number) => {
          let posX = xSpacing + markerWidth;
          for (const [ind, size] of nameSizes.entries()) {
            if (xDatasetIds.includes(ind)) continue;
            if (ind < i) {
              posX += xSpacing + size.width + xSpacing + markerWidth;
            } else {
              break;
            }
          }
          return posX;
        })
        .attr('y1', firstMarkerY)
        .attr('y2', firstMarkerY)
        .style('stroke', (name: string, i: number) => {
          if (xDatasetIds.includes(i)) return;
          return (chartInfo as LineChart).lineColor[i];
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
          if ((chartInfo as LineChart).showPoint[i]) {
            return (chartInfo as LineChart).pointSize[i];
          }
          return 0;
        })
        .style('fill', (name: string, i: number) => {
          if (xDatasetIds.includes(i)) return;
          return (chartInfo as LineChart).pointColor[i];
        });
    } else if (chartInfo.componentType === ComponentType.BarChart) {
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
          return (chartInfo as BarChart).barColor[i];
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

    if (chartInfo.componentType === ComponentType.LineChart) {
      nameLabels.style('fill', (name: string, i: number) => {
        if (xDatasetIds.includes(i)) return;
        return (chartInfo as LineChart).lineColor[i];
      });
    } else if (chartInfo.componentType === ComponentType.BarChart) {
      nameLabels.style('fill', (name: string, i: number) => {
        if (xDatasetIds.includes(i)) return;
        return (chartInfo as BarChart).barColor[i];
      });
    }
  }
};

export const renderTitle = (
  chartElements: ComponentElements,
  renderInfo: RenderInfo,
  chartInfo: CartesianChart
): void => {
  // under graphArea
  if (!renderInfo || !chartInfo) return;

  if (!chartInfo.title) return;
  const titleSize = UiUtils.getTextDimensions(chartInfo.title, 'tracker-title');

  // Append title
  const title = chartElements.graphArea
    .append('text')
    .text(chartInfo.title) // pivot at center
    .attr('id', 'title')
    .attr(
      'transform',
      'translate(' +
        renderInfo.dataAreaSize.width / 2 +
        ',' +
        titleSize.height / 2 +
        ')'
    )
    .attr('height', titleSize.height) // for later use
    .attr('class', 'tracker-title');
  chartElements['title'] = title;

  // Expand parent areas
  DomUtils.expandArea(chartElements.svg, 0, titleSize.height);
  DomUtils.expandArea(chartElements.graphArea, 0, titleSize.height);

  // Move sibling areas
  DomUtils.moveArea(chartElements.dataArea, 0, titleSize.height);

  return;
};

export const setChartScale = (
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

export const createAreas = (
  canvas: HTMLElement,
  renderInfo: RenderInfo
): ComponentElements => {
  const chartElements: ComponentElements = {};
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
