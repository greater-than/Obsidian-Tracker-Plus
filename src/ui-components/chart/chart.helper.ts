import * as d3 from 'd3';
import { Duration, Moment } from 'moment';
import { sprintf } from 'sprintf-js';
import { Orientation } from 'src/enums';
import { ComponentType, ValueType } from '../../models/enums';
import { RenderInfo } from '../../models/render-info';
import { ChartElements } from '../../models/types';
import { DateTimeUtils, DomUtils, UiUtils } from '../../utils';
import { BarChart } from './bar-chart.model';
import { CartesianChart } from './cartesian-chart.model';
import { LineChart } from './line-chart.model';

export const getXTickValues = (
  dates: Moment[],
  interval: Duration
): [Array<Date>, d3.TimeInterval] => {
  // The input interval could be null,
  // generate tick values even if interval is null
  const tickValues: Array<Date> = [];
  let tickInterval = null;

  // y values are date/time values
  if (interval) {
    const firstDate = dates[0].toDate();
    const lastDate = dates[dates.length - 1].toDate();
    tickValues.push(
      ...d3.timeDay.range(firstDate, lastDate, interval.asDays())
    );
  } else {
    const days = dates.length;
    tickInterval =
      days <= 15
        ? d3.timeDay
        : days <= 4 * 15
        ? d3.timeDay.every(4)
        : days <= 7 * 15
        ? d3.timeWeek
        : days <= 15 * 30
        ? d3.timeMonth
        : days <= 15 * 60
        ? d3.timeMonth.every(2)
        : d3.timeYear;
  }

  return [tickValues, tickInterval];
};

export const getXTickLabelFormat = (
  dates: Moment[],
  tickLabelFormat: string
): ((date: Date) => string) => {
  if (tickLabelFormat)
    return (date: Date): string =>
      DateTimeUtils.dateToString(window.moment(date), tickLabelFormat);

  const { length: days } = dates;
  return days <= 15
    ? d3.timeFormat('%y-%m-%d')
    : days <= 4 * 15
    ? d3.timeFormat('%y-%m-%d')
    : days <= 7 * 15
    ? d3.timeFormat('%y-%m-%d')
    : days <= 15 * 30
    ? d3.timeFormat('%y %b')
    : days <= 15 * 60
    ? d3.timeFormat('%y %b')
    : d3.timeFormat('%Y');
};

export const getYTickValues = (
  yLower: number,
  yUpper: number,
  interval: number | Duration,
  isTimeValue = false
): number[] => {
  // The input interval could be null,
  // generate tick values for time values even if interval is null
  const tickValues: Array<number> = [];

  if (!isTimeValue && interval && typeof interval === 'number')
    // y values are numbers
    tickValues.push(...d3.range(yLower, yUpper, interval));
  else if (interval && window.moment.isDuration(interval))
    // y values are date/time values
    tickValues.push(
      ...d3.range(yLower, yUpper, Math.abs(interval.asSeconds()))
    );
  else if (Math.abs(yUpper - yLower) > 5 * 3600)
    // extends over than 5 hours
    // tick on the hour
    tickValues.push(
      ...d3.range(
        Math.floor(yLower / 3600) * 3600,
        Math.ceil(yUpper / 3600) * 3600,
        3600
      )
    );
  // tick on the half hour
  else
    tickValues.push(
      ...d3.range(
        Math.floor(yLower / 1800) * 1800,
        Math.ceil(yUpper / 1800) * 1800,
        1800
      )
    );

  return tickValues.length === 0 ? null : tickValues;
};

export const getYTickLabelFormat = (
  yLower: number,
  yUpper: number,
  tickLabelFormat: string,
  isTimeValue = false
): ((value: number) => string) => {
  // return a function convert value to time string
  if (!isTimeValue) {
    return tickLabelFormat
      ? (value: number): string => sprintf('%' + tickLabelFormat, value)
      : d3.tickFormat(yLower, yUpper, 10);
  } else {
    // values in seconds
    if (tickLabelFormat) {
      return (value: number): string => {
        const dayStart = window.moment('00:00', 'HH:mm', true);
        const tickTime = dayStart.add(value, 'seconds');
        return tickTime.format(tickLabelFormat);
      };
    } else {
      return (value: number): string => {
        const dayStart = window.moment('00:00', 'HH:mm', true);
        const tickTime = dayStart.add(value, 'seconds');
        let format = tickTime.format('HH:mm');
        // auto interleave if extends over 12 hours
        if (Math.abs(yUpper - yLower) > 12 * 3600) {
          const devHour = (value - yLower) / 3600;
          const interleave = devHour % 2;
          if (value < yLower || value > yUpper || interleave < 1) format = '';
        }
        return format;
      };
    }
  }
};

export const renderXAxis = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: CartesianChart
): void => {
  if (!renderInfo || !component) return;

  const { datasets, dataAreaSize } = renderInfo;
  const {
    xAxisColor,
    xAxisLabelColor,
    xAxisTickInterval,
    xAxisTickLabelFormat,
  } = component;

  const xDomain = d3.extent(datasets.dates);
  const xScale = d3.scaleTime().domain(xDomain).range([0, dataAreaSize.width]);
  elements.xScale = xScale;

  const tickIntervalInDuration = DateTimeUtils.parseDuration(xAxisTickInterval);

  const [tickValues, tickInterval] = getXTickValues(
    datasets.dates,
    tickIntervalInDuration
  );
  const tickFormat = getXTickLabelFormat(datasets.dates, xAxisTickLabelFormat);

  const xAxisGen = d3.axisBottom(xScale);

  if (tickValues && tickValues.length !== 0) xAxisGen.tickValues(tickValues);
  else if (tickInterval) xAxisGen.ticks(tickInterval);

  if (tickFormat) xAxisGen.tickFormat(tickFormat);

  const xAxis = elements.dataArea // axis includes ticks
    .append('g')
    .attr('id', 'xAxis')
    .attr('transform', `translate(0, ${dataAreaSize.height})`) // relative to graphArea
    .call(xAxisGen)
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
  const xAxisLabel = xAxis
    .append('text')
    .text(component.xAxisLabel)
    .attr(
      'transform',
      `translate(${dataAreaSize.width / 2}, ${tickLength + tickLabelHeight})`
    )
    .attr('class', 'tracker-axis-label');
  if (xAxisLabelColor) xAxisLabel.style('fill', xAxisLabelColor);

  // xAxis height
  xAxis.attr('height', tickLength + tickLabelHeight);

  // Expand areas
  DomUtils.expandArea(elements.svg, 0, tickLength + tickLabelHeight);
  DomUtils.expandArea(elements.graphArea, 0, tickLength + tickLabelHeight);
};

export const renderYAxis = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: CartesianChart,
  yAxisLocation: string,
  datasetIds: Array<number>
): string => {
  if (!renderInfo || !component) return;

  const { datasets, dataAreaSize } = renderInfo;

  if (datasetIds.length === 0) return;

  if (yAxisLocation !== 'left' && yAxisLocation !== 'right') return;

  let yMinOfDatasets = null;
  let yMaxOfDatasets = null;
  let valueIsTime = false;
  for (const datasetId of datasetIds) {
    const dataset = datasets.getDataset(datasetId);
    if (dataset.query.usedAsXDataset) continue;

    if (yMinOfDatasets === null || dataset.yMin < yMinOfDatasets)
      yMinOfDatasets = dataset.yMin;

    if (yMaxOfDatasets === null || dataset.yMax > yMaxOfDatasets)
      yMaxOfDatasets = dataset.yMax;

    // TODO tmpValueIsTime is always null, and is not used below
    // let tmpValueIsTime = null;
    // Need all datasets have same settings for time value
    valueIsTime = dataset.valueType === ValueType.Time;
    // if (tmpValueIsTime === null) tmpValueIsTime = valueIsTime;
    // else if (valueIsTime !== tmpValueIsTime)
    //   return 'Not all values in time format';
  }

  let yMin = null;
  if (yAxisLocation === 'left') yMin = component.yMin[0];
  else if (yAxisLocation === 'right') yMin = component.yMin[1];

  let yMinAssigned = false;
  if (typeof yMin !== 'number') yMin = yMinOfDatasets;
  else yMinAssigned = true;

  let yMax = null;
  if (yAxisLocation === 'left') yMax = component.yMax[0];
  else if (yAxisLocation === 'right') yMax = component.yMax[1];

  let yMaxAssigned = false;
  if (typeof yMax !== 'number') yMax = yMaxOfDatasets;
  else yMaxAssigned = true;

  if (yMax < yMin) {
    const yTmp = yMin;
    yMin = yMax;
    yMax = yTmp;
    const yTmpAssigned = yMinAssigned;
    yMinAssigned = yMaxAssigned;
    yMaxAssigned = yTmpAssigned;
  }

  const yExtent = yMax - yMin;

  const yScale = d3.scaleLinear();
  let yLower, yUpper;
  yLower = yMinAssigned ? yMin : yMin - yExtent * 0.2;
  yUpper = yMaxAssigned ? yMax : (yUpper = yMax + yExtent * 0.2);

  // if it is bar chart, zero must be contained in the range
  if (component.componentType === ComponentType.BarChart) {
    if (yUpper < 0) yUpper = 0;
    if (yLower > 0) yLower = 0;
  }
  let domain = [yLower, yUpper];
  if (
    (yAxisLocation === 'left' && component.reverseYAxis[0]) ||
    (yAxisLocation === 'right' && component.reverseYAxis[1])
  ) {
    domain = [yUpper, yLower];
  }
  yScale.domain(domain).range([dataAreaSize.height, 0]);

  if (yAxisLocation === 'left') elements.leftYScale = yScale;
  else if (yAxisLocation === 'right') elements.rightYScale = yScale;

  let yAxisColor = '';
  if (yAxisLocation === 'left') yAxisColor = component.yAxisColor[0];
  else if (yAxisLocation === 'right') yAxisColor = component.yAxisColor[1];

  let yAxisLabelColor = '';
  if (yAxisLocation === 'left') yAxisLabelColor = component.yAxisLabelColor[0];
  else if (yAxisLocation === 'right')
    yAxisLabelColor = component.yAxisLabelColor[1];

  let yAxisLabelText = '';
  if (yAxisLocation === 'left') yAxisLabelText = component.yAxisLabel[0];
  else if (yAxisLocation === 'right') yAxisLabelText = component.yAxisLabel[1];

  let yAxisUnitText = '';
  let yAxisTickInterval = null;
  let yAxisTickLabelFormat = null;
  if (yAxisLocation === 'left') {
    yAxisUnitText = component.yAxisUnit[0];
    yAxisTickInterval = component.yAxisTickInterval[0]; // string
    yAxisTickLabelFormat = component.yAxisTickLabelFormat[0];
  } else if (yAxisLocation === 'right') {
    yAxisUnitText = component.yAxisUnit[1];
    yAxisTickInterval = component.yAxisTickInterval[1]; // string
    yAxisTickLabelFormat = component.yAxisTickLabelFormat[1];
  }
  // get interval from string
  let tickInterval = null;
  if (valueIsTime) {
    tickInterval = DateTimeUtils.parseDuration(yAxisTickInterval);
  } else {
    tickInterval = parseFloat(yAxisTickInterval);
    if (!Number.isNumber(tickInterval) || Number.isNaN(tickInterval)) {
      tickInterval = null;
    }
  }

  let yAxisGen;
  if (yAxisLocation === 'left') yAxisGen = d3.axisLeft(yScale);
  else if (yAxisLocation === 'right') yAxisGen = d3.axisRight(yScale);

  if (yAxisGen) {
    const tickLabelFormat = getYTickLabelFormat(
      yLower,
      yUpper,
      yAxisTickLabelFormat,
      valueIsTime
    );
    if (tickLabelFormat) yAxisGen.tickFormat(tickLabelFormat);

    const tickValues = getYTickValues(
      yLower,
      yUpper,
      tickInterval,
      valueIsTime
    );
    if (tickValues) yAxisGen.tickValues(tickValues);
  }

  const yAxis = elements.dataArea
    .append('g')
    .attr('id', 'yAxis')
    .call(yAxisGen)
    .attr('class', 'tracker-axis');
  if (yAxisLocation == 'right') {
    yAxis.attr('transform', `translate(${dataAreaSize.width}, 0)`);
  }
  if (yAxisLocation === 'left') elements.leftYAxis = yAxis;
  else if (yAxisLocation === 'right') elements.rightYAxis = yAxis;

  const yAxisLine = yAxis.selectAll('path');
  if (yAxisColor) yAxisLine.style('stroke', yAxisColor);

  const yAxisTicks = yAxis.selectAll('line');
  if (yAxisColor) yAxisTicks.style('stroke', yAxisColor);

  const yAxisTickLabels = yAxis
    .selectAll('text')
    .attr('class', 'tracker-tick-label');
  if (yAxisColor) yAxisTickLabels.style('fill', yAxisColor);

  // Get max tick label width
  let maxTickLabelWidth = 0;
  for (const label of yAxisTickLabels) {
    if (label.textContent) {
      const labelSize = UiUtils.getTextDimensions(
        label.textContent,
        'tracker-axis-label'
      );
      if (labelSize.width > maxTickLabelWidth) {
        maxTickLabelWidth = labelSize.width;
      }
    }
  }

  if (yAxisUnitText !== '') yAxisLabelText += ` (${yAxisUnitText})`;

  const yTickLength = 6;
  const yAxisLabelSize = UiUtils.getTextDimensions(yAxisLabelText);
  const yAxisLabel = yAxis
    .append('text')
    .text(yAxisLabelText)
    .attr('transform', 'rotate(-90)')
    .attr('x', (-1 * dataAreaSize.height) / 2)
    .attr('class', 'tracker-axis-label');
  if (yAxisLocation === 'left') {
    yAxisLabel.attr(
      'y',
      -yTickLength - maxTickLabelWidth - yAxisLabelSize.height / 2
    );
  } else {
    yAxisLabel.attr(
      'y',
      +yTickLength + maxTickLabelWidth + yAxisLabelSize.height
    );
  }
  if (yAxisLabelColor) yAxisLabel.style('fill', yAxisLabelColor);

  const yAxisWidth = yAxisLabelSize.height + maxTickLabelWidth + yTickLength;
  yAxis.attr('width', yAxisWidth);

  // Expand areas
  DomUtils.expandArea(elements.svg, yAxisWidth, 0);
  DomUtils.expandArea(elements.graphArea, yAxisWidth, 0);

  // Move areas
  if (yAxisLocation === 'left') {
    // Move dataArea
    DomUtils.moveArea(elements.dataArea, yAxisWidth, 0);

    // Move title
    if (elements.title) DomUtils.moveArea(elements.title, yAxisWidth, 0);
  }
};

export interface CreateElementsOptions {
  clearContents?: boolean;
  elements?: ChartElements;
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

  const elements: ChartElements = options?.elements || {};
  const { dataAreaSize, margin } = renderInfo;
  const { height, width } = dataAreaSize;

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
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);
  elements.svg = svg;

  // graphArea: contains chartArea, title, legend
  const graphArea = svg
    .append('g')
    .attr('id', 'graphArea')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .attr('width', width + margin.right)
    .attr('height', height + margin.bottom);
  elements.graphArea = graphArea;

  // dataArea: contained by graphArea, contains points, lines, xAxis, yAxis
  elements.dataArea = graphArea
    .append('g')
    .attr('id', 'dataArea')
    .attr('width', width)
    .attr('height', height);

  return elements;
};

export const renderLegend = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: CartesianChart
): void => {
  // Chart elements
  const { svg, dataArea, title, xAxis, leftYAxis, rightYAxis } = elements;
  const { legendOrientation, legendPosition, componentType } = component;
  const { dataAreaSize, datasets } = renderInfo;

  // Dimensions
  const titleHeight = title ? parseFloat(title.attr('height')) : 0;
  const xAxisHeight = parseFloat(xAxis.attr('height'));
  const leftYAxisWidth = leftYAxis ? parseFloat(leftYAxis.attr('width')) : 0;
  const rightYAxisWidth = rightYAxis ? parseFloat(rightYAxis.attr('width')) : 0;

  // Datasets
  const xDatasetIds = datasets.getXDatasetIds();

  // Dataset Names & Dimensions
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
  if (legendPosition === 'top') {
    // below title
    legendX = leftYAxisWidth + dataAreaSize.width / 2 - legendWidth / 2;
    legendY = titleHeight;
    DomUtils.expandArea(svg, 0, legendHeight + ySpacing);
    DomUtils.moveArea(dataArea, 0, legendHeight + ySpacing);
  } else if (legendPosition === 'bottom') {
    legendX = leftYAxisWidth + dataAreaSize.width / 2 - legendWidth / 2;
    legendY = titleHeight + dataAreaSize.height + xAxisHeight + ySpacing;
    DomUtils.expandArea(svg, 0, legendHeight + ySpacing);
  } else if (legendPosition === 'left') {
    legendX = 0;
    legendY = titleHeight + dataAreaSize.height / 2 - legendHeight / 2;
    DomUtils.expandArea(svg, legendWidth + xSpacing, 0);
    DomUtils.moveArea(dataArea, legendWidth + xSpacing, 0);
  } else if (legendPosition === 'right') {
    legendX = dataAreaSize.width + leftYAxisWidth + rightYAxisWidth + xSpacing;
    legendY = titleHeight + dataAreaSize.height / 2 - legendHeight / 2;
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
    .attr('height', legendHeight); // TODO This is not calculating the correct value
  if (component.legendBgColor) legendBg.style('fill', component.legendBgColor);
  if (component.legendBorderColor)
    legendBg.style('stroke', component.legendBorderColor);

  const firstMarkerX = xSpacing;
  const firstMarkerY = nameHeight;
  const firstLabelX = firstMarkerX + xSpacing + markerWidth;
  const firstLabelY = firstMarkerY;

  if (component.legendOrientation === Orientation.VERTICAL) {
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
    } else if (componentType === ComponentType.BarChart) {
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
        const numElemsExcluded = xDatasetIds.filter((id) => id < i).length;
        i = i - numElemsExcluded;
        return firstLabelY + i * ySpacing;
      })
      .text((name: string, i: number) =>
        !xDatasetIds.includes(i) ? name : 'name'
      )
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
  } else if (component.legendOrientation === Orientation.HORIZONTAL) {
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
            if (ind < i)
              posX +=
                markerWidth / 2 +
                xSpacing +
                size.width +
                xSpacing +
                markerWidth / 2;
            else break;
          }
          return posX;
        })
        .attr('cy', firstMarkerY)
        .attr('r', (name: string, i: number) => {
          if (xDatasetIds.includes(i)) return;
          return (component as LineChart).showPoint[i]
            ? (component as LineChart).pointSize[i]
            : 0;
        })
        .style('fill', (name: string, i: number) => {
          if (xDatasetIds.includes(i)) return;
          return (component as LineChart).pointColor[i];
        });
    } else if (componentType === ComponentType.BarChart) {
      // bars
      legend
        .selectAll('markers')
        .data(names.filter((n, i) => !xDatasetIds.includes(i)))
        .enter()
        .append('rect')
        .attr('x', (name: string, i: number) => {
          let posX = xSpacing;
          for (const [ind, size] of nameSizes.entries()) {
            if (xDatasetIds.includes(ind)) continue;
            if (ind < i) posX += markerWidth + xSpacing + size.width + xSpacing;
            else break;
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
          if (ind < i) posX += size.width + xSpacing + markerWidth + xSpacing;
          else break;
        }
        return posX;
      })
      .attr('y', firstLabelY)
      .text((name: string, i: number) => {
        return !xDatasetIds.includes(i) ? name : '';
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
  component: CartesianChart,
  options: RenderTitleOptions = { titleSpacing: 0 }
): void => {
  if (!renderInfo || !component || !component.title) return;

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
      `translate(${renderInfo.dataAreaSize.width / 2}, ${
        dimensions.height / 2
      })`
    )
    .attr('height', dimensions.height) // for later use
    .attr('class', cssClass);

  // Expand parent areas
  DomUtils.expandArea(elements.svg, 0, dimensions.height + spacing);
  DomUtils.expandArea(elements.graphArea, 0, dimensions.height + spacing);

  // Move sibling areas
  DomUtils.moveArea(elements.dataArea, 0, dimensions.height + spacing);
};
