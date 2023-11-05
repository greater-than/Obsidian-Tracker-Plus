import * as d3 from 'd3';
import {
  BrokenStreakError,
  DivisionByZeroError,
  FunctionError,
  Reason,
  StreakError,
  TrackerError,
} from '../errors';
import { Dataset } from '../models/dataset';
import { RenderInfo } from '../models/render-info';
import { isDivisorValid } from './helper';
import { IDatasetToValue } from './types';
import Moment = moment.Moment;

export const DatasetToValue: IDatasetToValue = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  min: (dataset: Dataset, _renderInfo: RenderInfo): number =>
    d3.min(dataset.values),

  /**
   * @summary Returns the min date from the dataset values
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns {Moment}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  minDate: (dataset: Dataset, _renderInfo: RenderInfo): Moment => {
    // return Moment
    const min = d3.min(dataset.values);
    if (!Number.isNumber(min)) throw new TrackerError('Min date not found');
    return Array.from(dataset)
      .reverse()
      .find((point) => point.value !== null && point.value === min).date;
  },

  /**
   * @summary Returns the max value from the dataset values
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns {number}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  max: (dataset: Dataset, _renderInfo: RenderInfo): number =>
    d3.max(dataset.values),

  /**
   * @summary Returns the max date from the dataset values
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns {Moment}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxDate: (dataset: Dataset, _renderInfo: RenderInfo): Moment => {
    // return Moment
    const max = d3.max(dataset.values);
    if (!Number.isNumber(max)) throw new TrackerError('Max date not found');
    return Array.from(dataset)
      .reverse()
      .find((p) => p.value !== null && p.value === max).date;
  },

  /**
   * @summary Returns the start date from the dataset or renderInfo
   * @param {Dataset} dataset
   * @param {RenderInfo} renderInfo Not used
   * @returns {Moment}
   */
  startDate: (dataset: Dataset, renderInfo: RenderInfo): Moment => {
    const { startDate: dsDate } = dataset;
    const { startDate: riDate } = renderInfo;
    return dataset && dsDate !== null && dsDate.isValid() ? dsDate : riDate;
  },

  /**
   * @summary Returns the end date from the dataset or renderInfo
   * @param {Dataset} dataset
   * @param {RenderInfo} renderInfo Not used
   * @returns {Moment}
   */
  endDate: (dataset: Dataset, renderInfo: RenderInfo): Moment => {
    const { endDate: dsDate } = dataset;
    const { endDate: riDate } = renderInfo;
    return dataset && dsDate !== null && dsDate.isValid() ? dsDate : riDate;
  },

  /**
   * @summary Sum of all values in the dataset
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sum: (dataset: Dataset, _renderInfo: RenderInfo): number =>
    d3.sum(dataset.values),

  /**
   *  @deprecated
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  count: (_dataset: Dataset, _renderInfo: RenderInfo): string => {
    throw new FunctionError('count');
  },

  /**
   * @summary Returns number of targets in the dataset
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns {number}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  numTargets: (dataset: Dataset, _renderInfo: RenderInfo): number =>
    dataset.targetCount,

  /**
   * @deprecated
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  days: (_dataset: Dataset, _renderInfo: RenderInfo): string => {
    throw new FunctionError('days');
  },

  /**
   * @summary Returns number of days in the dataset
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns {number}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  numDays: (dataset: Dataset, _renderInfo: RenderInfo): number =>
    dataset.values.length,

  /**
   * @summary Returns number of days with data in the dataset
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns {number}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  numDaysHavingData: (dataset: Dataset, _renderInfo: RenderInfo): number =>
    dataset.nonNullValueCount,

  /**
   * @summary Returns max streak within the dataset
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns {number}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxStreak: (dataset: Dataset, _renderInfo: RenderInfo): number => {
    // return number
    let streak = 0;
    let maxStreak = 0;
    for (const dataPoint of dataset) {
      if (dataPoint.value !== null) streak++;
      else streak = 0;
      if (streak >= maxStreak) maxStreak = streak;
    }
    return maxStreak;
  },

  /**
   * @summary Returns max streak start date within the dataset
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns {Moment}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxStreakStart: (dataset: Dataset, _renderInfo: RenderInfo): Moment => {
    let streak = 0;
    let maxStreak = 0;
    let streakStart: Moment = null;
    let maxStreakStart: Moment = null;
    if (!dataset) return maxStreakStart;
    for (const dataPoint of dataset) {
      if (dataPoint.value !== null) {
        streakStart = streak === 0 ? dataPoint.date : streakStart;
        streak++;
      } else streak = 0; // reset streak
      if (streak >= maxStreak) {
        maxStreak = streak;
        maxStreakStart = streakStart;
      }
    }
    return maxStreakStart;
  },

  /**
   * @summary Returns the max streak end date within a dataset
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns {Moment}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxStreakEnd: (dataset: Dataset, _renderInfo: RenderInfo): Moment => {
    let streak = 0;
    let maxStreak = 0;
    let streakEnd: Moment = null;
    let maxStreakEnd: Moment = null;
    if (!dataset) return maxStreakEnd;
    const ds = Array.from(dataset);

    Array.from(dataset).forEach((p, i) => {
      let nextPoint = null;
      if (i < ds.length - 1) nextPoint = ds[i + 1];
      if (p.value !== null) {
        streakEnd = nextPoint?.value === null ? p.date : streakEnd;
        streak++;
      } else streak = 0; // reset streak
      if (streak >= maxStreak) {
        maxStreak = streak;
        maxStreakEnd = streakEnd;
      }
    });

    return maxStreakEnd;
  },

  /**
   * @summary Returns the number of breaks between streaks in the dataset
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns {number}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxBreaks: (dataset: Dataset, _renderInfo: RenderInfo): number => {
    let breaks = 0;
    let maxBreaks = 0;
    Array.from(dataset).forEach((p) => {
      if (p.value === null) breaks++;
      else breaks = 0;
      if (breaks > maxBreaks) maxBreaks = breaks;
    });
    return maxBreaks;
  },

  /**
   * @summary Returns the start date of the last break in a streak
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns {number}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxBreaksStart: (dataset: Dataset, _renderInfo: RenderInfo): Moment => {
    let breaks = 0;
    let maxBreaks = 0;
    let breaksStart: Moment = null;
    let maxBreaksStart: Moment = null;
    if (!dataset) return maxBreaksStart;
    Array.from(dataset).forEach((p) => {
      if (p.value === null) {
        if (breaks === 0) breaksStart = p.date;
        breaks++;
      } else breaks = 0; // reset breaks
      if (breaks >= maxBreaks) {
        maxBreaks = breaks;
        maxBreaksStart = breaksStart;
      }
    });
    return maxBreaksStart;
  },

  /**
   * @summary Returns the end date of the last break in a streak
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns {number}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxBreaksEnd: (dataset: Dataset, _renderInfo: RenderInfo): Moment => {
    let breaks = 0;
    let maxBreaks = 0;
    let breaksEnd: Moment = null;
    let maxBreaksEnd: Moment = null;
    if (!dataset) return maxBreaksEnd;
    Array.from(dataset).forEach((p, ind, arr) => {
      const nextPoint = ind < arr.length - 1 ? arr[ind + 1] : null;
      if (p.value === null) {
        breaks++;
        if (nextPoint?.value !== null) breaksEnd = p.date;
      } else breaks = 0; // reset breaks
      if (breaks >= maxBreaks) {
        maxBreaks = breaks;
        maxBreaksEnd = breaksEnd;
      }
    });
    return maxBreaksEnd;
  },

  /**
   * @deprecated
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lastStreak: (_dataset, _renderInfo): string => {
    throw new FunctionError('lastStreak');
  },

  /**
   * @summary Returns length of the current streak
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns {number}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentStreak: (dataset: Dataset, _renderInfo: RenderInfo): number => {
    if (!dataset) return 0;
    return Array.from(dataset).filter((ds) => ds.value !== null).length;
  },

  /**
   * @summary Returns the start date of the current streak
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns {number}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentStreakStart: (dataset, _renderInfo): Moment => {
    let start: Moment = null;
    if (dataset) {
      const points = Array.from(dataset);
      for (let ind = points.length - 1; ind >= 0; ind--) {
        const point = points[ind];
        if (ind < points.length - 1) start = points[ind + 1].date;
        if (point.value === null) break;
      }
    }
    if (start === null) throw new StreakError(Reason.NO_START);
    return start;
  },

  /**
   * @summary Returns the end date of the current streak
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns {number}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentStreakEnd: (dataset: Dataset, _renderInfo: RenderInfo): Moment => {
    let currentStreak = 0;
    let currentStreakEnd: Moment = null;
    if (dataset) {
      Array.from(dataset).every((p) => {
        if (p.value === null) return false;
        if (currentStreak === 0) currentStreakEnd = p.date;
        currentStreak++;
        return true;
      });
    }
    if (currentStreakEnd === null) throw new BrokenStreakError(Reason.NO_END);
    return currentStreakEnd;
  },

  /**
   * @summary Returns the number of days in between streaks
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns {number}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentBreaks: (dataset: Dataset, _renderInfo: RenderInfo): number =>
    Array.from(dataset).filter((p) => p.value === null).length, // TODO This is not the number of breaks, but the count of days between streaks. Is this correct?

  /**
   * @summary Returns the start date of the current break
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns {number}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentBreaksStart: (dataset: Dataset, _renderInfo: RenderInfo): Moment => {
    let breakStart: Moment = null;
    if (dataset) {
      const points = Array.from(dataset);
      points.forEach(
        (p, i) => (breakStart = i < points.length - 1 ? p.date : null)
      );
    }
    if (breakStart === null) throw new BrokenStreakError(Reason.NO_START);
    return breakStart;
  },

  /**
   * @summary Returns the end date of the current break
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns {number}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentBreaksEnd: (dataset: Dataset, _renderInfo: RenderInfo): Moment => {
    let breaks = 0;
    let breaksEnd: Moment = null;
    if (dataset) {
      const points = Array.from(dataset);
      points.forEach((p) => {
        if (p.value === null) {
          if (breaks === 0) breaksEnd = p.date;
          breaks++;
        }
      });
    }
    if (breaksEnd === null) throw new BrokenStreakError(Reason.NO_END);
    return breaksEnd;
  },

  /**
   * @summary Returns the average of all values in the dataset
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns {number}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  average: (dataset: Dataset, _renderInfo: RenderInfo): number => {
    const { nonNullValueCount, values } = dataset;
    if (!isDivisorValid(nonNullValueCount)) throw new DivisionByZeroError();
    const sum = d3.sum(values);
    return sum / nonNullValueCount;
  },

  /**
   * @summary Returns the median value in the dataset
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns {number}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  median: (dataset: Dataset, _renderInfo: RenderInfo): number =>
    d3.median(dataset.values),

  /**
   * @summary Returns the variance in the values in the dataset
   * @param {Dataset} dataset
   * @param {RenderInfo} _renderInfo Not used
   * @returns {number}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  variance: (dataset: Dataset, _renderInfo: RenderInfo): number =>
    d3.variance(dataset.values),
};
