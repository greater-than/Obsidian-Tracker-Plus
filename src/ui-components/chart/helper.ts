import * as d3 from 'd3';
import { Duration, Moment } from 'moment';
import { sprintf } from 'sprintf-js';
import { BarChart } from '../../models/bar-chart';
import { BaseChart } from '../../models/base-chart';
import { DataPoint } from '../../models/data-point';
import { Dataset } from '../../models/dataset';
import { ComponentType, ValueType } from '../../models/enums';
import { LineChart } from '../../models/line-chart';
import { RenderInfo } from '../../models/render-info';
import { ChartElements } from '../../models/types';
import { ChartUtils, DateTimeUtils, DomUtils } from '../../utils';
import { TMoment, getMoment } from '../../utils/date-time.utils';

export const getXTickValues = (
  dates: Moment[],
  interval: Duration
): [Array<Date>, d3.TimeInterval] => {
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

  return [tickValues, tickInterval];
};

export const getXTickLabelFormat = (
  dates: Moment[],
  inTickLabelFormat: string,
  moment?: TMoment
): ((date: Date) => string) => {
  if (inTickLabelFormat)
    return (date: Date): string =>
      DateTimeUtils.dateToString(getMoment(moment)(date), inTickLabelFormat);

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
  isTimeValue = false,
  moment?: TMoment
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
    if (interval && getMoment(moment).isDuration(interval)) {
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

  return tickValues.length === 0 ? null : tickValues;
};

export const getYTickLabelFormat = (
  yLower: number,
  yUpper: number,
  inTickLabelFormat: string,
  isTimeValue = false,
  moment?: TMoment
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
        const dayStart = getMoment(moment)('00:00', 'HH:mm', true);
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
        const dayStart = moment('00:00', 'HH:mm', true);
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

export const renderXAxis = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: BaseChart
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
  elements['xScale'] = xScale;

  const tickIntervalInDuration = DateTimeUtils.parseDuration(xAxisTickInterval);

  const [tickValues, tickInterval] = getXTickValues(
    datasets.dates,
    tickIntervalInDuration
  );
  const tickFormat = getXTickLabelFormat(datasets.dates, xAxisTickLabelFormat);

  const xAxisGen = d3.axisBottom(xScale);

  if (tickValues && tickValues.length !== 0) {
    xAxisGen.tickValues(tickValues);
  } else if (tickInterval) {
    xAxisGen.ticks(tickInterval);
  }
  if (tickFormat) {
    xAxisGen.tickFormat(tickFormat);
  }

  const xAxis = elements.dataArea // axis includes ticks
    .append('g')
    .attr('id', 'xAxis')
    .attr('transform', `translate(0, ${dataAreaSize.height})`) // relative to graphArea
    .call(xAxisGen)
    .attr('class', 'tracker-axis');
  if (xAxisColor) xAxis.style('stroke', xAxisColor);

  elements['xAxis'] = xAxis;

  const textSize = ChartUtils.measureTextSize('99-99-99');

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
  component: BaseChart,
  yAxisLocation: string,
  datasetIds: Array<number>
): string => {
  if (!renderInfo || !component) return;

  const { datasets, dataAreaSize } = renderInfo;

  if (datasetIds.length === 0) return;

  if (yAxisLocation !== 'left' && yAxisLocation !== 'right') return;

  let yMinOfDatasets = null;
  let yMaxOfDatasets = null;
  let tmpValueIsTime = null;
  let valueIsTime = false;
  for (const datasetId of datasetIds) {
    const dataset = datasets.getDataset(datasetId);
    if (dataset.query.usedAsXDataset) continue;

    if (yMinOfDatasets === null || dataset.yMin < yMinOfDatasets) {
      yMinOfDatasets = dataset.yMin;
    }
    if (yMaxOfDatasets === null || dataset.yMax > yMaxOfDatasets) {
      yMaxOfDatasets = dataset.yMax;
    }

    // Need all datasets have same settings for time value
    valueIsTime = dataset.valueType === ValueType.Time;
    if (tmpValueIsTime === null) {
      tmpValueIsTime = valueIsTime;
    } else {
      if (valueIsTime !== tmpValueIsTime) {
        return 'Not all values in time format';
      }
    }
  }

  let yMin = null;
  if (yAxisLocation === 'left') {
    yMin = component.yMin[0];
  } else if (yAxisLocation === 'right') {
    yMin = component.yMin[1];
  }
  let yMinAssigned = false;
  if (typeof yMin !== 'number') {
    yMin = yMinOfDatasets;
  } else {
    yMinAssigned = true;
  }

  let yMax = null;
  if (yAxisLocation === 'left') {
    yMax = component.yMax[0];
  } else if (yAxisLocation === 'right') {
    yMax = component.yMax[1];
  }
  let yMaxAssigned = false;
  if (typeof yMax !== 'number') {
    yMax = yMaxOfDatasets;
  } else {
    yMaxAssigned = true;
  }
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
  if (yMinAssigned) {
    yLower = yMin;
  } else {
    yLower = yMin - yExtent * 0.2;
  }
  if (yMaxAssigned) {
    yUpper = yMax;
  } else {
    yUpper = yMax + yExtent * 0.2;
  }
  // if it is bar chart, zero must be contained in the range
  if (component.componentType === ComponentType.BarChart) {
    if (yUpper < 0) {
      yUpper = 0;
    }
    if (yLower > 0) {
      yLower = 0;
    }
  }
  let domain = [yLower, yUpper];
  if (
    (yAxisLocation === 'left' && component.reverseYAxis[0]) ||
    (yAxisLocation === 'right' && component.reverseYAxis[1])
  ) {
    domain = [yUpper, yLower];
  }
  yScale.domain(domain).range([dataAreaSize.height, 0]);

  if (yAxisLocation === 'left') {
    elements['leftYScale'] = yScale;
  } else if (yAxisLocation === 'right') {
    elements['rightYScale'] = yScale;
  }

  let yAxisColor = '';
  if (yAxisLocation === 'left') {
    yAxisColor = component.yAxisColor[0];
  } else if (yAxisLocation === 'right') {
    yAxisColor = component.yAxisColor[1];
  }

  let yAxisLabelColor = '';
  if (yAxisLocation === 'left') {
    yAxisLabelColor = component.yAxisLabelColor[0];
  } else if (yAxisLocation === 'right') {
    yAxisLabelColor = component.yAxisLabelColor[1];
  }

  let yAxisLabelText = '';
  if (yAxisLocation === 'left') {
    yAxisLabelText = component.yAxisLabel[0];
  } else if (yAxisLocation === 'right') {
    yAxisLabelText = component.yAxisLabel[1];
  }

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
  if (yAxisLocation === 'left') {
    yAxisGen = d3.axisLeft(yScale);
  } else if (yAxisLocation === 'right') {
    yAxisGen = d3.axisRight(yScale);
  }
  if (yAxisGen) {
    const tickLabelFormat = getYTickLabelFormat(
      yLower,
      yUpper,
      yAxisTickLabelFormat,
      valueIsTime
    );
    if (tickLabelFormat) {
      yAxisGen.tickFormat(tickLabelFormat);
    }
    const tickValues = getYTickValues(
      yLower,
      yUpper,
      tickInterval,
      valueIsTime
    );
    if (tickValues) {
      yAxisGen.tickValues(tickValues);
    }
  }

  const yAxis = elements.dataArea
    .append('g')
    .attr('id', 'yAxis')
    .call(yAxisGen)
    .attr('class', 'tracker-axis');
  if (yAxisLocation == 'right') {
    yAxis.attr('transform', `translate(${dataAreaSize.width}, 0)`);
  }
  if (yAxisLocation === 'left') elements['leftYAxis'] = yAxis;
  else if (yAxisLocation === 'right') elements['rightYAxis'] = yAxis;

  const yAxisLine = yAxis.selectAll('path');
  if (yAxisColor) yAxisLine.style('stroke', yAxisColor);

  const yAxisTicks = yAxis.selectAll('line');
  if (yAxisColor) yAxisTicks.style('stroke', yAxisColor);

  const yAxisTickLabels = yAxis
    .selectAll('text')
    .attr('class', 'tracker-tick-label');
  if (yAxisColor) {
    yAxisTickLabels.style('fill', yAxisColor);
  }

  // Get max tick label width
  let maxTickLabelWidth = 0;
  for (const label of yAxisTickLabels) {
    if (label.textContent) {
      const labelSize = ChartUtils.measureTextSize(
        label.textContent,
        'tracker-axis-label'
      );
      if (labelSize.width > maxTickLabelWidth) {
        maxTickLabelWidth = labelSize.width;
      }
    }
  }

  if (yAxisUnitText !== '') {
    yAxisLabelText += ' (' + yAxisUnitText + ')';
  }
  const yTickLength = 6;
  const yAxisLabelSize = ChartUtils.measureTextSize(yAxisLabelText);
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
  if (yAxisLabelColor) {
    yAxisLabel.style('fill', yAxisLabelColor);
  }

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
    if (elements.title) {
      DomUtils.moveArea(elements.title, yAxisWidth, 0);
    }
  }
};

export const renderLine = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: LineChart,
  dataset: Dataset,
  yAxisLocation: string
): void => {
  if (!renderInfo || !component) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let yScale: any = null;
  if (yAxisLocation === 'left') {
    yScale = elements.leftYScale;
  } else if (yAxisLocation === 'right') {
    yScale = elements.rightYScale;
  }

  if (component.showLine[dataset.id]) {
    const lineGen = d3
      .line<DataPoint>()
      .defined((p: DataPoint) => p.value !== null)
      .x((p: DataPoint) => elements.xScale(p.date))
      .y((p: DataPoint) => yScale(p.value));

    const line = elements.dataArea
      .append('path')
      .attr('class', 'tracker-line')
      .style('stroke-width', component.lineWidth[dataset.id]);

    if (component.fillGap[dataset.id]) {
      line
        .datum(Array.from(dataset).filter((p) => p.value !== null))
        .attr('d', lineGen);
    } else {
      line.datum(dataset).attr('d', lineGen);
    }

    if (component.lineColor[dataset.id]) {
      line.style('stroke', component.lineColor[dataset.id]);
    }
  }
};

export const renderPoints = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: LineChart,
  dataset: Dataset,
  yAxisLocation: string
): void => {
  if (!renderInfo || !component) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let yScale: any = null;
  if (yAxisLocation === 'left') yScale = elements.leftYScale;
  else if (yAxisLocation === 'right') yScale = elements.rightYScale;

  if (component.showPoint[dataset.id]) {
    const dots = elements.dataArea
      .selectAll('dot')
      .data(Array.from(dataset).filter((p: DataPoint) => p.value !== null))
      .enter()
      .append('circle')
      .attr('r', component.pointSize[dataset.id])
      .attr('cx', (p: DataPoint) => elements.xScale(p.date))
      .attr('cy', (p: DataPoint) => yScale(p.value))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .attr('date', (p: DataPoint) => d3.timeFormat('%y-%m-%d')(p.date as any))
      .attr('value', (p: DataPoint) => {
        if (p.value !== null) {
          if (Number.isInteger(p.value)) {
            return p.value.toFixed(0);
          }
          return p.value.toFixed(2);
        }
      })
      .attr('valueType', ValueType[dataset.valueType])
      .attr('class', 'tracker-dot');
    if (component.pointColor[dataset.id]) {
      dots.style('fill', component.pointColor[dataset.id]);

      if (
        component.pointBorderColor[dataset.id] &&
        component.pointBorderWidth[dataset.id] > 0
      ) {
        dots.style('stroke', component.pointBorderColor[dataset.id]);
        dots.style('stroke-width', component.pointBorderWidth[dataset.id]);
      }
    }

    if (component.allowInspectData) {
      renderTooltip(dots, elements, renderInfo);
    }
  }
};

export function renderTooltip(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  targetElements: any,
  elements: ChartElements,
  renderInfo: RenderInfo,
  moment?: TMoment
): void {
  const tooltip = elements.dataArea.append('svg').style('opacity', 0);
  const tooltipBg = tooltip.append('rect').attr('x', 0).attr('y', 0);
  const tooltipLabel = tooltip.append('text');
  const tooltipLabelDate = tooltipLabel
    .append('tspan')
    .attr('class', 'tracker-tooltip-label');
  const tooltipLabelValue = tooltipLabel
    .append('tspan')
    .attr('class', 'tracker-tooltip-label');

  const xSpacing = 3;
  const ySpacing = 3;

  targetElements
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .on('mouseenter', (event: any) => {
      const [x, y] = d3.pointer(event);
      let tooltipBgWidth = 0;
      let tooltipBgHeight = 0;
      // Date
      const labelDateText = 'date: ' + d3.select(this).attr('date');
      // labelDateText = x.toString();// debug
      const labelDateSize = ChartUtils.measureTextSize(
        labelDateText,
        'tracker-tooltip-label'
      );
      tooltipLabelDate.text(labelDateText);
      if (labelDateSize.width > tooltipBgWidth) {
        tooltipBgWidth = labelDateSize.width;
      }
      tooltipBgHeight += labelDateSize.height;
      tooltipLabelDate.attr('x', xSpacing).attr('y', tooltipBgHeight);

      // Value
      let labelValueText = 'value: ';
      const valueType = d3.select(this).attr('valueType');
      const strValue = d3.select(this).attr('value');

      if (valueType === 'Time') {
        const dayStart = getMoment(moment)('00:00', 'HH:mm', true);
        const tickTime = dayStart.add(parseFloat(strValue), 'seconds');
        const dateValue = tickTime.format('HH:mm');
        labelValueText += dateValue;
        tooltipLabelValue.text(labelValueText);
      } else {
        labelValueText += strValue;
        tooltipLabelValue.text(labelValueText);
      }
      const labelValueSize = ChartUtils.measureTextSize(
        labelValueText,
        'tracker-tooltip-label'
      );
      if (labelValueSize.width > tooltipBgWidth) {
        tooltipBgWidth = labelValueSize.width;
      }
      tooltipBgHeight += ySpacing + labelValueSize.height;
      tooltipLabelValue.attr('x', xSpacing).attr('y', tooltipBgHeight);

      tooltipBgWidth += 2 * xSpacing;
      tooltipBgHeight += 2 * ySpacing;
      tooltipLabel
        .attr('width', tooltipBgWidth)
        .attr('height', tooltipBgHeight);

      tooltipBg
        .attr('width', tooltipBgWidth)
        .attr('height', tooltipBgHeight)
        .attr('class', 'tracker-tooltip');

      let tooltipPosX = x;
      let tooltipPosY = y;
      const tooltipXOffset = 12;
      const tooltipYOffset = 12;
      if (x + tooltipXOffset + tooltipBgWidth > renderInfo.dataAreaSize.width) {
        // move tooltip to left
        tooltipPosX = x - tooltipBgWidth - tooltipXOffset;
      } else {
        // default at the right side
        tooltipPosX = x + tooltipXOffset;
      }
      if (y - tooltipYOffset - tooltipBgHeight < 0) {
        // down side
        tooltipPosY = y + tooltipYOffset;
      } else {
        // default move to up side
        tooltipPosY = y - tooltipYOffset - tooltipBgHeight;
      }
      tooltip.attr('x', tooltipPosX).attr('y', tooltipPosY);
      tooltip.transition().duration(200).style('opacity', 1);
    })
    .on('mouseleave', () => {
      tooltip.transition().duration(500).style('opacity', 0);
    });
}

export const renderBar = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: BarChart,
  dataset: Dataset,
  yAxisLocation: string,
  currBarSet: number,
  totalNumOfBarSets: number
): void => {
  if (!renderInfo || !component) return;

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
    yScale = elements.leftYScale;
  } else if (yAxisLocation === 'right') {
    yScale = elements.rightYScale;
  }

  const bars = elements.dataArea
    .selectAll('bar')
    .data(Array.from(dataset).filter((p: DataPoint) => p.value !== null))
    .enter()
    .append('rect')
    .attr('x', (p: DataPoint, i: number) => {
      if (i === 0) {
        const portionVisible = currBarSet + 1 - totalNumOfBarSets / 2;
        if (portionVisible < 1) {
          return (
            elements.xScale(p.date) -
            barSetWidth / 2 +
            currBarSet * barWidth +
            portionVisible * barWidth
          );
        }
      }
      return elements.xScale(p.date) - barSetWidth / 2 + currBarSet * barWidth;
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

  if (component.barColor[dataset.id]) {
    bars.style('fill', component.barColor[dataset.id]);
  }
};

export const renderLegend = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: BaseChart
): void => {
  // Get chart elements
  const svg = elements.svg;
  const dataArea = elements.dataArea;
  const title = elements.title;
  const xAxis = elements.xAxis;
  const leftYAxis = elements.leftYAxis;
  const rightYAxis = elements.rightYAxis;

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
    return ChartUtils.measureTextSize(n, 'tracker-legend-label');
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
  if (component.legendOrientation === 'vertical') {
    legendWidth = xSpacing * 3 + markerWidth + maxNameWidth;
    legendHeight = (numNames + 1) * ySpacing;
  } else if (component.legendOrientation === 'horizontal') {
    legendWidth =
      (2 * xSpacing + markerWidth) * numNames +
      xSpacing +
      d3.sum(nameSizes, (s, i) => (xDatasetIds.includes(i) ? 0 : s.width));
    legendHeight = ySpacing + nameHeight;
  }

  // Calculate legendX and legendY
  let legendX = 0; // relative to graphArea
  let legendY = 0;
  if (component.legendPosition === 'top') {
    // below title
    legendX =
      leftYAxisWidth + renderInfo.dataAreaSize.width / 2 - legendWidth / 2;
    legendY = titleHeight;
    // Expand svg
    DomUtils.expandArea(svg, 0, legendHeight + ySpacing);
    // Move dataArea down
    DomUtils.moveArea(dataArea, 0, legendHeight + ySpacing);
  } else if (component.legendPosition === 'bottom') {
    // bellow x-axis label
    legendX =
      leftYAxisWidth + renderInfo.dataAreaSize.width / 2 - legendWidth / 2;
    legendY =
      titleHeight + renderInfo.dataAreaSize.height + xAxisHeight + ySpacing;
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

  const firstMarkerX = xSpacing;
  const firstMarkerY = nameHeight;
  const firstLabelX = firstMarkerX + xSpacing + markerWidth; // xSpacing + 2 * xSpacing
  const firstLabelY = firstMarkerY;

  if (component.legendOrientation === 'vertical') {
    if (component.componentType === ComponentType.LineChart) {
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

    if (component.componentType === ComponentType.LineChart) {
      nameLabels.style('fill', (name: string, i: number) => {
        if (xDatasetIds.includes(i)) return;
        return (component as LineChart).lineColor[i];
      });
    } else if (component.componentType === ComponentType.BarChart) {
      nameLabels.style('fill', (name: string, i: number) => {
        if (xDatasetIds.includes(i)) return;
        return (component as BarChart).barColor[i];
      });
    }
  } else if (component.legendOrientation === 'horizontal') {
    if (component.componentType === ComponentType.LineChart) {
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
          return (component as LineChart).showPoint[i]
            ? (component as LineChart).pointSize[i]
            : 0;
        })
        .style('fill', (name: string, i: number) => {
          if (xDatasetIds.includes(i)) return;
          return (component as LineChart).pointColor[i];
        });
    } else if (component.componentType === ComponentType.BarChart) {
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

    if (component.componentType === ComponentType.LineChart) {
      nameLabels.style('fill', (name: string, i: number) => {
        if (xDatasetIds.includes(i)) return;
        return (component as LineChart).lineColor[i];
      });
    } else if (component.componentType === ComponentType.BarChart) {
      nameLabels.style('fill', (name: string, i: number) => {
        if (xDatasetIds.includes(i)) return;
        return (component as BarChart).barColor[i];
      });
    }
  }
};

export const renderTitle = (
  elements: ChartElements,
  renderInfo: RenderInfo,
  component: BaseChart
): void => {
  // console.log("renderTitle")
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
      `translate(${renderInfo.dataAreaSize.width / 2}, ${titleSize.height / 2})`
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

export const setChartScale = (
  _canvas: HTMLElement,
  elements: ChartElements,
  renderInfo: RenderInfo
): void => {
  const { fitPanelWidth, fixedScale } = renderInfo;
  const canvas = d3.select(_canvas);
  const svg = elements.svg;
  const svgWidth = parseFloat(svg.attr('width'));
  const svgHeight = parseFloat(svg.attr('height'));
  svg
    .attr('width', null)
    .attr('height', null)
    .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  if (fitPanelWidth) {
    canvas.style('width', '100%');
  } else {
    canvas.style('width', (svgWidth * fixedScale).toString() + 'px');
    canvas.style('height', (svgHeight * fixedScale).toString() + 'px');
  }
};

export const createAreas = (
  canvas: HTMLElement,
  renderInfo: RenderInfo
): ChartElements => {
  const elements: ChartElements = {};
  // whole area for plotting, includes margins

  const { dataAreaSize, margin } = renderInfo;
  const svg = d3
    .select(canvas)
    .append('svg')
    .attr('id', 'svg')
    .attr('width', dataAreaSize.width + margin.left + margin.right)
    .attr('height', dataAreaSize.height + margin.top + margin.bottom);
  elements['svg'] = svg;

  // graphArea, includes chartArea, title, legend
  const graphArea = svg
    .append('g')
    .attr('id', 'graphArea')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .attr('width', dataAreaSize.width + margin.right)
    .attr('height', dataAreaSize.height + margin.bottom);
  elements['graphArea'] = graphArea;

  // dataArea, under graphArea, includes points, lines, xAxis, yAxis
  const dataArea = graphArea
    .append('g')
    .attr('id', 'dataArea')
    .attr('width', dataAreaSize.width)
    .attr('height', dataAreaSize.height);
  elements['dataArea'] = dataArea;

  return elements;
};
