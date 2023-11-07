import { Orientation, Position, Type } from '../enums';
import {
  ArgumentError,
  ArrayError,
  EmptySearchTargetError,
  InputMismatchError,
  KeyError,
  ParameterError,
  Reason,
  SearchTargetError,
  TrackerError,
  ValueError,
  YAxisArgumentError,
} from '../errors';
import {
  SearchType,
  SearchTypeValues,
  YAxisLocationValues,
} from '../models/enums';
import { Query } from '../models/query';
import { BarChart } from '../ui-components/chart/bar-chart.model';
import { CartesianChart } from '../ui-components/chart/cartesian-chart.model';
import { LineChart } from '../ui-components/chart/line-chart.model';
import { PieChart } from '../ui-components/chart/pie-chart.model';
import { BulletGraph } from '../ui-components/graph/bullet-graph.model';
import { HeatMap } from '../ui-components/heat-map/heat-map.model';
import { Month } from '../ui-components/month/month.model';
import { Summary } from '../ui-components/summary/summary.model';
import { StringUtils } from '../utils';
import * as helper from '../utils/helper';
import { isNullOrUndefined } from '../utils/object.utils';

/**
 * @summary Returns true if the searchType is valid
 * @param {string} searchType
 * @returns {boolean}
 */
export const isSearchTypeValid = (searchType: string): boolean =>
  SearchTypeValues.includes(searchType);

/**
 * @summary Returns true if the y-axis location is valid
 * @param {string} location
 * @returns {boolean}
 */
export const isYAxisLocationValid = (location: string): boolean =>
  YAxisLocationValues.includes(location);

// TODO Why does this function exist?
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const isColorValid = (_color: string): boolean => true;

/**
 * @summary Returns a string array from a comma delimited string
 * @description Does not split on escaped commas (ex: '\,')
 * @param {string} input
 * @returns {string[]}
 */
export const splitByComma = (input: string): string[] => {
  // let split = input.split(/(?<!\\),/); // --> lookbehind not support in Safari for now
  const dummy = '::::::tracker::::::';
  const temp = input.split('\\,').join(dummy);
  const split = temp.split(',');
  for (let ind = 0; ind < split.length; ind++)
    split[ind] = split[ind].split(dummy).join(',');
  return split;
};

/**
 * @summary Converts input into an array of strings or numbers
 * @param {object | number | string} input
 * @returns {string[] | number[]}
 */
export const convertInputToArray = (
  input: object | number | string
): string[] | number[] => {
  if (Array.isArray(input)) return input;
  if (String.isString(input)) return splitByComma(input);
  if (Number.isNumber(input)) return [input];
  return null;
};

// Input Properties

/**
 * @summary Returns a string array of search targets
 * @param {string | object} target
 * @returns {string[]}
 */
export const getSearchTargets = (target: string | object): string[] => {
  const targets: string[] = [];
  switch (typeof target) {
    case 'object':
      // Multiple targets
      if (target === null || !Array.isArray(target)) break;
      target.forEach((target: string) => {
        if (typeof target === 'string') {
          if (target === '') new EmptySearchTargetError();
          targets.push(target);
        }
      });
      break;

    case 'string':
      if (target === '') throw new EmptySearchTargetError();
      splitByComma(target).forEach((target) => {
        if (target.trim() === '') throw new EmptySearchTargetError();
        targets.push(target.trim());
      });
      break;

    default:
      throw new SearchTargetError(targets);
  }
  targets.forEach(
    (t, index) => (targets[index] = StringUtils.replaceImgTagByAlt(t))
  );
  return targets;
};

/**
 * @summary Returns an array of SearchType from the searchType input property
 * @param {string} searchType
 * @param {number} numTargets
 * @returns
 */
export const getSearchTypes = (
  searchType: string,
  numTargets: number
): SearchType[] => {
  const types = getStrings(
    'searchType',
    searchType,
    numTargets,
    '',
    isSearchTypeValid,
    false
  );
  const searchTypes = types.map((type) => {
    switch (type.toLowerCase()) {
      case 'tag':
        return SearchType.Tag;
      case 'frontmatter':
        return SearchType.Frontmatter;
      case 'wiki':
        return SearchType.Wiki;
      case 'wiki.link':
        return SearchType.WikiLink;
      case 'wiki.display':
        return SearchType.WikiDisplay;
      case 'text':
        return SearchType.Text;
      case 'dvfield':
        return SearchType.DataviewField;
      case 'table':
        return SearchType.Table;
      case 'filemeta':
        return SearchType.FileMeta;
      case 'task':
        return SearchType.Task;
      case 'task.all':
        return SearchType.Task;
      case 'task.done':
        return SearchType.TaskDone;
      case 'task.notdone':
        return SearchType.TaskNotDone;
    }
  });

  // -----
  // Currently, 'table' can't be used with other types
  if (
    searchTypes.includes(SearchType.Table) &&
    searchTypes.filter((t) => t !== SearchType.Table).length > 0
  )
    throw new TrackerError(
      "searchType 'table' doesn't work with other types for now"
    );
  // ------
  return searchTypes;
};

/**
 * @summary Returns an array of separators from the separator input property
 * @param separator
 * @param numTargets
 * @returns {string[]}
 */
export const getSeparators = (
  separator: string,
  numTargets: number
): string[] => {
  return getStrings(
    'separator',
    separator,
    numTargets,
    '', // set the default value later
    null,
    true
  );
};

/**
 * @summary Returns a Query array from the searchTarget input property
 * @param {string[]} searchTargets
 * @param {SearchType[]} searchTypes
 * @param {number[]} datasets
 * @param {string[]} separators
 * @returns {Query[]}
 */
export const getQueries = (
  searchTargets: string[],
  searchTypes: SearchType[],
  datasets: number[],
  separators: string[]
): Query[] => {
  const queries: Query[] = searchTargets.map((target, index) => {
    const query = new Query(index, searchTypes[index], target);
    query.separator = separators[index];
    if (datasets.includes(index)) query.usedAsXDataset = true;
    return query;
  });
  return queries;
};

/**
 * @summary Returns an array of custom dataset keys
 * @throws An error if the name matches a key in the dataset input property
 * @param {string[]} keys
 * @param {Query[]} queries
 * @returns {string[]}
 */
export const getCustomDatasetKeys = (
  keys: string[],
  queries: Query[]
): string[] => {
  const datasetKeys: string[] = [];
  keys.forEach((key) => {
    if (/^dataset[0-9]*$/.test(key)) {
      // Check the id of custom dataset is not duplicated
      const id = key.replace('dataset', '');
      const queryId = id === '' ? 0 : parseFloat(id);
      if (queries.some((q) => q.id === queryId))
        throw new TrackerError(`Duplicate dataset for key '${key}'`);
      datasetKeys.push(key);
    }
  });
  return datasetKeys;
};

/**
 * @summary Returns an object of output keys from the tracker code block
 * @param {string[]} keys
 * @returns {{ lineKeys: string[]; barKeys: string[]; pieKeys: string[]; summaryKeys: string[]; monthKeys: string[]; heatmapKeys: string[]; bulletKeys: string[]; }}
 */
export const getOutputKeys = (
  keys: string[]
): {
  lineKeys: string[];
  barKeys: string[];
  pieKeys: string[];
  summaryKeys: string[];
  monthKeys: string[];
  heatmapKeys: string[];
  bulletKeys: string[];
} => {
  const lineKeys: string[] = [];
  const barKeys: string[] = [];
  const pieKeys: string[] = [];
  const summaryKeys: string[] = [];
  const monthKeys: string[] = [];
  const heatmapKeys: string[] = [];
  const bulletKeys: string[] = [];
  keys.forEach((key) => {
    if (/^line[0-9]*$/.test(key)) lineKeys.push(key);
    if (/^bar[0-9]*$/.test(key)) barKeys.push(key);
    if (/^pie[0-9]*$/.test(key)) pieKeys.push(key);
    if (/^summary[0-9]*$/.test(key)) summaryKeys.push(key);
    if (/^bullet[0-9]*$/.test(key)) bulletKeys.push(key);
    if (/^month[0-9]*$/.test(key)) monthKeys.push(key);
    if (/^heatmap[0-9]*$/.test(key)) heatmapKeys.push(key);
  });
  return {
    lineKeys,
    barKeys,
    pieKeys,
    summaryKeys,
    monthKeys,
    heatmapKeys,
    bulletKeys,
  };
};

export const getMargins = (marginString: string) => {
  const [top, right, bottom, left, ...theRest] = getNumbers(
    'margin',
    marginString,
    {
      valueCount: 4,
      defaultValue: 10,
      allowInvalidValue: true,
    }
  );
  if (theRest.length > 0)
    console.warn(
      `'margin' accepts up to four values for top, right, bottom, and left`
    );
  return { top, right, bottom, left };
};

export const getLineCharts = (
  lineKeys: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yaml: any,
  searchTargets: string[]
): LineChart[] => {
  return lineKeys.map((key) => {
    const line = new LineChart();
    const yamlLine = yaml[key];

    const lineKeys = getKeys(line);
    const yamlKeys = getKeys(yamlLine);
    for (const key of yamlKeys) {
      if (!lineKeys.includes(key)) throw new KeyError(key);
    }

    setCartesianChartInfo(yamlLine, line);

    // lineColor
    line.lineColor = getStrings(
      'lineColor',
      yamlLine?.lineColor,
      searchTargets.length,
      '',
      isColorValid,
      true
    );

    // lineWidth
    line.lineWidth = getNumbers('lineWidth', yamlLine?.lineWidth, {
      valueCount: searchTargets.length,
      defaultValue: 1.5,
      allowInvalidValue: true,
    });

    // showLine
    line.showLine = getBooleans(
      'showLine',
      yamlLine?.showLine,
      searchTargets.length,
      true,
      true
    );

    // showPoint
    line.showPoint = getBooleans(
      'showPoint',
      yamlLine?.showPoint,
      searchTargets.length,
      true,
      true
    );

    // pointColor
    line.pointColor = getStrings(
      'pointColor',
      yamlLine?.pointColor,
      searchTargets.length,
      '#69b3a2',
      isColorValid,
      true
    );

    // pointBorderColor
    line.pointBorderColor = getStrings(
      'pointBorderColor',
      yamlLine?.pointBorderColor,
      searchTargets.length,
      '#69b3a2',
      isColorValid,
      true
    );

    // pointBorderWidth
    line.pointBorderWidth = getNumbers(
      'pointBorderWidth',
      yamlLine?.pointBorderWidth,
      {
        valueCount: searchTargets.length,
        defaultValue: 0.0,
        allowInvalidValue: true,
      }
    );

    // pointSize
    line.pointSize = getNumbers('pointSize', yamlLine?.pointSize, {
      valueCount: searchTargets.length,
      defaultValue: 3.0,
      allowInvalidValue: true,
    });

    // fillGap
    line.fillGap = getBooleans(
      'fillGap',
      yamlLine?.fillGap,
      searchTargets.length,
      false,
      true
    );

    // yAxisLocation
    line.yAxisLocation = getStrings(
      'yAxisLocation',
      yamlLine?.yAxisLocation,
      searchTargets.length,
      'left',
      isYAxisLocationValid,
      true
    );

    return line;
  });
};

export const getBarCharts = (
  barKeys: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yaml: any,
  searchTargets: string[]
): BarChart[] => {
  return barKeys.map((key) => {
    const barChart = new BarChart();
    const yamlBarChart = yaml[key];

    const barKeys = getKeys(barChart);
    const yamlKeys = getKeys(yamlBarChart);
    for (const key of yamlKeys) {
      if (!barKeys.includes(key)) throw new KeyError(key);
    }

    setCartesianChartInfo(yamlBarChart, barChart);

    // barColor
    barChart.barColor = getStrings(
      'barColor',
      yamlBarChart?.barColor,
      searchTargets.length,
      '',
      isColorValid,
      true
    );

    // yAxisLocation
    barChart.yAxisLocation = getStrings(
      'yAxisLocation',
      yamlBarChart?.yAxisLocation,
      searchTargets.length,
      'left',
      isYAxisLocationValid,
      true
    );

    return barChart;
  });
};

export const getPieCharts = (
  keys: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yaml: any
): PieChart[] => {
  return keys.map((key) => {
    const pie = new PieChart();
    const yamlPie = yaml[key];
    const pieKeys = getKeys(pie);
    const yamlKeys = getKeys(yamlPie);
    yamlKeys.forEach((key) => {
      if (!pieKeys.includes(key)) throw new KeyError(key);
    });

    // title
    pie.title = getString(yamlPie?.title, pie.title);

    // data
    const data = getStringArray('data', yamlPie?.data);

    pie.data = data;

    // dataColor
    pie.dataColor = getStrings(
      'dataColor',
      yamlPie?.dataColor,
      pie.data.length,
      null,
      isColorValid,
      true
    );

    // dataName
    pie.dataName = getStrings(
      'dataName',
      yamlPie?.dataName,
      pie.data.length,
      '',
      null,
      true
    );

    // label
    pie.label = getStrings(
      'label',
      yamlPie?.label,
      pie.data.length,
      '',
      null,
      true
    );

    // hideLabelLessThan
    if (typeof yamlPie?.hideLabelLessThan === 'number')
      pie.hideLabelLessThan = yamlPie.hideLabelLessThan;

    // extLabel
    pie.extLabel = getStrings(
      'extLabel',
      yamlPie?.extLabel,
      pie.data.length,
      '',
      null,
      true
    );

    // showExtLabelOnlyIfNoLabel
    if (typeof yamlPie?.showExtLabelOnlyIfNoLabel === 'boolean')
      pie.showExtLabelOnlyIfNoLabel = yamlPie.showExtLabelOnlyIfNoLabel;

    // ratioInnerRadius
    if (typeof yamlPie?.ratioInnerRadius === 'number')
      pie.ratioInnerRadius = yamlPie.ratioInnerRadius;

    // showLegend
    if (typeof yamlPie?.showLegend === 'boolean')
      pie.showLegend = yamlPie.showLegend;

    // legendPosition
    pie.legendPosition = getString(yamlPie?.legendPosition, 'right');

    // legendOrientation
    let defaultLegendOrientation = Orientation.HORIZONTAL;
    if (pie.legendPosition === 'top' || pie.legendPosition === 'bottom') {
      defaultLegendOrientation = Orientation.HORIZONTAL;
    } else if (
      pie.legendPosition === 'left' ||
      pie.legendPosition === 'right'
    ) {
      defaultLegendOrientation = Orientation.VERTICAL;
    } else {
      defaultLegendOrientation = Orientation.HORIZONTAL;
    }
    pie.legendOrientation = getString(
      yamlPie?.legendOrientation,
      defaultLegendOrientation
    );

    // legendBgColor
    pie.legendBgColor = getString(yamlPie?.legendBgColor, pie.legendBgColor);

    // legendBorderColor
    pie.legendBorderColor = getString(
      yamlPie?.legendBorderColor,
      pie.legendBorderColor
    );

    return pie;
  });
};

export const getSummaries = (
  keys: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yaml: any
): Summary[] => {
  return keys.map((key) => {
    const summary = new Summary();
    const yamlSummary = yaml[key];

    const summaryKeys = getKeys(summary);
    const yamlKeys = getKeys(yamlSummary);

    yamlKeys.forEach((key) => {
      if (!summaryKeys.includes(key)) throw new KeyError(key);
    });

    // template
    summary.template = getString(yamlSummary?.template, summary.template);

    // style
    summary.style = getString(yamlSummary?.style, summary.style);

    return summary;
  });
};

export const getMonths = (
  keys: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yaml: any,
  queries: Query[]
): Month[] => {
  return keys.map((key) => {
    const month = new Month();
    const yamlMonth = yaml[key];
    const monthKeys = getKeys(month);
    const yamlKeys = getKeys(yamlMonth);

    for (const key of yamlKeys)
      if (!monthKeys.includes(key)) throw new KeyError(key);

    // mode
    month.mode = getString(yamlMonth?.mode, month.mode);

    // dataset
    const dataset = getNumberArray('dataset', yamlMonth?.dataset);

    if (dataset.length === 0) for (const q of queries) dataset.push(q.id); // insert y dataset given

    month.dataset = dataset;
    const datasetCount = month.dataset.length;

    // startWeekOn
    month.startWeekOn = getString(yamlMonth?.startWeekOn, month.startWeekOn);

    // showCircle
    if (typeof yamlMonth?.showCircle === 'boolean')
      month.showCircle = yamlMonth.showCircle;

    // threshold
    month.threshold = getNumberArray('threshold', yamlMonth?.threshold);
    if (month.threshold.length === 0) {
      for (let indDataset = 0; indDataset < datasetCount; indDataset++)
        month.threshold.push(0);
    }
    if (month.threshold.length !== month.dataset.length)
      throw new TrackerError(
        'The number of inputs of threshold and dataset do not matched'
      );

    // yMin
    month.yMin = getNumberArray('yMin', yamlMonth?.yMin);
    if (month.yMin.length === 0) {
      for (let indDataset = 0; indDataset < datasetCount; indDataset++) {
        month.yMin.push(null);
      }
    }
    if (month.yMin.length !== month.dataset.length)
      throw new TrackerError(
        'The number of inputs of yMin and dataset not matched'
      );

    // yMax
    month.yMax = getNumberArray('yMax', yamlMonth?.yMax);
    if (month.yMax.length === 0) {
      for (let indDataset = 0; indDataset < datasetCount; indDataset++) {
        month.yMax.push(null);
      }
    }
    if (month.yMax.length !== month.dataset.length)
      throw new TrackerError(
        'The number of inputs of yMin and dataset not matched'
      );

    // color
    month.color = getString(yamlMonth?.color, month.color);

    // dimNotInMonth
    if (typeof yamlMonth?.dimNotInMonth === 'boolean')
      month.dimNotInMonth = yamlMonth.dimNotInMonth;

    // showStreak
    if (typeof yamlMonth?.showStreak === 'boolean')
      month.showStreak = yamlMonth.showStreak;

    // showTodayRing
    if (typeof yamlMonth?.showTodayRing === 'boolean')
      month.showTodayRing = yamlMonth.showTodayRing;

    // showSelectedValue
    if (typeof yamlMonth?.showSelectedValue === 'boolean')
      month.showSelectedValue = yamlMonth.showSelectedValue;

    // showSelectedRing
    if (typeof yamlMonth?.showSelectedRing === 'boolean')
      month.showSelectedRing = yamlMonth.showSelectedRing;

    // circleColor
    month.circleColor = getString(yamlMonth?.circleColor, month.circleColor);

    // circleColorByValue
    if (typeof yamlMonth?.circleColorByValue === 'boolean')
      month.circleColorByValue = yamlMonth.circleColorByValue;

    // headerYearColor
    month.headerYearColor = getString(
      yamlMonth?.headerYearColor,
      month.headerYearColor
    );

    // headerMonthColor
    month.headerMonthColor = getString(
      yamlMonth?.headerMonthColor,
      month.headerMonthColor
    );

    // dividingLineColor
    month.dividingLineColor = getString(
      yamlMonth?.dividingLineColor,
      month.dividingLineColor
    );

    // todayRingColor
    month.todayRingColor = getString(
      yamlMonth?.todayRingColor,
      month.todayRingColor
    );

    // selectedRingColor
    month.selectedRingColor = getString(
      yamlMonth?.selectedRingColor,
      month.selectedRingColor
    );

    // initMonth
    month.initMonth = getString(yamlMonth?.initMonth, month.initMonth);

    // showAnnotation
    if (typeof yamlMonth?.showAnnotation === 'boolean')
      month.showAnnotation = yamlMonth.showAnnotation;

    // annotation
    const annotation = getStringArray('annotation', yamlMonth?.annotation);

    month.annotation = annotation;
    if (month.annotation.length === 0) {
      for (let indDataset = 0; indDataset < datasetCount; indDataset++) {
        month.annotation.push(null);
      }
    }
    if (month.annotation.length !== month.dataset.length)
      throw new TrackerError(
        'The number of inputs for annotation and dataset should be the same'
      );

    // showAnnotationOfAllTargets
    if (typeof yamlMonth?.showAnnotationOfAllTargets === 'boolean')
      month.showAnnotationOfAllTargets = yamlMonth.showAnnotationOfAllTargets;

    return month;
  });
};

export const getHeatMaps = (
  keys: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yaml: any
) => {
  return keys.map((key) => {
    const heatmap = new HeatMap();
    const yamlHeatmap = yaml[key];

    const heatmapKeys = getKeys(heatmap);
    const yamlKeys = getKeys(yamlHeatmap);
    for (const key of yamlKeys)
      if (!heatmapKeys.includes(key)) throw new KeyError(key);

    return heatmap;
  });
};

export const getBulletGraphs = (
  keys: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yaml: any
) => {
  return keys.map((key) => {
    const bullet = new BulletGraph();
    const yamlBullet = yaml[key];
    const bulletKeys = getKeys(bullet);
    const yamlKeys = getKeys(yamlBullet);

    for (const key of yamlKeys)
      if (!bulletKeys.includes(key)) throw new KeyError(key);

    // title
    bullet.title = getString(yamlBullet?.title, bullet.title);

    // dataset
    bullet.dataset = getString(yamlBullet?.dataset, bullet.dataset);

    // orientation
    bullet.orientation = getString(yamlBullet?.orientation, bullet.orientation);

    // range
    const range = getNumberArray('range', yamlBullet?.range);

    // Check the value is monotonically increasing
    // Check the value is not negative
    if (range.length === 1 && range[0] < 0)
      throw new ArgumentError('Range value', Reason.IS_NEGATIVE);

    if (range.length < 1)
      throw new ArgumentError('Range value', Reason.IS_EMPTY);
    if (range[0] < 1)
      throw new ArgumentError('Range value', Reason.IS_NEGATIVE);

    for (let ind = 1; ind < range.length; ind++)
      if (range[ind] <= range[0])
        throw new ArgumentError(
          'Range values',
          Reason.NOT_MONOTONICALLY_INCREASING
        );

    bullet.range = range;
    const numRange = range.length;

    // range color
    bullet.rangeColor = getStrings(
      'rangeColor',
      yamlBullet?.rangeColor,
      numRange,
      '',
      isColorValid,
      true
    );

    // actual value, can possess template variable
    bullet.value = getString(yamlBullet?.value, bullet.value);

    // value unit
    bullet.valueUnit = getString(yamlBullet?.valueUnit, bullet.valueUnit);

    // value color
    bullet.valueColor = getString(yamlBullet?.valueColor, bullet.valueColor);

    // show mark
    if (typeof yamlBullet?.showMarker === 'boolean')
      bullet.showMarker = yamlBullet.showMarker;

    // mark value
    if (typeof yamlBullet?.markerValue === 'number')
      bullet.markerValue = yamlBullet.markerValue;

    // mark color
    bullet.markerColor = getString(yamlBullet?.markerColor, bullet.markerColor);

    return bullet;
  });
};

/**
 * @summary Returns a boolean array from the provided input property
 * @param {string} name
 * @param {any} input
 * @param {number} numDataset
 * @param {boolean} defaultValue
 * @param {boolean} allowNoValidValue
 * @returns {boolean[]}
 */
export const getBooleans = <T>(
  name: string,
  input: T,
  numDataset: number,
  defaultValue: boolean,
  allowNoValidValue: boolean
): Array<boolean> => {
  const booleans: boolean[] = [];
  let validValueCount = 0;

  while (numDataset > booleans.length) {
    booleans.push(defaultValue);
  }

  if (typeof input === 'undefined' || input === null) {
    // all defaultValue
  } else if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      if (input.length > numDataset) throw new InputMismatchError(name);
      if (input.length === 0) throw new ArrayError(name);

      for (let ind = 0; ind < booleans.length; ind++) {
        if (ind < input.length) {
          let curr = input[ind];
          let prev = null;
          if (ind > 0) {
            prev = input[ind - 1].trim();
          }
          if (typeof curr === 'string') {
            curr = curr.trim();
            if (curr === '')
              booleans[ind] = prev !== null ? prev : defaultValue;
            else throw new ValueError(name);
          } else if (typeof curr === 'boolean') {
            booleans[ind] = curr;
            validValueCount++;
          } else throw new ValueError(name);
        } else {
          // Exceeds the length of input, use prev value
          // Exceeds the length of input, use prev value
          booleans[ind] =
            validValueCount > 0 ? input[input.length - 1] : defaultValue;
        }
      }
    }
  } else if (typeof input === 'string') {
    const values = splitByComma(input);
    if (values.length > 1) {
      if (values.length > numDataset) throw new InputMismatchError(name);

      for (let ind = 0; ind < booleans.length; ind++) {
        if (ind < values.length) {
          const curr = values[ind].trim();

          const prev =
            ind > 0 ? StringUtils.toBool(values[ind - 1].trim()) : null;

          if (curr === '') {
            booleans[ind] = prev !== null ? prev : defaultValue;
          } else {
            const currBool = StringUtils.toBool(curr);
            if (currBool === null) throw new ValueError(name);
            booleans[ind] = currBool;
            validValueCount++;
          }
        } else {
          // Exceeds the length of input, use prev value
          const last = StringUtils.toBool(values[values.length - 1].trim());
          booleans[ind] =
            validValueCount > 0 && last !== null ? last : defaultValue;
        }
      }
    } else {
      if (input === '') {
        // all defaultValue
      } else {
        const inputBool = StringUtils.toBool(input);
        if (inputBool === null) throw new ValueError(name);
        booleans[0] = inputBool;
        validValueCount++;
        for (let ind = 1; ind < booleans.length; ind++)
          booleans[ind] = inputBool;
      }
    }
  } else if (typeof input === 'boolean') {
    booleans[0] = input;
    validValueCount++;
    for (let ind = 1; ind < booleans.length; ind++) booleans[ind] = input;
  } else throw new ValueError(name);

  if (!allowNoValidValue && validValueCount === 0) throw new ValueError(name);

  return booleans;
};

/**
 * @summary Returns the input value as a string
 * @param {T} input
 * @param {string} defaultValue
 * @returns {string}
 */
export const getString = <T extends string | number>(
  input: T,
  defaultValue: string
): string => {
  if (typeof input === 'string') {
    return helper.replaceImgTagByAlt(input);
  } else if (typeof input === 'number') {
    return input.toString();
  }
  return defaultValue;
};

/**
 * @summary Returns a string array from the provided input property
 * @param {string} name
 * @param {object | string | number} input
 * @param {number} numDataset
 * @param {string} defaultValue
 * @param {Function} validator
 * @param {boolean} allowNoValidValue
 * @returns
 */
export const getStrings = <T extends object | string | number>(
  name: string,
  input: T,
  datasetCount: number,
  defaultValue: string,

  // TODO Define signature type for validator
  // eslint-disable-next-line @typescript-eslint/ban-types
  validator: Function,
  allowNoValidValue: boolean
): string[] => {
  const array: Array<string> = [];
  let validValueCount = 0;

  while (datasetCount > array.length) array.push(defaultValue);

  if (typeof input === 'undefined' || input === null) {
    // all defaultValue
  } else if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      if (input.length > datasetCount) throw new InputMismatchError(name);
      if (input.length === 0) throw new ArrayError(name);

      array.forEach((_item, index) => {
        if (index < input.length) {
          let curr = input[index];
          const prev = index > 0 ? input[index - 1].trim() : null;

          if (typeof curr === 'string') {
            curr = curr.trim();
            if (curr === '') array[index] = prev !== null ? prev : defaultValue;
            else if (validator && !validator(curr)) throw new ValueError(name);
            else {
              array[index] = curr;
              validValueCount++;
            }
          } else throw new ValueError(name);
        } else {
          // Exceeds the length of input, use prev value
          array[index] =
            validValueCount > 0 ? input[input.length - 1].trim() : defaultValue;
        }
      });
    }
  } else if (typeof input === 'string') {
    const splitValues = splitByComma(input);
    if (splitValues.length > 1) {
      if (splitValues.length > datasetCount) throw new InputMismatchError(name);

      for (let ind = 0; ind < array.length; ind++) {
        if (ind < splitValues.length) {
          const curr = splitValues[ind].trim();
          let prev = null;
          if (ind > 0) prev = splitValues[ind - 1].trim();

          if (curr === '') array[ind] = prev !== null ? prev : defaultValue;
          else if (validator && !validator(curr)) throw new ValueError(name);
          else {
            array[ind] = curr;
            validValueCount++;
          }
        } else {
          // Exceeds the length of input, use prev value
          const last = splitValues[splitValues.length - 1].trim();
          array[ind] = validValueCount > 0 ? (array[ind] = last) : defaultValue;
        }
      }
    } else if (input !== '') {
      if (validator && !validator(input)) throw new ValueError(name);

      array[0] = input;
      validValueCount++;
      for (let ind = 1; ind < array.length; ind++) array[ind] = input;
    }
  } else if (typeof input === 'number') {
    const strNumber = input.toString();
    if (validator && !validator(strNumber)) throw new ValueError(name);

    array[0] = strNumber;
    validValueCount++;
    for (let ind = 1; ind < array.length; ind++) array[ind] = strNumber;
  } else throw new ValueError(name);

  if (!allowNoValidValue && validValueCount === 0) throw new ValueError(name);
  array.forEach(
    (elem, i) => (array[i] = StringUtils.replaceImgTagByAlt(array[i]))
  );

  return array;
};

export const getStringArray = (
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any
): string[] => {
  if (isNullOrUndefined(input)) return [];

  if (typeof input === 'object' && Array.isArray(input)) {
    return input.map((value) => {
      if (typeof value === 'string')
        return StringUtils.replaceImgTagByAlt(value.trim());
    });
  } else if (typeof input === 'string') {
    if (input.trim() === '') throw new ParameterError(name, Reason.IS_EMPTY);

    return splitByComma(input).map((value) => {
      if (typeof value === 'string')
        return StringUtils.replaceImgTagByAlt(value.trim());
    });
  }
  throw new ParameterError(name);
};

export interface IDataOptions {
  valueCount: number;
  defaultValue: number;
  allowInvalidValue: boolean;
}

/**
 * @summary Returns a number array from the provided input property
 * @param {string} name The name of the property in the tracker block
 * @param {any} input The value of the named property
 * @param {IDataOptions} options
 * @returns {number[]}
 */
export function getNumbers(
  name: string,
  input: object | number | string,
  options: IDataOptions
): Array<number> {
  const numbers: number[] = [];
  let validValueCount = 0;
  const { valueCount, defaultValue, allowInvalidValue } = options;
  while (valueCount > numbers.length) numbers.push(defaultValue);

  if (typeof input === 'undefined' || input === null) {
    // all defaultValue
  } else if (typeof input === 'object' && input !== null) {
    if (Array.isArray(input)) {
      if (input.length > valueCount) throw new InputMismatchError(name);
      if (input.length === 0) throw new ArrayError(name);

      for (let ind = 0; ind < numbers.length; ind++) {
        if (ind < input.length) {
          const curr = input[ind];
          let prev = null;
          if (ind > 0) prev = input[ind - 1].trim();
          if (typeof curr === 'string') {
            if (curr.trim() === '')
              numbers[ind] = prev != null ? prev : defaultValue;
            else throw new ValueError(name);
          } else if (typeof curr === 'number') {
            numbers[ind] = curr;
            validValueCount++;
          } else throw new ValueError(name);
        } else {
          // Exceeds the length of input, use prev value
          const last = input[input.length - 1];
          if (validValueCount > 0) numbers[ind] = last;
          else numbers[ind] = defaultValue;
        }
      }
    }
  } else if (typeof input === 'string') {
    const values = splitByComma(input);
    if (values.length > 1) {
      if (values.length > valueCount) throw new InputMismatchError(name);

      for (let ind = 0; ind < numbers.length; ind++) {
        if (ind < values.length) {
          const curr = values[ind].trim();
          let prev = null;
          if (ind > 0) {
            prev = helper.parseFloatFromAny(values[ind - 1].trim()).value;
          }
          if (curr === '') {
            numbers[ind] =
              prev !== null && Number.isNumber(prev) ? prev : defaultValue;
          } else {
            const currNum = helper.parseFloatFromAny(curr).value;
            if (currNum !== null) {
              numbers[ind] = currNum;
              validValueCount++;
            } else throw new ValueError(name);
          }
        } else {
          // Exceeds the length of input, use prev value
          const last = helper.parseFloatFromAny(
            values[input.length - 1].trim()
          ).value;
          numbers[ind] =
            validValueCount > 0 && last !== null ? last : defaultValue;
        }
      }
    } else if (input !== '') {
      const parsed = helper.parseFloatFromAny(input).value;
      if (parsed === null) throw new ValueError(name);
      numbers[0] = parsed;
      validValueCount++;
      for (let ind = 1; ind < numbers.length; ind++) numbers[ind] = parsed;
    }
  } else if (typeof input === 'number') {
    if (!Number.isNumber(input)) throw new ValueError(name);
    numbers[0] = input;
    validValueCount++;
    for (let ind = 1; ind < numbers.length; ind++) numbers[ind] = input;
  } else throw new ValueError(name);

  if (!allowInvalidValue && validValueCount === 0)
    throw new TrackerError(`No valid input for ${name}`);

  return numbers;
}

/**
 * @summary Returns a number array from the provided input property
 * @param {string} name
 * @param {object | number | string} input
 * @returns {number[]}
 */
export function getNumberArray(
  name: string,
  input: object | number | string
): number[] {
  if (isNullOrUndefined(input)) return [];

  const elements = convertInputToArray(input);
  if (!elements) {
    const args = [name, 'values must be an array, number, or string'] as const;
    throw new ParameterError(...args);
  }

  return elements.map((elem) => {
    if (String.isString(elem)) return parseFloat(elem);
    if (Number.isNumber(elem)) return elem;
    throw new ParameterError(name, Reason.IS_NOT_NUMBER);
  });
}

export const setCartesianChartInfo = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yaml: any,
  chart: CartesianChart
): void => {
  // single value, use default value if no value from YAML
  const { BOOLEAN, STRING } = Type;
  if (yaml) {
    // title
    chart.title = getString(yaml.title, chart.title);

    // xAxisLabel
    chart.xAxisLabel = getString(yaml.xAxisLabel, chart.xAxisLabel);

    // xAxisColor
    chart.xAxisColor = getString(yaml.xAxisColor, chart.xAxisColor);

    // xAxisLabelColor
    chart.xAxisLabelColor = getString(
      yaml.xAxisLabelColor,
      chart.xAxisLabelColor
    );
    const { TOP, RIGHT, BOTTOM, LEFT } = Position;
    const { HORIZONTAL, VERTICAL } = Orientation;
    // allow inspect data
    if (typeof yaml.allowInspectData === BOOLEAN)
      chart.allowInspectData = yaml.allowInspectData;

    // show legend
    if (typeof yaml.showLegend === BOOLEAN) chart.showLegend = yaml.showLegend;

    // legend position
    if (typeof yaml.legendPosition === STRING)
      chart.legendPosition = yaml.legendPosition;
    else chart.legendPosition = BOTTOM;

    // legend orientation
    if (typeof yaml.legendOrientation === STRING) {
      chart.legendOrientation = yaml.legendOrientation;
    } else {
      if (chart.legendPosition === TOP || chart.legendPosition === BOTTOM)
        chart.legendOrientation = HORIZONTAL;
      else if (chart.legendPosition === LEFT || chart.legendPosition === RIGHT)
        chart.legendOrientation = VERTICAL;
      else chart.legendOrientation = HORIZONTAL;
    }
    // legendBgColor
    chart.legendBgColor = getString(yaml.legendBgColor, chart.legendBgColor);

    // legendBorderColor
    chart.legendBorderColor = getString(
      yaml.legendBorderColor,
      chart.legendBorderColor
    );
  }

  // yAxisLabel
  const yAxisLabel = getStrings(
    'yAxisLabel',
    yaml?.yAxisLabel,
    2,
    'Value',
    null,
    true
  );
  if (yAxisLabel.length > 2) throw new YAxisArgumentError('yAxisLabel');
  chart.yAxisLabel = yAxisLabel;

  // yAxisColor
  const yAxisColor = getStrings(
    'yAxisColor',
    yaml?.yAxisColor,
    2,
    '',
    isColorValid,
    true
  );
  if (yAxisColor.length > 2) throw new YAxisArgumentError('yAxisLabel');
  chart.yAxisColor = yAxisColor;

  // yAxisLabelColor
  const yAxisLabelColor = getStrings(
    'yAxisLabelColor',
    yaml?.yAxisLabelColor,
    2,
    '',
    isColorValid,
    true
  );
  if (yAxisLabelColor.length > 2)
    throw new YAxisArgumentError('yAxisLabelColor');
  chart.yAxisLabelColor = yAxisLabelColor;

  // yAxisUnit
  const yAxisUnit = getStrings('yAxisUnit', yaml?.yAxisUnit, 2, '', null, true);
  if (yAxisUnit.length > 2) throw new YAxisArgumentError('yAxisUnit');
  chart.yAxisUnit = yAxisUnit;

  // xAxisTickInterval
  chart.xAxisTickInterval = getString(
    yaml?.xAxisTickInterval,
    chart.xAxisTickInterval
  );

  // yAxisTickInterval
  const yAxisTickInterval = getStrings(
    'yAxisTickInterval',
    yaml?.yAxisTickInterval,
    2,
    null,
    null,
    true
  );
  if (yAxisTickInterval.length > 2)
    throw new YAxisArgumentError('yAxisTickInterval');
  chart.yAxisTickInterval = yAxisTickInterval;

  // xAxisTickLabelFormat
  chart.xAxisTickLabelFormat = getString(
    yaml?.xAxisTickLabelFormat,
    chart.xAxisTickLabelFormat
  );

  // yAxisTickLabelFormat
  const yAxisTickLabelFormat = getStrings(
    'yAxisTickLabelFormat',
    yaml?.yAxisTickLabelFormat,
    2,
    null,
    null,
    true
  );
  if (yAxisTickLabelFormat.length > 2)
    throw new YAxisArgumentError('yAxisTickLabelFormat');
  chart.yAxisTickLabelFormat = yAxisTickLabelFormat;

  // yMin
  const yMin = getNumbers('yMin', yaml?.yMin, {
    valueCount: 2,
    defaultValue: null,
    allowInvalidValue: true,
  });
  if (yMin.length > 2) throw new YAxisArgumentError('yMin');
  chart.yMin = yMin;

  // yMax
  const yMax = getNumbers('yMax', yaml?.yMax, {
    valueCount: 2,
    defaultValue: null,
    allowInvalidValue: true,
  });
  if (yMax.length > 2) throw new YAxisArgumentError('yMax');
  chart.yMax = yMax;

  // reverseYAxis
  const reverseYAxis = getBooleans(
    'reverseYAxis',
    yaml?.reverseYAxis,
    2,
    false,
    true
  );
  if (reverseYAxis.length > 2) throw new YAxisArgumentError('reverseYAxis');
  chart.reverseYAxis = reverseYAxis;
};

export const getKeys = (obj: object): string[] => {
  if (obj === null) return [];
  return Object.keys(obj).map((key) => key.toString());
};
