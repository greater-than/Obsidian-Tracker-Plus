import { TFolder, normalizePath, parseYaml } from 'obsidian';
import { Orientation } from 'src/enums';
import {
  EmptySearchTargetError,
  InvalidDatasetKeyError,
  InvalidParameterError,
  InvalidSearchTargetError,
  Reason,
  TrackerError,
  YamlParseError,
} from '../errors';
import Tracker from '../main';
import { AspectRatio } from '../models/aspect-ratio';
import { CustomDataset } from '../models/custom-dataset';
import { SearchType } from '../models/enums';
import { Margin } from '../models/margin';
import { Query } from '../models/query';
import { RenderInfo } from '../models/render-info';
import { BulletGraph } from '../ui-components/bullet-graph/bullet-graph.model';
import { BarChart } from '../ui-components/chart/bar-chart.model';
import { LineChart } from '../ui-components/chart/line-chart.model';
import { Heatmap } from '../ui-components/heatmap/heatmap.model';
import { Month } from '../ui-components/month/month.model';
import { PieChart } from '../ui-components/pie-chart/pie-chart.model';
import { Summary } from '../ui-components/summary/summary.model';
import { DateTimeUtils, StringUtils } from '../utils';
import {
  getBoolArrayFromInput,
  getKeys,
  getNumberArray,
  getNumberArrayFromInput,
  getStringArray,
  getStringArrayFromInput,
  getStringFromInput,
  isColorValid,
  isSearchTypeValid,
  isYAxisLocationValid,
  parseCommonChartInfo,
  splitByComma,
  validateYamlKeys,
} from './helper';

// TODO Breakup this function
export const getRenderInfoFromYaml = (
  yamlText: string,
  plugin: Tracker
): RenderInfo => {
  let yaml;

  try {
    yaml = parseYaml(yamlText);
  } catch (err) {
    throw new YamlParseError(err.message);
  }
  if (!yaml) throw new YamlParseError();

  const yamlKeys = getKeys(yaml);

  // Search target
  if (!yamlKeys.includes('searchTarget'))
    throw new InvalidParameterError('searchTarget', Reason.NOT_FOUND_IN_YAML);

  const searchTarget: Array<string> = [];
  if (
    typeof yaml.searchTarget === 'object' &&
    yaml.searchTarget !== null &&
    Array.isArray(yaml.searchTarget)
  ) {
    for (const target of yaml.searchTarget) {
      if (typeof target === 'string') {
        if (target !== '') searchTarget.push(target);
        else throw new EmptySearchTargetError();
      }
    }
  } else if (typeof yaml.searchTarget === 'string') {
    const splitInput = splitByComma(yaml.searchTarget);
    if (splitInput.length > 1) {
      for (let piece of splitInput) {
        piece = piece.trim();
        if (piece !== '') searchTarget.push(piece);
        else throw new EmptySearchTargetError();
      }
    } else if (yaml.searchTarget === '') {
      throw new EmptySearchTargetError();
    } else {
      searchTarget.push(yaml.searchTarget);
    }
  } else throw new InvalidSearchTargetError(searchTarget);

  for (let ind = 0; ind < searchTarget.length; ind++)
    searchTarget[ind] = StringUtils.replaceImgTagByAlt(searchTarget[ind]);

  const numDatasets = searchTarget.length;

  // Search type
  if (!yamlKeys.includes('searchType'))
    throw new TrackerError("Parameter 'searchType' not found in YAML");

  const searchType: Array<SearchType> = [];
  const searchTypes = getStringArrayFromInput(
    'searchType',
    yaml.searchType,
    numDatasets,
    '',
    isSearchTypeValid,
    false
  );

  for (const strType of searchTypes) {
    switch (strType.toLowerCase()) {
      case 'tag':
        searchType.push(SearchType.Tag);
        break;
      case 'frontmatter':
        searchType.push(SearchType.Frontmatter);
        break;
      case 'wiki':
        searchType.push(SearchType.Wiki);
        break;
      case 'wiki.link':
        searchType.push(SearchType.WikiLink);
        break;
      case 'wiki.display':
        searchType.push(SearchType.WikiDisplay);
        break;
      case 'text':
        searchType.push(SearchType.Text);
        break;
      case 'dvfield':
        searchType.push(SearchType.DvField);
        break;
      case 'table':
        searchType.push(SearchType.Table);
        break;
      case 'filemeta':
        searchType.push(SearchType.FileMeta);
        break;
      case 'task':
        searchType.push(SearchType.Task);
        break;
      case 'task.all':
        searchType.push(SearchType.Task);
        break;
      case 'task.done':
        searchType.push(SearchType.TaskDone);
        break;
      case 'task.notdone':
        searchType.push(SearchType.TaskNotDone);
        break;
    }
  }
  // Currently, 'table' can't be used with other types
  if (
    searchType.includes(SearchType.Table) &&
    searchType.filter((t) => t !== SearchType.Table).length > 0
  ) {
    throw new TrackerError(
      "searchType 'table' doesn't work with other types for now"
    );
  }

  // separator
  let multipleValueSeparator: Array<string> = [];
  const separators = getStringArrayFromInput(
    'separator',
    yaml.separator,
    numDatasets,
    '', // set the default value later
    null,
    true
  );

  multipleValueSeparator = separators.map((sep) => {
    return sep === 'comma' || sep === '\\,' ? ',' : sep;
  });

  // xDataset
  const datasets = getNumberArrayFromInput(
    'xDataset',
    yaml.xDataset,
    numDatasets,
    -1,
    true
  );

  const xDataset = datasets.map((d: number) =>
    d < 0 || d >= numDatasets ? -1 : d
  ); // assign this to renderInfo later

  // Create queries
  const queries: Array<Query> = [];
  for (let ind = 0; ind < searchTarget.length; ind++) {
    const query = new Query(queries.length, searchType[ind], searchTarget[ind]);
    query.setSeparator(multipleValueSeparator[ind]);
    if (xDataset.includes(ind)) query.usedAsXDataset = true;
    queries.push(query);
  }

  // Create graph info
  const renderInfo = new RenderInfo(queries);
  const renderInfoKeys = getKeys(renderInfo);
  const allowedKeys = ['searchType', 'searchTarget', 'separator'];
  const allKeys = [...allowedKeys];
  const lineKeys = [];
  const barKeys = [];
  const pieKeys = [];
  const summaryKeys = [];
  const monthKeys = [];
  const heatmapKeys = [];
  const bulletKeys = [];
  for (const key of yamlKeys) {
    if (/^line[0-9]*$/.test(key)) {
      lineKeys.push(key);
      allKeys.push(key);
    }
    if (/^bar[0-9]*$/.test(key)) {
      barKeys.push(key);
      allKeys.push(key);
    }
    if (/^pie[0-9]*$/.test(key)) {
      pieKeys.push(key);
      allKeys.push(key);
    }
    if (/^summary[0-9]*$/.test(key)) {
      summaryKeys.push(key);
      allKeys.push(key);
    }
    if (/^bullet[0-9]*$/.test(key)) {
      bulletKeys.push(key);
      allKeys.push(key);
    }
    if (/^month[0-9]*$/.test(key)) {
      monthKeys.push(key);
      allKeys.push(key);
    }
    if (/^heatmap[0-9]*$/.test(key)) {
      heatmapKeys.push(key);
      allKeys.push(key);
    }
  }
  // Custom dataset
  const customDatasetKeys = [];
  for (const key of yamlKeys) {
    if (/^dataset[0-9]*$/.test(key)) {
      // Check the id of custom dataset is not duplicated
      let customDatasetId = -1;
      const strCustomDatasetId = key.replace('dataset', '');
      if (strCustomDatasetId === '') {
        customDatasetId = 0;
      } else {
        customDatasetId = parseFloat(strCustomDatasetId);
      }

      if (queries.some((q) => q.id === customDatasetId))
        throw new TrackerError(`Duplicated dataset id for key '${key}'`);

      customDatasetKeys.push(key);
      allKeys.push(key);
    }
  }
  try {
    validateYamlKeys(yamlKeys, renderInfoKeys, allKeys);
  } catch (error) {
    console.log('ERROR!!');
    return error.message;
  }

  if (allKeys.length <= allowedKeys.length) {
    throw new TrackerError(
      'No output parameter provided, please place line, bar, pie, month, bullet, or summary.'
    );
  }

  // Root folder to search
  renderInfo.folder = getStringFromInput(yaml?.folder, plugin.settings.folder);
  if (renderInfo.folder.trim() === '') {
    renderInfo.folder = plugin.settings.folder;
  }

  const abstractFolder = plugin.app.vault.getAbstractFileByPath(
    normalizePath(renderInfo.folder)
  );
  if (!abstractFolder || !(abstractFolder instanceof TFolder))
    throw new TrackerError(`Folder '${renderInfo.folder}' doesn't exist`);

  // file
  if (typeof yaml.file === 'string') {
    const files = getStringArray('file', yaml.file);
    renderInfo.file = files;
  }

  // specifiedFilesOnly
  if (typeof yaml.specifiedFilesOnly === 'boolean') {
    renderInfo.specifiedFilesOnly = yaml.specifiedFilesOnly;
  }

  // fileContainsLinkedFiles
  if (typeof yaml.fileContainsLinkedFiles === 'string') {
    const files = getStringArray(
      'fileContainsLinkedFiles',
      yaml.fileContainsLinkedFiles
    );
    renderInfo.fileContainsLinkedFiles = files;
  }

  // fileMultiplierAfterLink
  renderInfo.fileMultiplierAfterLink = getStringFromInput(
    yaml?.fileMultiplierAfterLink,
    renderInfo.fileMultiplierAfterLink
  );

  // Date format
  const dateFormat = yaml.dateFormat;
  // ?? not sure why I need this to make it work,
  // without it, the assigned the renderInfo.dateFormat will become undefined
  if (typeof yaml.dateFormat === 'string') {
    renderInfo.dateFormat =
      yaml.dateFormat === '' ? plugin.settings.dateFormat : dateFormat;
  } else {
    renderInfo.dateFormat = plugin.settings.dateFormat;
  }

  // Date format prefix
  renderInfo.dateFormatPrefix = getStringFromInput(
    yaml?.dateFormatPrefix,
    renderInfo.dateFormatPrefix
  );

  // Date format suffix
  renderInfo.dateFormatSuffix = getStringFromInput(
    yaml?.dateFormatSuffix,
    renderInfo.dateFormatSuffix
  );

  // startDate, endDate
  if (typeof yaml.startDate === 'string') {
    if (/^([\-]?[0-9]+[\.][0-9]+|[\-]?[0-9]+)m$/.test(yaml.startDate)) {
      throw new TrackerError(
        `'m' for 'minute' is too small for parameter startDate, please use 'd' for 'day' or 'M' for month`
      );
    }
    const strStartDate = DateTimeUtils.getDateStringFromInputString(
      yaml.startDate,
      renderInfo.dateFormatPrefix,
      renderInfo.dateFormatSuffix
    );

    // relative date
    let startDate = null;
    let isStartDateValid = false;
    startDate = DateTimeUtils.getDateByDurationToToday(
      strStartDate,
      renderInfo.dateFormat
    );

    if (startDate) isStartDateValid = true;
    else {
      startDate = DateTimeUtils.stringToDate(
        strStartDate,
        renderInfo.dateFormat
      );
      if (startDate.isValid()) {
        isStartDateValid = true;
      }
    }

    if (!isStartDateValid || startDate === null)
      throw new TrackerError(
        `Invalid startDate, the format of startDate may not match your dateFormat '${renderInfo.dateFormat}'`
      );

    renderInfo.startDate = startDate;
  }

  if (typeof yaml.endDate === 'string') {
    if (/^([\-]?[0-9]+[\.][0-9]+|[\-]?[0-9]+)m$/.test(yaml.endDate)) {
      throw new TrackerError(
        `'m' for 'minute' is too small for parameter endDate, please use 'd' for 'day' or 'M' for month`
      );
    }
    const strEndDate = DateTimeUtils.getDateStringFromInputString(
      yaml.endDate,
      renderInfo.dateFormatPrefix,
      renderInfo.dateFormatSuffix
    );

    let endDate = null;
    let isEndDateValid = false;
    endDate = DateTimeUtils.getDateByDurationToToday(
      strEndDate,
      renderInfo.dateFormat
    );
    if (endDate) {
      isEndDateValid = true;
    } else {
      endDate = DateTimeUtils.stringToDate(strEndDate, renderInfo.dateFormat);
      if (endDate.isValid()) {
        isEndDateValid = true;
      }
    }

    if (!isEndDateValid || endDate === null)
      throw new TrackerError(
        `Invalid endDate, the format of endDate may not match your dateFormat '${renderInfo.dateFormat}`
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
      throw new TrackerError(
        'Invalid date range (startDate larger than endDate)'
      );
  }

  // xDataset
  renderInfo.xDataset = xDataset;

  // Dataset name (need xDataset to set default name)
  const datasetName = getStringArrayFromInput(
    'datasetName',
    yaml.datasetName,
    numDatasets,
    'untitled',
    null,
    true
  );

  // rename untitled
  let indUntitled = 0;
  for (let ind = 0; ind < datasetName.length; ind++) {
    if (renderInfo.xDataset.includes(ind)) continue;
    if (datasetName[ind] === 'untitled') {
      datasetName[ind] = 'untitled' + indUntitled.toString();
      indUntitled++;
    }
  }
  // Check duplicated names
  if (new Set(datasetName).size !== datasetName.length)
    throw new TrackerError('Not enough dataset names or duplicated names');

  renderInfo.datasetName = datasetName;

  // constValue
  renderInfo.constValue = getNumberArrayFromInput(
    'constValue',
    yaml.constValue,
    numDatasets,
    1.0,
    true
  );

  // ignoreAttachedValue
  renderInfo.ignoreAttachedValue = getBoolArrayFromInput(
    'ignoreAttachedValue',
    yaml.ignoreAttachedValue,
    numDatasets,
    false,
    true
  );

  // ignoreZeroValue
  renderInfo.ignoreZeroValue = getBoolArrayFromInput(
    'ignoreZeroValue',
    yaml.ignoreZeroValue,
    numDatasets,
    false,
    true
  );

  // accum
  renderInfo.accum = getBoolArrayFromInput(
    'accum',
    yaml.accum,
    numDatasets,
    false,
    true
  );

  // penalty
  renderInfo.penalty = getNumberArrayFromInput(
    'penalty',
    yaml.penalty,
    numDatasets,
    null,
    true
  );

  // valueShift
  renderInfo.valueShift = getNumberArrayFromInput(
    'valueShift',
    yaml.valueShift,
    numDatasets,
    0,
    true
  );

  // shiftOnlyValueLargerThan
  renderInfo.shiftOnlyValueLargerThan = getNumberArrayFromInput(
    'shiftOnlyValueLargerThan',
    yaml.shiftOnlyValueLargerThan,
    numDatasets,
    null,
    true
  );

  // textValueMap
  if (typeof yaml.textValueMap !== 'undefined') {
    const keys = getKeys(yaml.textValueMap);
    for (const key of keys) {
      const text = key.trim();
      renderInfo.textValueMap[text] = yaml.textValueMap[text];
    }
  }

  // fixedScale
  if (typeof yaml.fixedScale === 'number') {
    renderInfo.fixedScale = yaml.fixedScale;
  }

  // fitPanelWidth
  if (typeof yaml.fitPanelWidth === 'boolean') {
    renderInfo.fitPanelWidth = yaml.fitPanelWidth;
  }

  // aspectRatio
  if (typeof yaml.aspectRatio === 'string') {
    // yaml.fitPanelWidth
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

  // margin
  const margin = getNumberArrayFromInput('margin', yaml.margin, 4, 10, true);

  if (margin.length > 4) {
    throw new TrackerError(
      `'margin' accepts up to four values for top, right, bottom, and left margins.`
    );
  }
  renderInfo.margin = new Margin(margin[0], margin[1], margin[2], margin[3]);

  // customDataset related parameters
  for (const datasetKey of customDatasetKeys) {
    const customDataset = new CustomDataset();
    const yamlCustomDataset = yaml[datasetKey];

    const customDatasetKeys = getKeys(customDataset);
    const yamlKeys = getKeys(yamlCustomDataset);
    for (const key of yamlKeys) {
      if (!customDatasetKeys.includes(key))
        throw new InvalidDatasetKeyError(key);
    }

    // id
    let customDatasetId = -1;
    const strCustomDatasetId = datasetKey.replace('dataset', '');
    if (strCustomDatasetId === '') {
      customDatasetId = 0;
    } else {
      customDatasetId = parseFloat(strCustomDatasetId);
    }
    customDataset.id = customDatasetId;

    // name
    customDataset.name = getStringFromInput(
      yamlCustomDataset?.name,
      customDataset.name
    );

    // xData
    const xData = getStringArray('xData', yamlCustomDataset?.xData);
    if (typeof xData === 'string') return xData;

    customDataset.xData = xData;
    const numXData = customDataset.xData.length;

    // yData
    const yData = getStringArray('yData', yamlCustomDataset?.yData);
    if (typeof yData === 'string') return yData;

    customDataset.yData = yData;
    if (customDataset.yData.length !== numXData)
      throw new TrackerError(
        'Number of elements in xData and yData do not match'
      );

    renderInfo.customDatasets.push(customDataset);
  } // customDataset related parameters

  // line related parameters
  for (const lineKey of lineKeys) {
    const line = new LineChart();
    const yamlLine = yaml[lineKey];

    const lineKeys = getKeys(line);
    const yamlKeys = getKeys(yamlLine);
    for (const key of yamlKeys) {
      if (!lineKeys.includes(key)) throw new InvalidDatasetKeyError(key);
    }

    parseCommonChartInfo(yamlLine, line);

    // lineColor
    line.lineColor = getStringArrayFromInput(
      'lineColor',
      yamlLine?.lineColor,
      numDatasets,
      '',
      isColorValid,
      true
    );

    // lineWidth
    line.lineWidth = getNumberArrayFromInput(
      'lineWidth',
      yamlLine?.lineWidth,
      numDatasets,
      1.5,
      true
    );

    // showLine
    line.showLine = getBoolArrayFromInput(
      'showLine',
      yamlLine?.showLine,
      numDatasets,
      true,
      true
    );

    // showPoint
    line.showPoint = getBoolArrayFromInput(
      'showPoint',
      yamlLine?.showPoint,
      numDatasets,
      true,
      true
    );

    // pointColor
    line.pointColor = getStringArrayFromInput(
      'pointColor',
      yamlLine?.pointColor,
      numDatasets,
      '#69b3a2',
      isColorValid,
      true
    );

    // pointBorderColor
    line.pointBorderColor = getStringArrayFromInput(
      'pointBorderColor',
      yamlLine?.pointBorderColor,
      numDatasets,
      '#69b3a2',
      isColorValid,
      true
    );

    // pointBorderWidth
    line.pointBorderWidth = getNumberArrayFromInput(
      'pointBorderWidth',
      yamlLine?.pointBorderWidth,
      numDatasets,
      0.0,
      true
    );

    // pointSize
    line.pointSize = getNumberArrayFromInput(
      'pointSize',
      yamlLine?.pointSize,
      numDatasets,
      3.0,
      true
    );

    // fillGap
    line.fillGap = getBoolArrayFromInput(
      'fillGap',
      yamlLine?.fillGap,
      numDatasets,
      false,
      true
    );

    // yAxisLocation
    line.yAxisLocation = getStringArrayFromInput(
      'yAxisLocation',
      yamlLine?.yAxisLocation,
      numDatasets,
      'left',
      isYAxisLocationValid,
      true
    );

    renderInfo.lineCharts.push(line);
  } // line related parameters

  // bar related parameters
  for (const barKey of barKeys) {
    const barChart = new BarChart();
    const yamlBarChart = yaml[barKey];

    const barKeys = getKeys(barChart);
    const yamlKeys = getKeys(yamlBarChart);
    for (const key of yamlKeys) {
      if (!barKeys.includes(key)) throw new InvalidDatasetKeyError(key);
    }

    parseCommonChartInfo(yamlBarChart, barChart);

    // barColor
    barChart.barColor = getStringArrayFromInput(
      'barColor',
      yamlBarChart?.barColor,
      numDatasets,
      '',
      isColorValid,
      true
    );

    // yAxisLocation
    barChart.yAxisLocation = getStringArrayFromInput(
      'yAxisLocation',
      yamlBarChart?.yAxisLocation,
      numDatasets,
      'left',
      isYAxisLocationValid,
      true
    );

    renderInfo.barCharts.push(barChart);
  } // bar related parameters

  // pie related parameters
  for (const pieKey of pieKeys) {
    const pie = new PieChart();
    const yamlPie = yaml[pieKey];

    const pieKeys = getKeys(pie);
    const yamlKeys = getKeys(yamlPie);
    for (const key of yamlKeys) {
      if (!pieKeys.includes(key)) throw new InvalidDatasetKeyError(key);
    }

    // title
    pie.title = getStringFromInput(yamlPie?.title, pie.title);

    // data
    const data = getStringArray('data', yamlPie?.data);

    pie.data = data;
    const numData = pie.data.length;

    // dataColor
    pie.dataColor = getStringArrayFromInput(
      'dataColor',
      yamlPie?.dataColor,
      numData,
      null,
      isColorValid,
      true
    );

    // dataName
    pie.dataName = getStringArrayFromInput(
      'dataName',
      yamlPie?.dataName,
      numData,
      '',
      null,
      true
    );

    // label
    pie.label = getStringArrayFromInput(
      'label',
      yamlPie?.label,
      numData,
      '',
      null,
      true
    );

    // hideLabelLessThan
    if (typeof yamlPie?.hideLabelLessThan === 'number') {
      pie.hideLabelLessThan = yamlPie.hideLabelLessThan;
    }

    // extLabel
    pie.extLabel = getStringArrayFromInput(
      'extLabel',
      yamlPie?.extLabel,
      numData,
      '',
      null,
      true
    );

    // showExtLabelOnlyIfNoLabel
    if (typeof yamlPie?.showExtLabelOnlyIfNoLabel === 'boolean') {
      pie.showExtLabelOnlyIfNoLabel = yamlPie.showExtLabelOnlyIfNoLabel;
    }

    // ratioInnerRadius
    if (typeof yamlPie?.ratioInnerRadius === 'number') {
      pie.ratioInnerRadius = yamlPie.ratioInnerRadius;
    }

    // showLegend
    if (typeof yamlPie?.showLegend === 'boolean') {
      pie.showLegend = yamlPie.showLegend;
    }

    // legendPosition
    pie.legendPosition = getStringFromInput(yamlPie?.legendPosition, 'right');

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
    pie.legendOrientation = getStringFromInput(
      yamlPie?.legendOrientation,
      defaultLegendOrientation
    );

    // legendBgColor
    pie.legendBgColor = getStringFromInput(
      yamlPie?.legendBgColor,
      pie.legendBgColor
    );

    // legendBorderColor
    pie.legendBorderColor = getStringFromInput(
      yamlPie?.legendBorderColor,
      pie.legendBorderColor
    );

    renderInfo.pieCharts.push(pie);
  } // pie related parameters

  // summary related parameters
  for (const summaryKey of summaryKeys) {
    const summary = new Summary();
    const yamlSummary = yaml[summaryKey];

    const summaryKeys = getKeys(summary);
    const yamlKeys = getKeys(yamlSummary);

    for (const key of yamlKeys) {
      if (!summaryKeys.includes(key)) throw new InvalidDatasetKeyError(key);
    }

    // template
    summary.template = getStringFromInput(
      yamlSummary?.template,
      summary.template
    );

    // style
    summary.style = getStringFromInput(yamlSummary?.style, summary.style);

    renderInfo.summaries.push(summary);
  } // summary related parameters

  // Month related parameters
  for (const monthKey of monthKeys) {
    const month = new Month();
    const yamlMonth = yaml[monthKey];

    const monthKeys = getKeys(month);
    const yamlKeys = getKeys(yamlMonth);
    for (const key of yamlKeys) {
      if (!monthKeys.includes(key)) {
        throw new InvalidDatasetKeyError(key);
      }
    }

    // mode
    month.mode = getStringFromInput(yamlMonth?.mode, month.mode);

    // dataset
    const dataset = getNumberArray('dataset', yamlMonth?.dataset);

    if (dataset.length === 0) {
      // insert y dataset given
      for (const q of queries) {
        dataset.push(q.id);
      }
    }
    month.dataset = dataset;
    const numDataset = month.dataset.length;

    // startWeekOn
    month.startWeekOn = getStringFromInput(
      yamlMonth?.startWeekOn,
      month.startWeekOn
    );

    // showCircle
    if (typeof yamlMonth?.showCircle === 'boolean') {
      month.showCircle = yamlMonth.showCircle;
    }

    // threshold
    const threshold = getNumberArray('threshold', yamlMonth?.threshold);
    if (typeof threshold === 'string') {
      return threshold;
    }
    month.threshold = threshold;
    if (month.threshold.length === 0) {
      for (let indDataset = 0; indDataset < numDataset; indDataset++) {
        month.threshold.push(0);
      }
    }
    if (month.threshold.length !== month.dataset.length)
      throw new TrackerError(
        'The number of inputs of threshold and dataset do not matched'
      );

    // yMin
    const yMin = getNumberArray('yMin', yamlMonth?.yMin);
    if (typeof yMin === 'string') {
      return yMin;
    }
    month.yMin = yMin;
    if (month.yMin.length === 0) {
      for (let indDataset = 0; indDataset < numDataset; indDataset++) {
        month.yMin.push(null);
      }
    }
    if (month.yMin.length !== month.dataset.length)
      throw new TrackerError(
        'The number of inputs of yMin and dataset not matched'
      );

    // yMax
    const yMax = getNumberArray('yMax', yamlMonth?.yMax);
    if (typeof yMax === 'string') {
      return yMax;
    }
    month.yMax = yMax;
    if (month.yMax.length === 0) {
      for (let indDataset = 0; indDataset < numDataset; indDataset++) {
        month.yMax.push(null);
      }
    }
    if (month.yMax.length !== month.dataset.length)
      throw new TrackerError(
        'The number of inputs of yMin and dataset not matched'
      );

    // color
    month.color = getStringFromInput(yamlMonth?.color, month.color);

    // dimNotInMonth
    if (typeof yamlMonth?.dimNotInMonth === 'boolean') {
      month.dimNotInMonth = yamlMonth.dimNotInMonth;
    }

    // showStreak
    if (typeof yamlMonth?.showStreak === 'boolean') {
      month.showStreak = yamlMonth.showStreak;
    }

    // showTodayRing
    if (typeof yamlMonth?.showTodayRing === 'boolean') {
      month.showTodayRing = yamlMonth.showTodayRing;
    }

    // showSelectedValue
    if (typeof yamlMonth?.showSelectedValue === 'boolean') {
      month.showSelectedValue = yamlMonth.showSelectedValue;
    }

    // showSelectedRing
    if (typeof yamlMonth?.showSelectedRing === 'boolean') {
      month.showSelectedRing = yamlMonth.showSelectedRing;
    }

    // circleColor
    month.circleColor = getStringFromInput(
      yamlMonth?.circleColor,
      month.circleColor
    );

    // circleColorByValue
    if (typeof yamlMonth?.circleColorByValue === 'boolean') {
      month.circleColorByValue = yamlMonth.circleColorByValue;
    }

    // headerYearColor
    month.headerYearColor = getStringFromInput(
      yamlMonth?.headerYearColor,
      month.headerYearColor
    );

    // headerMonthColor
    month.headerMonthColor = getStringFromInput(
      yamlMonth?.headerMonthColor,
      month.headerMonthColor
    );

    // dividingLineColor
    month.dividingLineColor = getStringFromInput(
      yamlMonth?.dividingLineColor,
      month.dividingLineColor
    );

    // todayRingColor
    month.todayRingColor = getStringFromInput(
      yamlMonth?.todayRingColor,
      month.todayRingColor
    );

    // selectedRingColor
    month.selectedRingColor = getStringFromInput(
      yamlMonth?.selectedRingColor,
      month.selectedRingColor
    );

    // initMonth
    month.initMonth = getStringFromInput(yamlMonth?.initMonth, month.initMonth);

    // showAnnotation
    if (typeof yamlMonth?.showAnnotation === 'boolean') {
      month.showAnnotation = yamlMonth.showAnnotation;
    }

    // annotation
    const annotation = getStringArray('annotation', yamlMonth?.annotation);
    if (typeof annotation === 'string') {
      return annotation;
    }
    month.annotation = annotation;
    if (month.annotation.length === 0) {
      for (let indDataset = 0; indDataset < numDataset; indDataset++) {
        month.annotation.push(null);
      }
    }
    if (month.annotation.length !== month.dataset.length)
      throw new TrackerError(
        'The number of inputs of annotation and dataset not matched'
      );

    // showAnnotationOfAllTargets
    if (typeof yamlMonth?.showAnnotationOfAllTargets === 'boolean') {
      month.showAnnotationOfAllTargets = yamlMonth.showAnnotationOfAllTargets;
    }

    renderInfo.months.push(month);
  } // Month related parameters

  // Heatmap related parameters
  for (const heatmapKey of heatmapKeys) {
    const heatmap = new Heatmap();
    const yamlHeatmap = yaml[heatmapKey];

    const heatmapKeys = getKeys(heatmap);
    const yamlKeys = getKeys(yamlHeatmap);
    for (const key of yamlKeys) {
      if (!heatmapKeys.includes(key)) throw new InvalidDatasetKeyError(key);
    }

    renderInfo.heatmaps.push(heatmap);
  }

  // Bullet related parameters
  for (const bulletKey of bulletKeys) {
    const bullet = new BulletGraph();
    const yamlBullet = yaml[bulletKey];

    const bulletKeys = getKeys(bullet);
    const yamlKeys = getKeys(yamlBullet);
    for (const key of yamlKeys) {
      if (!bulletKeys.includes(key)) throw new InvalidDatasetKeyError(key);
    }

    // title
    bullet.title = getStringFromInput(yamlBullet?.title, bullet.title);

    // dataset
    bullet.dataset = getStringFromInput(yamlBullet?.dataset, bullet.dataset);

    // orientation
    bullet.orientation = getStringFromInput(
      yamlBullet?.orientation,
      bullet.orientation
    );

    // range
    const range = getNumberArray('range', yamlBullet?.range);
    if (typeof range === 'string') return range;

    // Check the value is monotonically increasing
    // Check the value is not negative
    if (range.length === 1) {
      if (range[0] < 0) {
        throw new TrackerError('Negative range value is not allowed');
      }
    } else if (range.length > 1) {
      const lastBound = range[0];
      if (lastBound < 0)
        throw new TrackerError('Negative range value is not allowed');

      for (let ind = 1; ind < range.length; ind++) {
        if (range[ind] <= lastBound)
          throw new TrackerError(
            "Values in parameter 'range' should be monotonically increasing"
          );
      }
    } else {
      throw new TrackerError('Empty range is not allowed');
    }
    bullet.range = range;
    const numRange = range.length;

    // range color
    bullet.rangeColor = getStringArrayFromInput(
      'rangeColor',
      yamlBullet?.rangeColor,
      numRange,
      '',
      isColorValid,
      true
    );

    // actual value, can possess template variable
    bullet.value = getStringFromInput(yamlBullet?.value, bullet.value);

    // value unit
    bullet.valueUnit = getStringFromInput(
      yamlBullet?.valueUnit,
      bullet.valueUnit
    );

    // value color
    bullet.valueColor = getStringFromInput(
      yamlBullet?.valueColor,
      bullet.valueColor
    );

    // show mark
    if (typeof yamlBullet?.showMarker === 'boolean') {
      bullet.showMarker = yamlBullet.showMarker;
    }

    // mark value
    if (typeof yamlBullet?.markerValue === 'number') {
      bullet.markerValue = yamlBullet.markerValue;
    }

    // mark color
    bullet.markerColor = getStringFromInput(
      yamlBullet?.markerColor,
      bullet.markerColor
    );

    renderInfo.bulletGraphs.push(bullet);
  } // Bullet related parameters

  return renderInfo;
};
