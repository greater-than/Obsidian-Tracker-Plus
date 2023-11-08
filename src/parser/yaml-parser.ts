import { TFolder, normalizePath, parseYaml } from 'obsidian';
import {
  KeyError,
  ParameterError,
  RangeError,
  Reason,
  TrackerError,
  YamlParseError,
} from '../errors';
import Tracker from '../main';
import { AspectRatio } from '../models/aspect-ratio';
import { CustomDatasetInfo } from '../models/custom-dataset';
import { RenderInfo } from '../models/render-info';
import * as helper from '../utils/helper';
import {
  getBarCharts,
  getBulletGraphs,
  getCustomDatasetKeys,
  getHeatMaps,
  getLineCharts,
  getMargins,
  getMonthViews,
  getOutputKeys,
  getPieCharts,
  getQueries,
  getSearchTargets,
  getSearchTypes,
  getSeparators,
  getSummaries,
} from './yaml-parser.helper';
import {
  getBooleans,
  getKeys,
  getNumbers,
  getString,
  getStringArray,
  getStrings,
  validateKeys,
} from './yaml-parser.utils';

// TODO Breakup this function
export const getRenderInfo = (
  yamlText: string,
  plugin: Tracker
): RenderInfo | string => {
  let yaml;

  try {
    yaml = parseYaml(yamlText);
    if (!yaml) throw new Error();
  } catch (err) {
    throw new YamlParseError(err.message);
  }
  const keys = getKeys(yaml);

  // search targets
  if (!keys.includes('searchTarget'))
    throw new ParameterError('searchTarget', Reason.NOT_FOUND_IN_YAML);
  const searchTargets = getSearchTargets(yaml.searchTarget);

  // search types
  if (!keys.includes('searchType'))
    throw new ParameterError('searchType', Reason.NOT_FOUND_IN_YAML);
  const searchTypes = getSearchTypes(yaml.searchType, searchTargets.length);

  // separators
  const separators = getSeparators(yaml.separator, searchTargets.length);
  const multiValueSeparators = separators.map((s) =>
    s === 'comma' || s === '\\,' ? ',' : s
  );

  // xDataset
  const xDataset = getNumbers('xDataset', yaml.xDataset, {
    valueCount: searchTargets.length,
    defaultValue: -1,
    allowInvalidValue: true,
  }).map((d: number) => (d < 0 || d >= searchTargets.length ? -1 : d));

  // queries
  const queries = getQueries(
    searchTargets,
    searchTypes,
    xDataset,
    multiValueSeparators
  );

  // renderInfo
  const renderInfo = new RenderInfo(queries);
  renderInfo.xDataset = xDataset;

  // component keys
  const componentKeys = getOutputKeys(keys);
  const {
    lineKeys,
    barKeys,
    pieKeys,
    summaryKeys,
    monthKeys,
    heatmapKeys,
    bulletKeys,
  } = componentKeys;

  // custom dataset keys
  const customDatasetKeys = getCustomDatasetKeys(keys, queries);

  // additional keys
  const allowedKeys = ['searchType', 'searchTarget', 'separator'];
  const allKeys = [
    ...allowedKeys,
    ...lineKeys,
    ...barKeys,
    ...pieKeys,
    ...summaryKeys,
    ...bulletKeys,
    ...monthKeys,
    ...heatmapKeys,
    ...customDatasetKeys,
  ];

  const renderInfoKeys = getKeys(renderInfo);

  validateKeys(keys, renderInfoKeys, allKeys);

  const hasOutput =
    lineKeys.length +
      barKeys.length +
      pieKeys.length +
      summaryKeys.length +
      bulletKeys.length +
      monthKeys.length +
      heatmapKeys.length >
    0;

  if (!hasOutput) {
    throw new TrackerError(
      'No output defined, must have at least one: line, bar, pie, month, bullet, or summary.'
    );
  }

  // root folder to search
  renderInfo.folder = getString(yaml.folder, plugin.settings.folder);
  if (renderInfo.folder.trim() === '') {
    renderInfo.folder = plugin.settings.folder;
  }

  const abstractFolder = plugin.app.vault.getAbstractFileByPath(
    normalizePath(renderInfo.folder)
  );
  if (!abstractFolder || !(abstractFolder instanceof TFolder)) {
    throw new TrackerError(`Folder '${renderInfo.folder}' doesn't exist`);
  }

  // files
  if (typeof yaml.file === 'string')
    renderInfo.file = getStringArray('file', yaml.file);

  // specified files only
  if (typeof yaml.specifiedFilesOnly === 'boolean')
    renderInfo.specifiedFilesOnly = yaml.specifiedFilesOnly;

  // files contain linked files
  if (typeof yaml.fileContainsLinkedFiles === 'string') {
    renderInfo.fileContainsLinkedFiles = getStringArray(
      'fileContainsLinkedFiles',
      yaml.fileContainsLinkedFiles
    );
  }

  // file multiplier after link
  renderInfo.fileMultiplierAfterLink = getString(
    yaml?.fileMultiplierAfterLink,
    renderInfo.fileMultiplierAfterLink
  );

  // date format
  renderInfo.dateFormat =
    typeof yaml.dateFormat === 'string' && yaml.dateformat !== ''
      ? yaml.dateFormat
      : plugin.settings.dateFormat;

  // date format prefix
  renderInfo.dateFormatPrefix = getString(
    yaml?.dateFormatPrefix,
    renderInfo.dateFormatPrefix
  );

  // date format suffix
  renderInfo.dateFormatSuffix = getString(
    yaml?.dateFormatSuffix,
    renderInfo.dateFormatSuffix
  );

  // start & end date
  if (typeof yaml.startDate === 'string') {
    if (/^([\-]?[0-9]+[\.][0-9]+|[\-]?[0-9]+)m$/.test(yaml.startDate)) {
      throw new TrackerError(
        `'m' for 'minute' is too small for 'startDate', please use 'd' for 'day' or 'M' for month`
      );
    }
    const strStartDate = helper.getDateStringFromInputString(
      yaml.startDate,
      renderInfo.dateFormatPrefix,
      renderInfo.dateFormatSuffix
    );

    // relative date
    let startDate = null;
    let isStartDateValid = false;
    startDate = helper.getDateByDurationToToday(
      strStartDate,
      renderInfo.dateFormat
    );

    if (startDate) {
      isStartDateValid = true;
    } else {
      startDate = helper.strToDate(strStartDate, renderInfo.dateFormat);
      if (startDate.isValid()) {
        isStartDateValid = true;
      }
    }

    if (!isStartDateValid || startDate === null)
      throw new TrackerError(
        `Invalid date, the format of startDate may not match your dateFormat '${renderInfo.dateFormat}'`
      );

    renderInfo.startDate = startDate;
  }

  if (typeof yaml.endDate === 'string') {
    if (/^([\-]?[0-9]+[\.][0-9]+|[\-]?[0-9]+)m$/.test(yaml.endDate)) {
      throw new TrackerError(
        `'m' for 'minute' is too small for 'endDate', please use 'd' for 'day' or 'M' for month`
      );
    }
    const strEndDate = helper.getDateStringFromInputString(
      yaml.endDate,
      renderInfo.dateFormatPrefix,
      renderInfo.dateFormatSuffix
    );

    let endDate = null;
    let isEndDateValid = false;
    endDate = helper.getDateByDurationToToday(
      strEndDate,
      renderInfo.dateFormat
    );
    if (endDate) {
      isEndDateValid = true;
    } else {
      endDate = helper.strToDate(strEndDate, renderInfo.dateFormat);
      if (endDate.isValid()) {
        isEndDateValid = true;
      }
    }

    if (!isEndDateValid || endDate === null)
      throw new TrackerError(
        `Invalid date, the format of endDate may not match your dateFormat '${renderInfo.dateFormat}'`
      );

    renderInfo.endDate = endDate;
  }
  if (
    renderInfo.startDate !== null &&
    renderInfo.startDate.isValid() &&
    renderInfo.endDate !== null &&
    renderInfo.endDate.isValid()
  ) {
    // Make sure endDate > startDate
    if (renderInfo.endDate < renderInfo.startDate)
      throw new RangeError('startDate', Reason.IS_GREATER_THAN, 'endDate');
  }

  // dataset names (need xDataset to set default name)
  const datasetNames = getStrings('datasetName', yaml.datasetName, null, {
    valueCount: searchTargets.length,
    defaultValue: 'untitled',
    allowInvalidValue: true,
  });

  // rename untitled datasets
  let index = 0;
  for (let i = 0; i < datasetNames.length; i++) {
    if (renderInfo.xDataset.includes(i)) continue;
    if (datasetNames[i] === 'untitled') {
      datasetNames[i] = 'untitled' + index.toString();
      index++;
    }
  }

  // check duplicated names
  if (new Set(datasetNames).size !== datasetNames.length)
    throw new TrackerError('Not enough dataset names or duplicated names');

  renderInfo.datasetName = datasetNames;

  // constant value
  renderInfo.constValue = getNumbers('constValue', yaml.constValue, {
    valueCount: searchTargets.length,
    defaultValue: 1.0,
    allowInvalidValue: true,
  });

  // ignore attached value
  renderInfo.ignoreAttachedValue = getBooleans(
    'ignoreAttachedValue',
    yaml.ignoreAttachedValue,
    searchTargets.length,
    false,
    true
  );

  // ignore zero value
  renderInfo.ignoreZeroValue = getBooleans(
    'ignoreZeroValue',
    yaml.ignoreZeroValue,
    searchTargets.length,
    false,
    true
  );

  // accum
  renderInfo.accum = getBooleans(
    'accum',
    yaml.accum,
    searchTargets.length,
    false,
    true
  );

  // penalty
  renderInfo.penalty = getNumbers('penalty', yaml.penalty, {
    valueCount: searchTargets.length,
    defaultValue: null,
    allowInvalidValue: true,
  });

  // value shift
  renderInfo.valueShift = getNumbers('valueShift', yaml.valueShift, {
    valueCount: searchTargets.length,
    defaultValue: 0,
    allowInvalidValue: true,
  });

  // shift only value larger than
  renderInfo.shiftOnlyValueLargerThan = getNumbers(
    'shiftOnlyValueLargerThan',
    yaml.shiftOnlyValueLargerThan,
    {
      valueCount: searchTargets.length,
      defaultValue: null,
      allowInvalidValue: true,
    }
  );

  // text value map
  if (typeof yaml.textValueMap !== 'undefined') {
    for (const key of getKeys(yaml.textValueMap)) {
      const text = key.trim();
      renderInfo.textValueMap[text] = yaml.textValueMap[text];
    }
  }

  // fixed scale
  if (typeof yaml.fixedScale === 'number')
    renderInfo.fixedScale = yaml.fixedScale;

  // fit panel width
  if (typeof yaml.fitPanelWidth === 'boolean')
    renderInfo.fitPanelWidth = yaml.fitPanelWidth;

  // aspect ratio
  if (typeof yaml.aspectRatio === 'string') {
    const ratioRegEx = /([0-9]*):([0-9]*)/;
    let parts = yaml.aspectRatio.match(ratioRegEx);
    parts.shift();
    parts = parts.map((i: string) => parseInt(i, 10));
    if (parts.length == 2) {
      renderInfo.aspectRatio = new AspectRatio(parts[0], parts[1]);
      renderInfo.dataAreaSize = renderInfo.aspectRatio.recalculateSize(
        renderInfo.dataAreaSize
      );
    }
  }

  // margins
  renderInfo.margin = getMargins(yaml.margin);

  // custom datasets
  for (const id of customDatasetKeys) {
    const customDataset = new CustomDatasetInfo();
    const yamlCustomDataset = yaml[id];

    const datasetKeys = getKeys(customDataset);
    const yamlKeys = getKeys(yamlCustomDataset);
    for (const key of yamlKeys)
      if (!datasetKeys.includes(key)) throw new KeyError(key);

    // id
    customDataset.id = id === '' ? 0 : parseFloat(id.replace('dataset', ''));

    // name
    customDataset.name = getString(yamlCustomDataset?.name, customDataset.name);

    // xData
    customDataset.xData = getStringArray('xData', yamlCustomDataset?.xData);

    // yData
    const yData = getStringArray('yData', yamlCustomDataset?.yData);

    customDataset.yData = yData;
    if (customDataset.yData.length !== customDataset.xData.length)
      throw new TrackerError(
        'Number of elements in xData and yData do not match'
      );

    renderInfo.customDataset.push(customDataset);
  }

  // ------
  // Output

  // line charts
  if (lineKeys.length > 0)
    renderInfo.line = getLineCharts(lineKeys, yaml, searchTargets);

  // bar charts
  if (barKeys.length > 0)
    renderInfo.bar = getBarCharts(barKeys, yaml, searchTargets);

  // pie charts
  if (pieKeys.length > 0) renderInfo.pie = getPieCharts(pieKeys, yaml);

  // summaries
  if (summaryKeys.length > 0)
    renderInfo.summary = getSummaries(summaryKeys, yaml);

  // month views
  if (monthKeys.length > 0)
    renderInfo.month = getMonthViews(monthKeys, yaml, queries);

  // heat maps
  if (heatmapKeys.length > 0)
    renderInfo.heatmap = getHeatMaps(heatmapKeys, yaml);

  // bullet graphs
  if (bulletKeys.length > 0)
    renderInfo.bullet = getBulletGraphs(bulletKeys, yaml);

  return renderInfo;
};
