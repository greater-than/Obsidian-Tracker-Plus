import * as d3 from 'd3';
import { Duration, Moment } from 'moment';
import { sprintf } from 'sprintf-js';
import { DateTimeUtils } from '../../utils';
import { fiveHours, halfHour, oneHour, twelveHours } from '../shared';
import { TTickLabelFormatter } from './types';

export interface ITickInterval {
  values: Date[];
  interval: d3.TimeInterval;
}

export const getXTicks = (
  dates: Moment[],
  interval: Duration
): ITickInterval => {
  // The input interval could be null,
  // generate tick values even if interval is null
  let values: Date[] = [];
  let step = null;

  // y values are time values
  if (interval) {
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    values = d3.timeDay.range(
      firstDate.toDate(),
      lastDate.toDate(),
      interval.asDays()
    );
  } else {
    const days = dates.length;
    if (days <= 15) {
      // number of ticks: 0-15
      step = d3.timeDay;
    } else if (days <= 4 * 15) {
      // number of ticks: 4-15
      step = d3.timeDay.every(4);
    } else if (days <= 7 * 15) {
      // number of ticks: 8-15
      step = d3.timeWeek;
    } else if (days <= 15 * 30) {
      // number of ticks: 4-15
      step = d3.timeMonth;
    } else if (days <= 15 * 60) {
      // number of ticks: 8-15
      step = d3.timeMonth.every(2);
    } else {
      step = d3.timeYear;
    }
  }
  return { values, interval: step };
};

export const getXTickLabelFormatter = (
  dates: Moment[],
  inTickLabelFormat: string
): TTickLabelFormatter => {
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
  }
};

/**
 * @summary Returns an array of values for the y-axis
 * @description Returns values event if the interval is null
 * @param {number} start
 * @param {number} stop
 * @param {number | Duration} interval
 * @param {boolean} isTimeValue
 * @returns
 */
export const getYTicks = (
  start: number,
  stop: number,
  interval: number | Duration,
  isTimeValue = false
): number[] => {
  let step: number;

  if (!isTimeValue) {
    // y values are numbers
    if (interval && typeof interval === 'number') step = interval;
  } else if (interval && window.moment.isDuration(interval))
    // y values are time values
    step = Math.abs(interval.asSeconds());
  else {
    // auto interval for time values
    const span = Math.abs(stop - start);
    step = span > fiveHours ? oneHour : halfHour;
    start = Math.floor(start / step) * step;
    stop = Math.ceil(stop / step) * step;
  }

  const ticks = d3.range(start, stop, step);
  return ticks.length === 0 ? null : ticks;
};

/**
 * @summary Returns a function to convert a value to a time string
 * @param {number} start
 * @param {number} stop
 * @param {string} inTickLabelFormat
 * @param {boolean} isTimeValue
 * @returns {TTickLabelFormatter}
 */
export const getYTickLabelFormatter = (
  start: number,
  stop: number,
  inTickLabelFormat: string,
  isTimeValue = false
): TTickLabelFormatter => {
  if (!isTimeValue) {
    return inTickLabelFormat
      ? (value: number): string => sprintf('%' + inTickLabelFormat, value)
      : d3.tickFormat(start, stop, 10);
  }
  // values in seconds
  if (inTickLabelFormat) {
    return (value: number): string =>
      window
        .moment('00:00', 'HH:mm', true)
        .add(value, 'seconds')
        .format(inTickLabelFormat);
  }

  return (value: number): string => {
    // auto interleave if spans more than 12 hours
    const span = Math.abs(stop - start);
    if (span > twelveHours) {
      const interleave = ((value - start) / oneHour) % 2;
      if (value < start || value > stop || interleave < 1) return '';
    }
    return window
      .moment('00:00', 'HH:mm', true)
      .add(value, 'seconds')
      .format('HH:mm');
  };
};
