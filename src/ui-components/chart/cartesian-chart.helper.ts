import * as d3 from 'd3';
import { sprintf } from 'sprintf-js';
import { DataPoint } from '../../models/data-point.model';
import { Dataset } from '../../models/dataset';
import { ComponentType, ValueType } from '../../models/enums';
import { RenderInfo } from '../../models/render-info';
import { ComponentElements } from '../../models/types';
import { BarChart } from '../../ui-components/chart/bar-chart.model';
import { CartesianChart } from '../../ui-components/chart/cartesian-chart.model';
import { LineChart } from '../../ui-components/chart/line-chart.model';
import * as helper from '../../utils/helper';
import Duration = moment.Duration;
import Moment = moment.Moment;

export const getXTickValues = (
  dates: Moment[],
  interval: Duration
): [Array<Date>, d3.TimeInterval] => {
  // The input interval could be null,
  // generate tick values even if interval is null
  // console.log(interval);
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
  inTickLabelFormat: string
): ((date: Date) => string) => {
  if (inTickLabelFormat) {
    const fnTickLabelFormat = (date: Date): string => {
      return helper.dateToStr(window.moment(date), inTickLabelFormat);
    };
    return fnTickLabelFormat;
  } else {
    let tickLabelFormat = null;
    const days = dates.length;

    if (days <= 15) {
      // number of ticks: 0-15
      tickLabelFormat = d3.timeFormat('%y-%m-%d');
    } else if (days <= 4 * 15) {
      // number of ticks: 4-15
      tickLabelFormat = d3.timeFormat('%y-%m-%d');
    } else if (days <= 7 * 15) {
      // number of ticks: 8-15
      tickLabelFormat = d3.timeFormat('%y-%m-%d');
    } else if (days <= 15 * 30) {
      // number of ticks: 4-15
      tickLabelFormat = d3.timeFormat('%y %b');
    } else if (days <= 15 * 60) {
      // number of ticks: 8-15
      tickLabelFormat = d3.timeFormat('%y %b');
    } else {
      tickLabelFormat = d3.timeFormat('%Y');
    }

    return tickLabelFormat;
  }
};

export const getYTickValues = (
  yLower: number,
  yUpper: number,
  interval: number | Duration,
  isTimeValue = false
): number[] => {
  // The input interval could be null,
  // generate tick values for time values even if interval is null
  // console.log(interval);
  // console.log(isTimeValue);
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

export const getYTickLabelFormat = (
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
        // console.log(`yLower/yUpper: ${yLower}/${yUpper}`)
        // console.log(`value/extent/inter:${value}/${absExtent}/${(value-yLower)/3600}`);
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
  chartElements: ComponentElements,
  renderInfo: RenderInfo,
  chartInfo: CartesianChart
): void => {
  // console.log("renderXAxis");
  if (!renderInfo || !chartInfo) return;

  const datasets = renderInfo.datasets;
  const xDomain = d3.extent(datasets.dates);
  const xScale = d3
    .scaleTime()
    .domain(xDomain)
    .range([0, renderInfo.dataAreaSize.width]);
  chartElements['xScale'] = xScale;

  const tickIntervalInDuration = helper.parseDurationString(
    chartInfo.xAxisTickInterval
  );

  const [tickValues, tickInterval] = getXTickValues(
    datasets.dates,
    tickIntervalInDuration
  );
  const tickFormat = getXTickLabelFormat(
    datasets.dates,
    chartInfo.xAxisTickLabelFormat
  );

  const xAxisGen = d3.axisBottom(xScale);

  if (tickValues && tickValues.length !== 0) {
    xAxisGen.tickValues(tickValues);
  } else if (tickInterval) {
    xAxisGen.ticks(tickInterval);
  }
  if (tickFormat) {
    xAxisGen.tickFormat(tickFormat);
  }

  const xAxis = chartElements.dataArea // axis includes ticks
    .append('g')
    .attr('id', 'xAxis')
    .attr('transform', 'translate(0,' + renderInfo.dataAreaSize.height + ')') // relative to graphArea
    .call(xAxisGen)
    .attr('class', 'tracker-axis');
  if (chartInfo.xAxisColor) {
    xAxis.style('stroke', chartInfo.xAxisColor);
  }
  chartElements['xAxis'] = xAxis;

  const textSize = helper.measureTextSize('99-99-99');

  const xAxisTickLabels = xAxis
    .selectAll('text')
    .attr('x', -1 * textSize.height * Math.cos((65 / 180) * Math.PI))
    .attr('y', 0)
    .attr('transform', 'rotate(-65)')
    .style('text-anchor', 'end')
    .attr('class', 'tracker-tick-label');
  if (chartInfo.xAxisColor) {
    xAxisTickLabels.style('fill', chartInfo.xAxisColor);
  }

  const tickLength = 6;
  const tickLabelHeight = textSize.width * Math.sin((65 / 180) * Math.PI);
  const xAxisLabel = xAxis
    .append('text')
    .text(chartInfo.xAxisLabel)
    .attr(
      'transform',
      'translate(' +
        renderInfo.dataAreaSize.width / 2 +
        ',' +
        (tickLength + tickLabelHeight) +
        ')'
    )
    .attr('class', 'tracker-axis-label');
  if (chartInfo.xAxisLabelColor) {
    xAxisLabel.style('fill', chartInfo.xAxisLabelColor);
  }

  // xAxis height
  xAxis.attr('height', tickLength + tickLabelHeight);

  // Expand areas
  helper.expandArea(chartElements.svg, 0, tickLength + tickLabelHeight);
  helper.expandArea(chartElements.graphArea, 0, tickLength + tickLabelHeight);
};

export const renderYAxis = (
  chartElements: ComponentElements,
  renderInfo: RenderInfo,
  chartInfo: CartesianChart,
  yAxisLocation: string,
  datasetIds: Array<number>
): string => {
  // console.log("renderYAxis")
  // console.log(datasets);
  // console.log(renderInfo);
  // console.log(datasetIds);
  if (!renderInfo || !chartInfo) return;

  const datasets = renderInfo.datasets;
  if (datasetIds.length === 0) {
    return;
  }

  if (yAxisLocation !== 'left' && yAxisLocation !== 'right') return;

  let yMinOfDatasets = null;
  let yMaxOfDatasets = null;
  let tmpValueIsTime = null;
  let valueIsTime = false;
  for (const datasetId of datasetIds) {
    const dataset = datasets.getDatasetById(datasetId);
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
  // console.log(yMinOfDatasets);
  // console.log(yMaxOfDatasets);
  let yMin = null;
  if (yAxisLocation === 'left') {
    yMin = chartInfo.yMin[0];
  } else if (yAxisLocation === 'right') {
    yMin = chartInfo.yMin[1];
  }
  let yMinAssigned = false;
  if (typeof yMin !== 'number') {
    yMin = yMinOfDatasets;
  } else {
    yMinAssigned = true;
  }

  let yMax = null;
  if (yAxisLocation === 'left') {
    yMax = chartInfo.yMax[0];
  } else if (yAxisLocation === 'right') {
    yMax = chartInfo.yMax[1];
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
  if (chartInfo.componentType() === ComponentType.Bar) {
    if (yUpper < 0) {
      yUpper = 0;
    }
    if (yLower > 0) {
      yLower = 0;
    }
  }
  let domain = [yLower, yUpper];
  if (
    (yAxisLocation === 'left' && chartInfo.reverseYAxis[0]) ||
    (yAxisLocation === 'right' && chartInfo.reverseYAxis[1])
  ) {
    domain = [yUpper, yLower];
  }
  yScale.domain(domain).range([renderInfo.dataAreaSize.height, 0]);

  if (yAxisLocation === 'left') {
    chartElements['leftYScale'] = yScale;
  } else if (yAxisLocation === 'right') {
    chartElements['rightYScale'] = yScale;
  }

  let yAxisColor = '';
  if (yAxisLocation === 'left') {
    yAxisColor = chartInfo.yAxisColor[0];
  } else if (yAxisLocation === 'right') {
    yAxisColor = chartInfo.yAxisColor[1];
  }

  let yAxisLabelColor = '';
  if (yAxisLocation === 'left') {
    yAxisLabelColor = chartInfo.yAxisLabelColor[0];
  } else if (yAxisLocation === 'right') {
    yAxisLabelColor = chartInfo.yAxisLabelColor[1];
  }

  let yAxisLabelText = '';
  if (yAxisLocation === 'left') {
    yAxisLabelText = chartInfo.yAxisLabel[0];
  } else if (yAxisLocation === 'right') {
    yAxisLabelText = chartInfo.yAxisLabel[1];
  }

  let yAxisUnitText = '';
  let yAxisTickInterval = null;
  let yAxisTickLabelFormat = null;
  if (yAxisLocation === 'left') {
    yAxisUnitText = chartInfo.yAxisUnit[0];
    yAxisTickInterval = chartInfo.yAxisTickInterval[0]; // string
    yAxisTickLabelFormat = chartInfo.yAxisTickLabelFormat[0];
  } else if (yAxisLocation === 'right') {
    yAxisUnitText = chartInfo.yAxisUnit[1];
    yAxisTickInterval = chartInfo.yAxisTickInterval[1]; // string
    yAxisTickLabelFormat = chartInfo.yAxisTickLabelFormat[1];
  }
  // get interval from string
  let tickInterval = null;
  if (valueIsTime) {
    tickInterval = helper.parseDurationString(yAxisTickInterval);
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

  const yAxis = chartElements.dataArea
    .append('g')
    .attr('id', 'yAxis')
    .call(yAxisGen)
    .attr('class', 'tracker-axis');
  if (yAxisLocation == 'right') {
    yAxis.attr(
      'transform',
      'translate(' + renderInfo.dataAreaSize.width + ' ,0)'
    );
  }
  if (yAxisLocation === 'left') {
    chartElements['leftYAxis'] = yAxis;
  } else if (yAxisLocation === 'right') {
    chartElements['rightYAxis'] = yAxis;
  }

  const yAxisLine = yAxis.selectAll('path');
  if (yAxisColor) {
    yAxisLine.style('stroke', yAxisColor);
  }

  const yAxisTicks = yAxis.selectAll('line');
  if (yAxisColor) {
    yAxisTicks.style('stroke', yAxisColor);
  }

  const yAxisTickLabels = yAxis
    .selectAll('text')
    .attr('class', 'tracker-tick-label');
  if (yAxisColor) {
    yAxisTickLabels.style('fill', yAxisColor);
  }

  // Get max tick label width
  let maxTickLabelWidth = 0;
  for (const label of yAxisTickLabels) {
    // console.log(label.textContent);
    if (label.textContent) {
      const labelSize = helper.measureTextSize(
        label.textContent,
        'tracker-axis-label'
      );
      if (labelSize.width > maxTickLabelWidth) {
        maxTickLabelWidth = labelSize.width;
      }
    }
  }
  // console.log(maxTickLabelWidth);
  if (yAxisUnitText !== '') {
    yAxisLabelText += ' (' + yAxisUnitText + ')';
  }
  const yTickLength = 6;
  const yAxisLabelSize = helper.measureTextSize(yAxisLabelText);
  const yAxisLabel = yAxis
    .append('text')
    .text(yAxisLabelText)
    .attr('transform', 'rotate(-90)')
    .attr('x', (-1 * renderInfo.dataAreaSize.height) / 2)
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
  helper.expandArea(chartElements.svg, yAxisWidth, 0);
  helper.expandArea(chartElements.graphArea, yAxisWidth, 0);

  // Move areas
  if (yAxisLocation === 'left') {
    // Move dataArea
    helper.moveArea(chartElements.dataArea, yAxisWidth, 0);

    // Move title
    if (chartElements.title) {
      helper.moveArea(chartElements.title, yAxisWidth, 0);
    }
  }
};

export const renderLine = (
  chartElements: ComponentElements,
  renderInfo: RenderInfo,
  lineInfo: LineChart,
  dataset: Dataset,
  yAxisLocation: string
): void => {
  // console.log(dataset);
  // console.log(renderInfo);
  if (!renderInfo || !lineInfo) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let yScale: any = null;
  if (yAxisLocation === 'left') {
    yScale = chartElements.leftYScale;
  } else if (yAxisLocation === 'right') {
    yScale = chartElements.rightYScale;
  }

  if (lineInfo.showLine[dataset.id]) {
    const lineGen = d3
      .line<DataPoint>()
      .defined((p: DataPoint) => p.value !== null)
      .x((p: DataPoint) => chartElements.xScale(p.date))
      .y((p: DataPoint) => yScale(p.value));

    const line = chartElements.dataArea
      .append('path')
      .attr('class', 'tracker-line')
      .style('stroke-width', lineInfo.lineWidth[dataset.id]);

    if (lineInfo.fillGap[dataset.id]) {
      line
        .datum(Array.from(dataset).filter((p) => p.value !== null))
        .attr('d', lineGen);
    } else {
      line.datum(dataset).attr('d', lineGen);
    }

    if (lineInfo.lineColor[dataset.id]) {
      line.style('stroke', lineInfo.lineColor[dataset.id]);
    }
  }
};

export const renderPoints = (
  chartElements: ComponentElements,
  renderInfo: RenderInfo,
  lineInfo: LineChart,
  dataset: Dataset,
  yAxisLocation: string
): void => {
  // console.log(lineInfo);
  // console.log(dataset);
  if (!renderInfo || !lineInfo) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let yScale: any = null;
  if (yAxisLocation === 'left') {
    yScale = chartElements.leftYScale;
  } else if (yAxisLocation === 'right') {
    yScale = chartElements.rightYScale;
  }

  if (lineInfo.showPoint[dataset.id]) {
    const dots = chartElements.dataArea
      .selectAll('dot')
      .data(Array.from(dataset).filter((p: DataPoint) => p.value !== null))
      .enter()
      .append('circle')
      .attr('r', lineInfo.pointSize[dataset.id])
      .attr('cx', (p: DataPoint) => chartElements.xScale(p.date))
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
    if (lineInfo.pointColor[dataset.id]) {
      dots.style('fill', lineInfo.pointColor[dataset.id]);

      if (
        lineInfo.pointBorderColor[dataset.id] &&
        lineInfo.pointBorderWidth[dataset.id] > 0
      ) {
        dots.style('stroke', lineInfo.pointBorderColor[dataset.id]);
        dots.style('stroke-width', lineInfo.pointBorderWidth[dataset.id]);
      }
    }

    if (lineInfo.allowInspectData) {
      renderTooltip(dots, chartElements, renderInfo);
    }
  }
};

export function renderTooltip(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  targetElements: any,
  chartElements: ComponentElements,
  renderInfo: RenderInfo
): void {
  const tooltip = chartElements.dataArea.append('svg').style('opacity', 0);
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
      const labelDateSize = helper.measureTextSize(
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
      // strValue += y.toString();//debug
      if (valueType === 'Time') {
        const dayStart = window.moment('00:00', 'HH:mm', true);
        const tickTime = dayStart.add(parseFloat(strValue), 'seconds');
        const dateValue = tickTime.format('HH:mm');
        labelValueText += dateValue;
        tooltipLabelValue.text(labelValueText);
      } else {
        labelValueText += strValue;
        tooltipLabelValue.text(labelValueText);
      }
      const labelValueSize = helper.measureTextSize(
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
  chartElements: ComponentElements,
  renderInfo: RenderInfo,
  barInfo: BarChart,
  dataset: Dataset,
  yAxisLocation: string,
  currBarSet: number,
  totalNumOfBarSets: number
): void => {
  // console.log(dataset);
  // console.log(barInfo);
  // console.log("%d/%d", currBarSet, totalNumOfBarSets);
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
  // console.log(chartInfo.legendPosition);
  // console.log(chartInfo.legendOrientation);
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
  // console.log(xDatasetIds);
  // Get names and their dimension
  const names = datasets.names; // xDataset name included
  const nameSizes = names.map((n) => {
    return helper.measureTextSize(n, 'tracker-legend-label');
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
  // console.log(
  //     `maxName: ${maxName}, characterWidth: ${characterWidth}, maxNameWidth: ${maxNameWidth}`
  // );
  // console.log(`xSpacing:${xSpacing}, numNames: ${numNames}, markerWidth: ${markerWidth}`);
  // console.log(`legendWidth: ${legendWidth}, legendHeight: ${legendHeight}`);
  // Calculate legendX and legendY
  let legendX = 0; // relative to graphArea
  let legendY = 0;
  if (chartInfo.legendPosition === 'top') {
    // below title
    legendX =
      leftYAxisWidth + renderInfo.dataAreaSize.width / 2 - legendWidth / 2;
    legendY = titleHeight;
    // Expand svg
    helper.expandArea(svg, 0, legendHeight + ySpacing);
    // Move dataArea down
    helper.moveArea(dataArea, 0, legendHeight + ySpacing);
  } else if (chartInfo.legendPosition === 'bottom') {
    // bellow x-axis label
    legendX =
      leftYAxisWidth + renderInfo.dataAreaSize.width / 2 - legendWidth / 2;
    legendY =
      titleHeight + renderInfo.dataAreaSize.height + xAxisHeight + ySpacing;
    // Expand svg
    helper.expandArea(svg, 0, legendHeight + ySpacing);
  } else if (chartInfo.legendPosition === 'left') {
    legendX = 0;
    legendY =
      titleHeight + renderInfo.dataAreaSize.height / 2 - legendHeight / 2;
    // Expand svg
    helper.expandArea(svg, legendWidth + xSpacing, 0);
    // Move dataArea right
    helper.moveArea(dataArea, legendWidth + xSpacing, 0);
  } else if (chartInfo.legendPosition === 'right') {
    legendX =
      renderInfo.dataAreaSize.width +
      leftYAxisWidth +
      rightYAxisWidth +
      xSpacing;
    legendY =
      titleHeight + renderInfo.dataAreaSize.height / 2 - legendHeight / 2;
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
    if (chartInfo.componentType() === ComponentType.Line) {
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
    } else if (chartInfo.componentType() === ComponentType.Bar) {
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

    if (chartInfo.componentType() === ComponentType.Line) {
      nameLabels.style('fill', (name: string, i: number) => {
        if (xDatasetIds.includes(i)) return;
        return (chartInfo as LineChart).lineColor[i];
      });
    } else if (chartInfo.componentType() === ComponentType.Bar) {
      nameLabels.style('fill', (name: string, i: number) => {
        if (xDatasetIds.includes(i)) return;
        return (chartInfo as BarChart).barColor[i];
      });
    }
  } else if (chartInfo.legendOrientation === 'horizontal') {
    if (chartInfo.componentType() === ComponentType.Line) {
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
    } else if (chartInfo.componentType() === ComponentType.Bar) {
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

    if (chartInfo.componentType() === ComponentType.Line) {
      nameLabels.style('fill', (name: string, i: number) => {
        if (xDatasetIds.includes(i)) return;
        return (chartInfo as LineChart).lineColor[i];
      });
    } else if (chartInfo.componentType() === ComponentType.Bar) {
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
  // console.log("renderTitle")
  // under graphArea
  if (!renderInfo || !chartInfo) return;

  if (!chartInfo.title) return;
  const titleSize = helper.measureTextSize(chartInfo.title, 'tracker-title');

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
  helper.expandArea(chartElements.svg, 0, titleSize.height);
  helper.expandArea(chartElements.graphArea, 0, titleSize.height);

  // Move sibling areas
  helper.moveArea(chartElements.dataArea, 0, titleSize.height);

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
