import * as d3 from 'd3';
import { Duration, Moment } from 'moment';
import { sprintf } from 'sprintf-js';
import { RenderInfo } from '../../models/render-info';
import { ComponentElements } from '../../models/types';
import { DateTimeUtils } from '../../utils';

export interface CreateElementsOptions {
  clearContents?: boolean;
  elements?: ComponentElements;
}

export const createElements = (
  container: HTMLElement,
  renderInfo: RenderInfo,
  options: CreateElementsOptions = { clearContents: false }
): ComponentElements => {
  if (!renderInfo) return;

  const elements: ComponentElements = options?.elements || {};
  const { dataAreaSize, margin } = renderInfo;
  const { height, width } = dataAreaSize;

  // Start with a clean slate
  if (options?.clearContents) {
    d3.select(container).select('#svg').remove();
    Object.getOwnPropertyNames(elements).forEach(
      (name) => delete elements[name]
    );
  }
  // whole area for plotting, includes margins
  const svg = d3
    .select(container)
    .append('svg')
    .attr('id', 'svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);
  elements['svg'] = svg;

  // graphArea, includes chartArea, title, legend
  const graphArea = svg
    .append('g')
    .attr('id', 'graphArea')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .attr('width', width + margin.right)
    .attr('height', height + margin.bottom);
  elements['graphArea'] = graphArea;

  // dataArea, under graphArea, includes points, lines, xAxis, yAxis
  const dataArea = graphArea
    .append('g')
    .attr('id', 'dataArea')
    .attr('width', width)
    .attr('height', height);
  elements['dataArea'] = dataArea;

  return elements;
};

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
