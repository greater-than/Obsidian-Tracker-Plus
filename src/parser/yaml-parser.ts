import { TFolder, normalizePath, parseYaml } from 'obsidian';
import Tracker from '../main';
import { AspectRatio } from '../models/aspect-ratio';
import { BarChart } from '../models/bar-chart';
import { BulletGraph } from '../models/bullet-graph';
import { CustomDataset } from '../models/custom-dataset';
import { SearchType } from '../models/enums';
import { Heatmap } from '../models/heatmap';
import { LineChart } from '../models/line-chart';
import { Margin } from '../models/margin';
import { MonthInfo } from '../models/month';
import { PieChart } from '../models/pie-chart';
import { Query } from '../models/query';
import { RenderInfo } from '../models/render-info';
import { Summary } from '../models/summary';
import { DateTimeUtils, StringUtils } from '../utils';
import {
  getBoolArrayFromInput,
  getKeys,
  getNumberArray,
  getNumberArrayFromInput,
  getStringArray,
  getStringArrayFromInput,
  getStringFromInput,
  parseCommonChartInfo,
  splitInputByComma,
  validateColor,
  validateSearchType,
  validateYAxisLocation,
  validateYamlKeys,
} from './helper';

// TODO Breakup this function
export const getRenderInfoFromYaml = (
  yamlText: string,
  plugin: Tracker
): RenderInfo | string => {
  let yaml;
  let errorMessage = '';

  try {
    // console.log(yamlText);
    yaml = parseYaml(yamlText);
  } catch (err) {
    errorMessage = 'Error parsing YAML';
    console.log(err);
    return errorMessage;
  }
  if (!yaml) {
    errorMessage = 'Error parsing YAML';
    return errorMessage;
  }
  // console.log(yaml);
  const yamlKeys = getKeys(yaml);
  // console.log(yamlKeys);

  // Search target
  if (!yamlKeys.includes('searchTarget')) {
    errorMessage = "Parameter 'searchTarget' not found in YAML";
    return errorMessage;
  }
  const searchTarget: Array<string> = [];
  if (typeof yaml.searchTarget === 'object' && yaml.searchTarget !== null) {
    if (Array.isArray(yaml.searchTarget)) {
      for (const target of yaml.searchTarget) {
        if (typeof target === 'string') {
          if (target !== '') {
            searchTarget.push(target);
          } else {
            errorMessage = 'Empty search target is not allowed.';
            break;
          }
        }
      }
    }
  } else if (typeof yaml.searchTarget === 'string') {
    const splitInput = splitInputByComma(yaml.searchTarget);
    // console.log(splitInput);
    if (splitInput.length > 1) {
      for (let piece of splitInput) {
        piece = piece.trim();
        if (piece !== '') {
          searchTarget.push(piece);
        } else {
          errorMessage = 'Empty search target is not allowed.';
          break;
        }
      }
    } else if (yaml.searchTarget === '') {
      errorMessage = 'Empty search target is not allowed.';
    } else {
      searchTarget.push(yaml.searchTarget);
    }
  } else {
    errorMessage = 'Invalid search target (searchTarget)';
  }
  for (let ind = 0; ind < searchTarget.length; ind++) {
    searchTarget[ind] = StringUtils.replaceImgTagByAlt(searchTarget[ind]);
  }
  // console.log(searchTarget);

  if (errorMessage !== '') return errorMessage;

  const numDatasets = searchTarget.length;

  // Search type
  if (!yamlKeys.includes('searchType')) {
    const errorMessage = "Parameter 'searchType' not found in YAML";
    return errorMessage;
  }
  const searchType: Array<SearchType> = [];
  const searchTypes = getStringArrayFromInput(
    'searchType',
    yaml.searchType,
    numDatasets,
    '',
    validateSearchType,
    false
  );
  if (typeof searchTypes === 'string') {
    return searchTypes; // errorMessage
  }
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
        searchType.push(SearchType.dvField);
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
  // Currently, we don't allow type 'table' used with other types
  if (
    searchType.includes(SearchType.Table) &&
    searchType.filter((t) => t !== SearchType.Table).length > 0
  ) {
    const errorMessage =
      "searchType 'table' doesn't work with other types for now";
    return errorMessage;
  }
  // console.log(searchType);

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
  if (typeof separators === 'string') {
    return separators; // errorMessage
  }
  multipleValueSeparator = separators.map((sep) => {
    return sep === 'comma' || sep === '\\,' ? ',' : sep;
  });
  // console.log(multipleValueSeparator);

  // xDataset
  const datasets = getNumberArrayFromInput(
    'xDataset',
    yaml.xDataset,
    numDatasets,
    -1,
    true
  );
  if (typeof datasets === 'string') return datasets; // errorMessage

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

      if (queries.some((q) => q.id === customDatasetId)) {
        errorMessage = "Duplicated dataset id for key '" + key + "'";
        return errorMessage;
      }

      customDatasetKeys.push(key);
      allKeys.push(key);
    }
  }
  try {
    validateYamlKeys(yamlKeys, renderInfoKeys, allKeys);
  } catch (error) {
    return error.message;
  }

  if (allKeys.length <= allowedKeys.length) {
    return 'No output parameter provided, please place line, bar, pie, month, bullet, or summary.';
  }

  // Root folder to search
  renderInfo.folder = getStringFromInput(yaml?.folder, plugin.settings.folder);
  if (renderInfo.folder.trim() === '') {
    renderInfo.folder = plugin.settings.folder;
  }
  // console.log("renderInfo folder: " + renderInfo.folder);

  const abstractFolder = plugin.app.vault.getAbstractFileByPath(
    normalizePath(renderInfo.folder)
  );
  if (!abstractFolder || !(abstractFolder instanceof TFolder)) {
    const errorMessage = "Folder '" + renderInfo.folder + "' doesn't exist";
    return errorMessage;
  }

  // file
  if (typeof yaml.file === 'string') {
    const files = getStringArray('file', yaml.file);
    if (typeof files === 'string') {
      return files; // error message
    }
    renderInfo.file = files;
  }
  // console.log(renderInfo.file);

  // specifiedFilesOnly
  if (typeof yaml.specifiedFilesOnly === 'boolean') {
    renderInfo.specifiedFilesOnly = yaml.specifiedFilesOnly;
  }
  // console.log(renderInfo.specifiedFilesOnly);

  // fileContainsLinkedFiles
  if (typeof yaml.fileContainsLinkedFiles === 'string') {
    const files = getStringArray(
      'fileContainsLinkedFiles',
      yaml.fileContainsLinkedFiles
    );
    if (typeof files === 'string') {
      return files;
    }
    renderInfo.fileContainsLinkedFiles = files;
  }
  // console.log(renderInfo.fileContainsLinkedFiles);

  // fileMultiplierAfterLink
  renderInfo.fileMultiplierAfterLink = getStringFromInput(
    yaml?.fileMultiplierAfterLink,
    renderInfo.fileMultiplierAfterLink
  );
  // console.log(renderInfo.fileMultiplierAfterLink);

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
  // console.log("renderInfo dateFormat: " + renderInfo.dateFormat);

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
  // console.log("Parsing startDate");
  if (typeof yaml.startDate === 'string') {
    if (/^([\-]?[0-9]+[\.][0-9]+|[\-]?[0-9]+)m$/.test(yaml.startDate)) {
      const errorMessage =
        "'m' for 'minute' is too small for parameter startDate, please use 'd' for 'day' or 'M' for month";
      return errorMessage;
    }
    const strStartDate = DateTimeUtils.getDateStringFromInputString(
      yaml.startDate,
      renderInfo.dateFormatPrefix,
      renderInfo.dateFormatSuffix
    );
    // console.log(strStartDate);

    // relative date
    let startDate = null;
    let isStartDateValid = false;
    startDate = DateTimeUtils.getDateByDurationToToday(
      strStartDate,
      renderInfo.dateFormat
    );
    // console.log(startDate);

    if (startDate) {
      isStartDateValid = true;
    } else {
      startDate = DateTimeUtils.stringToDate(
        strStartDate,
        renderInfo.dateFormat
      );
      if (startDate.isValid()) {
        isStartDateValid = true;
      }
    }
    // console.log(startDate);

    if (!isStartDateValid || startDate === null) {
      const errorMessage =
        'Invalid startDate, the format of startDate may not match your dateFormat ' +
        renderInfo.dateFormat;
      return errorMessage;
    }
    renderInfo.startDate = startDate;
  }

  // console.log("Parsing endDate");
  if (typeof yaml.endDate === 'string') {
    if (/^([\-]?[0-9]+[\.][0-9]+|[\-]?[0-9]+)m$/.test(yaml.endDate)) {
      const errorMessage =
        "'m' for 'minute' is too small for parameter endDate, please use 'd' for 'day' or 'M' for month";
      return errorMessage;
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
    // console.log(endDate);

    if (!isEndDateValid || endDate === null) {
      const errorMessage =
        'Invalid endDate, the format of endDate may not match your dateFormat ' +
        renderInfo.dateFormat;
      return errorMessage;
    }
    renderInfo.endDate = endDate;
  }
  if (
    renderInfo.startDate !== null &&
    renderInfo.startDate.isValid() &&
    renderInfo.endDate !== null &&
    renderInfo.endDate.isValid()
  ) {
    // Make sure endDate > startDate
    if (renderInfo.endDate < renderInfo.startDate) {
      const errorMessage = 'Invalid date range (startDate larger than endDate)';
      return errorMessage;
    }
  }
  // console.log(renderInfo.startDate);
  // console.log(renderInfo.endDate);

  // xDataset
  renderInfo.xDataset = xDataset;
  // console.log(renderInfo.xDataset);

  // Dataset name (need xDataset to set default name)
  const datasetName = getStringArrayFromInput(
    'datasetName',
    yaml.datasetName,
    numDatasets,
    'untitled',
    null,
    true
  );
  if (typeof datasetName === 'string') {
    return datasetName; // errorMessage
  }
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
  if (new Set(datasetName).size === datasetName.length) {
    renderInfo.datasetName = datasetName;
  } else {
    const errorMessage = 'Not enough dataset names or duplicated names';
    return errorMessage;
  }

  // constValue
  const constValue = getNumberArrayFromInput(
    'constValue',
    yaml.constValue,
    numDatasets,
    1.0,
    true
  );
  if (typeof constValue === 'string') {
    return constValue; // errorMessage
  }
  renderInfo.constValue = constValue;
  // console.log(renderInfo.constValue);

  // ignoreAttachedValue
  const ignoreAttachedValue = getBoolArrayFromInput(
    'ignoreAttachedValue',
    yaml.ignoreAttachedValue,
    numDatasets,
    false,
    true
  );
  if (typeof ignoreAttachedValue === 'string') {
    return ignoreAttachedValue;
  }
  renderInfo.ignoreAttachedValue = ignoreAttachedValue;
  // console.log(renderInfo.ignoreAttachedValue);

  // ignoreZeroValue
  const ignoreZeroValue = getBoolArrayFromInput(
    'ignoreZeroValue',
    yaml.ignoreZeroValue,
    numDatasets,
    false,
    true
  );
  if (typeof ignoreZeroValue === 'string') {
    return ignoreZeroValue;
  }
  renderInfo.ignoreZeroValue = ignoreZeroValue;
  // console.log(renderInfo.ignoreAttachedValue);

  // accum
  const accum = getBoolArrayFromInput(
    'accum',
    yaml.accum,
    numDatasets,
    false,
    true
  );
  if (typeof accum === 'string') {
    return accum;
  }
  renderInfo.accum = accum;
  // console.log(renderInfo.accum);

  // penalty
  const penalty = getNumberArrayFromInput(
    'penalty',
    yaml.penalty,
    numDatasets,
    null,
    true
  );
  if (typeof penalty === 'string') {
    return penalty;
  }
  renderInfo.penalty = penalty;
  // console.log(renderInfo.penalty);

  // valueShift
  const valueShift = getNumberArrayFromInput(
    'valueShift',
    yaml.valueShift,
    numDatasets,
    0,
    true
  );
  if (typeof valueShift === 'string') {
    return valueShift;
  }
  renderInfo.valueShift = valueShift;
  // console.log(renderInfo.valueShift);

  // shiftOnlyValueLargerThan
  const shiftOnlyValueLargerThan = getNumberArrayFromInput(
    'shiftOnlyValueLargerThan',
    yaml.shiftOnlyValueLargerThan,
    numDatasets,
    null,
    true
  );
  if (typeof shiftOnlyValueLargerThan === 'string') {
    return shiftOnlyValueLargerThan;
  }
  renderInfo.shiftOnlyValueLargerThan = shiftOnlyValueLargerThan;
  // console.log(renderInfo.shiftOnlyValueLargerThan);

  // textValueMap
  if (typeof yaml.textValueMap !== 'undefined') {
    const keys = getKeys(yaml.textValueMap);
    // console.log(texts);
    for (const key of keys) {
      const text = key.trim();
      renderInfo.textValueMap[text] = yaml.textValueMap[text];
    }
  }
  // console.log(renderInfo.textValueMap);

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
  if (typeof margin === 'string') {
    return margin; // errorMessage
  }
  if (margin.length > 4) {
    return 'margin accepts not more than four values for top, right, bottom, and left margins.';
  }
  renderInfo.margin = new Margin(margin[0], margin[1], margin[2], margin[3]);
  // console.log(renderInfo.margin);

  // customDataset related parameters
  for (const datasetKey of customDatasetKeys) {
    const customDataset = new CustomDataset();
    const yamlCustomDataset = yaml[datasetKey];

    const customDatasetKeys = getKeys(customDataset);
    const yamlKeys = getKeys(yamlCustomDataset);
    // console.log(keysOfCustomDatasetInfo);
    // console.log(yamlKeys);
    for (const key of yamlKeys) {
      if (!customDatasetKeys.includes(key)) {
        errorMessage = "'" + key + "' is not an available key";
        return errorMessage;
      }
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
    if (typeof xData === 'string') {
      return xData;
    }
    customDataset.xData = xData;
    // console.log(customDataset.xData);
    const numXData = customDataset.xData.length;

    // yData
    const yData = getStringArray('yData', yamlCustomDataset?.yData);
    if (typeof yData === 'string') {
      return yData;
    }
    customDataset.yData = yData;
    // console.log(customDataset.yData);
    if (customDataset.yData.length !== numXData) {
      const errorMessage = 'Number of elements in xData and yData not matched';
      return errorMessage;
    }

    renderInfo.customDatasets.push(customDataset);
  } // customDataset related parameters
  // console.log(renderInfo.customDataset);

  // line related parameters
  for (const lineKey of lineKeys) {
    const line = new LineChart();
    const yamlLine = yaml[lineKey];

    const lineKeys = getKeys(line);
    const yamlKeys = getKeys(yamlLine);
    // console.log(keysOfLineInfo);
    // console.log(yamlKeys);
    for (const key of yamlKeys) {
      if (!lineKeys.includes(key)) {
        errorMessage = "'" + key + "' is not an available key";
        return errorMessage;
      }
    }

    const parsedCommonChartInfo = parseCommonChartInfo(yamlLine, line);
    if (typeof parsedCommonChartInfo === 'string') {
      return parsedCommonChartInfo;
    }

    // lineColor
    const lineColor = getStringArrayFromInput(
      'lineColor',
      yamlLine?.lineColor,
      numDatasets,
      '',
      validateColor,
      true
    );
    if (typeof lineColor === 'string') {
      return lineColor; // errorMessage
    }
    line.lineColor = lineColor;
    // console.log(line.lineColor);

    // lineWidth
    const lineWidth = getNumberArrayFromInput(
      'lineWidth',
      yamlLine?.lineWidth,
      numDatasets,
      1.5,
      true
    );
    if (typeof lineWidth === 'string') {
      return lineWidth; // errorMessage
    }
    line.lineWidth = lineWidth;
    // console.log(line.lineWidth);

    // showLine
    const showLine = getBoolArrayFromInput(
      'showLine',
      yamlLine?.showLine,
      numDatasets,
      true,
      true
    );
    if (typeof showLine === 'string') {
      return showLine;
    }
    line.showLine = showLine;
    // console.log(line.showLine);

    // showPoint
    const showPoint = getBoolArrayFromInput(
      'showPoint',
      yamlLine?.showPoint,
      numDatasets,
      true,
      true
    );
    if (typeof showPoint === 'string') {
      return showPoint;
    }
    line.showPoint = showPoint;
    // console.log(line.showPoint);

    // pointColor
    const pointColor = getStringArrayFromInput(
      'pointColor',
      yamlLine?.pointColor,
      numDatasets,
      '#69b3a2',
      validateColor,
      true
    );
    if (typeof pointColor === 'string') {
      return pointColor;
    }
    line.pointColor = pointColor;
    // console.log(line.pointColor);

    // pointBorderColor
    const pointBorderColor = getStringArrayFromInput(
      'pointBorderColor',
      yamlLine?.pointBorderColor,
      numDatasets,
      '#69b3a2',
      validateColor,
      true
    );
    if (typeof pointBorderColor === 'string') {
      return pointBorderColor;
    }
    line.pointBorderColor = pointBorderColor;
    // console.log(line.pointBorderColor);

    // pointBorderWidth
    const pointBorderWidth = getNumberArrayFromInput(
      'pointBorderWidth',
      yamlLine?.pointBorderWidth,
      numDatasets,
      0.0,
      true
    );
    if (typeof pointBorderWidth === 'string') {
      return pointBorderWidth; // errorMessage
    }
    line.pointBorderWidth = pointBorderWidth;
    // console.log(line.pointBorderWidth);

    // pointSize
    const pointSize = getNumberArrayFromInput(
      'pointSize',
      yamlLine?.pointSize,
      numDatasets,
      3.0,
      true
    );
    if (typeof pointSize === 'string') {
      return pointSize; // errorMessage
    }
    line.pointSize = pointSize;
    // console.log(line.pointSize);

    // fillGap
    const FillGap = getBoolArrayFromInput(
      'fillGap',
      yamlLine?.fillGap,
      numDatasets,
      false,
      true
    );
    if (typeof FillGap === 'string') {
      return FillGap;
    }
    line.fillGap = FillGap;
    // console.log(line.fillGap);

    // yAxisLocation
    const yAxisLocation = getStringArrayFromInput(
      'yAxisLocation',
      yamlLine?.yAxisLocation,
      numDatasets,
      'left',
      validateYAxisLocation,
      true
    );
    if (typeof yAxisLocation === 'string') {
      return yAxisLocation; // errorMessage
    }
    line.yAxisLocation = yAxisLocation;
    // console.log(line.yAxisLocation);

    renderInfo.lineCharts.push(line);
  } // line related parameters
  // console.log(renderInfo.line);

  // bar related parameters
  for (const barKey of barKeys) {
    const barChart = new BarChart();
    const yamlBarChart = yaml[barKey];

    const barKeys = getKeys(barChart);
    const yamlKeys = getKeys(yamlBarChart);
    // console.log(barKeys);
    // console.log(yamlKeys);
    for (const key of yamlKeys) {
      if (!barKeys.includes(key)) {
        errorMessage = "'" + key + "' is not an available key";
        return errorMessage;
      }
    }

    const parsedCommonChartInfo = parseCommonChartInfo(yamlBarChart, barChart);
    if (typeof parsedCommonChartInfo === 'string') {
      return parsedCommonChartInfo;
    }

    // barColor
    const barColor = getStringArrayFromInput(
      'barColor',
      yamlBarChart?.barColor,
      numDatasets,
      '',
      validateColor,
      true
    );
    if (typeof barColor === 'string') {
      return barColor; // errorMessage
    }
    barChart.barColor = barColor;
    // console.log(bar.barColor);

    // yAxisLocation
    const yAxisLocation = getStringArrayFromInput(
      'yAxisLocation',
      yamlBarChart?.yAxisLocation,
      numDatasets,
      'left',
      validateYAxisLocation,
      true
    );
    if (typeof yAxisLocation === 'string') {
      return yAxisLocation; // errorMessage
    }
    barChart.yAxisLocation = yAxisLocation;
    // console.log(bar.yAxisLocation);

    renderInfo.barCharts.push(barChart);
  } // bar related parameters
  // console.log(renderInfo.bar);

  // pie related parameters
  for (const pieKey of pieKeys) {
    const pie = new PieChart();
    const yamlPie = yaml[pieKey];

    const pieKeys = getKeys(pie);
    const yamlKeys = getKeys(yamlPie);
    // console.log(keysOfPieInfo);
    // console.log(yamlKeys);
    for (const key of yamlKeys) {
      if (!pieKeys.includes(key)) {
        errorMessage = "'" + key + "' is not an available key";
        return errorMessage;
      }
    }

    // title
    pie.title = getStringFromInput(yamlPie?.title, pie.title);
    // console.log(pie.title);

    // data
    const data = getStringArray('data', yamlPie?.data);
    if (typeof data === 'string') {
      return data;
    }
    pie.data = data;
    // console.log(pie.data);
    const numData = pie.data.length;

    // dataColor
    const dataColor = getStringArrayFromInput(
      'dataColor',
      yamlPie?.dataColor,
      numData,
      null,
      validateColor,
      true
    );
    if (typeof dataColor === 'string') {
      return dataColor; // errorMessage
    }
    pie.dataColor = dataColor;
    // console.log(pie.dataColor);

    // dataName
    const dataName = getStringArrayFromInput(
      'dataName',
      yamlPie?.dataName,
      numData,
      '',
      null,
      true
    );
    if (typeof dataName === 'string') {
      return dataName; // errorMessage
    }
    pie.dataName = dataName;
    // console.log(pie.dataName);

    // label
    const label = getStringArrayFromInput(
      'label',
      yamlPie?.label,
      numData,
      '',
      null,
      true
    );
    if (typeof label === 'string') {
      return label; // errorMessage
    }
    pie.label = label;
    // console.log(pie.label);

    // hideLabelLessThan
    if (typeof yamlPie?.hideLabelLessThan === 'number') {
      pie.hideLabelLessThan = yamlPie.hideLabelLessThan;
    }
    // console.log(pie.hideLabelLessThan);

    // extLabel
    const extLabel = getStringArrayFromInput(
      'extLabel',
      yamlPie?.extLabel,
      numData,
      '',
      null,
      true
    );
    if (typeof extLabel === 'string') {
      return extLabel; // errorMessage
    }
    pie.extLabel = extLabel;
    // console.log(pie.extLabel);

    // showExtLabelOnlyIfNoLabel
    if (typeof yamlPie?.showExtLabelOnlyIfNoLabel === 'boolean') {
      pie.showExtLabelOnlyIfNoLabel = yamlPie.showExtLabelOnlyIfNoLabel;
    }
    // console.log(pie.showExtLabelOnlyIfNoLabel);

    // ratioInnerRadius
    if (typeof yamlPie?.ratioInnerRadius === 'number') {
      pie.ratioInnerRadius = yamlPie.ratioInnerRadius;
    }
    // console.log(pie.ratioInnerRadius);

    // showLegend
    if (typeof yamlPie?.showLegend === 'boolean') {
      pie.showLegend = yamlPie.showLegend;
    }

    // legendPosition
    pie.legendPosition = getStringFromInput(yamlPie?.legendPosition, 'right');

    // legendOrient
    let defaultLegendOrientation = 'horizontal';
    if (pie.legendPosition === 'top' || pie.legendPosition === 'bottom') {
      defaultLegendOrientation = 'horizontal';
    } else if (
      pie.legendPosition === 'left' ||
      pie.legendPosition === 'right'
    ) {
      defaultLegendOrientation = 'vertical';
    } else {
      defaultLegendOrientation = 'horizontal';
    }
    pie.legendOrientation = getStringFromInput(
      yamlPie?.legendOrientation,
      defaultLegendOrientation
    );
    // console.log(pie.legendPosition);
    // console.log(pie.legendOrientation);

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
  // console.log(renderInfo.pie);

  // summary related parameters
  for (const summaryKey of summaryKeys) {
    const summary = new Summary();
    const yamlSummary = yaml[summaryKey];

    const summaryKeys = getKeys(summary);
    const yamlKeys = getKeys(yamlSummary);
    // console.log(keysOfSummaryInfo);
    // console.log(yamlKeys);
    for (const key of yamlKeys) {
      if (!summaryKeys.includes(key)) {
        errorMessage = "'" + key + "' is not an available key";
        return errorMessage;
      }
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
    const month = new MonthInfo();
    const yamlMonth = yaml[monthKey];

    const monthKeys = getKeys(month);
    const yamlKeys = getKeys(yamlMonth);
    // console.log(keysOfSummaryInfo);
    // console.log(yamlKeys);
    for (const key of yamlKeys) {
      if (!monthKeys.includes(key)) {
        errorMessage = "'" + key + "' is not an available key";
        return errorMessage;
      }
    }

    // mode
    month.mode = getStringFromInput(yamlMonth?.mode, month.mode);
    // console.log(month.mode);

    // dataset
    const dataset = getNumberArray('dataset', yamlMonth?.dataset);
    if (typeof dataset === 'string') {
      return dataset;
    }
    if (dataset.length === 0) {
      // insert y dataset given
      for (const q of queries) {
        dataset.push(q.id);
      }
    }
    month.dataset = dataset;
    // console.log(month.dataset);
    const numDataset = month.dataset.length;

    // startWeekOn
    month.startWeekOn = getStringFromInput(
      yamlMonth?.startWeekOn,
      month.startWeekOn
    );
    // console.log(month.startWeekOn);

    // showCircle
    if (typeof yamlMonth?.showCircle === 'boolean') {
      month.showCircle = yamlMonth.showCircle;
    }
    // console.log(month.showCircle);

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
    if (month.threshold.length !== month.dataset.length) {
      // console.log(month.threshold);
      // console.log(month.dataset);
      const errorMessage =
        'The number of inputs of threshold and dataset not matched';
      return errorMessage;
    }
    // console.log(month.threshold);

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
    if (month.yMin.length !== month.dataset.length) {
      const errorMessage =
        'The number of inputs of yMin and dataset not matched';
      return errorMessage;
    }
    // console.log(month.yMin);

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
    if (month.yMax.length !== month.dataset.length) {
      const errorMessage =
        'The number of inputs of yMin and dataset not matched';
      return errorMessage;
    }
    // console.log(month.yMax);

    // color
    month.color = getStringFromInput(yamlMonth?.color, month.color);
    // console.log(month.color);

    // dimNotInMonth
    if (typeof yamlMonth?.dimNotInMonth === 'boolean') {
      month.dimNotInMonth = yamlMonth.dimNotInMonth;
    }
    // console.log(month.dimNotInMonth);

    // showStreak
    if (typeof yamlMonth?.showStreak === 'boolean') {
      month.showStreak = yamlMonth.showStreak;
    }
    // console.log(month.showStreak);

    // showTodayRing
    if (typeof yamlMonth?.showTodayRing === 'boolean') {
      month.showTodayRing = yamlMonth.showTodayRing;
    }
    // console.log(month.showTodayRing);

    // showSelectedValue
    if (typeof yamlMonth?.showSelectedValue === 'boolean') {
      month.showSelectedValue = yamlMonth.showSelectedValue;
    }
    // console.log(month.showSelectedValue);

    // showSelectedRing
    if (typeof yamlMonth?.showSelectedRing === 'boolean') {
      month.showSelectedRing = yamlMonth.showSelectedRing;
    }
    // console.log(month.showSelectedRing);

    // circleColor
    month.circleColor = getStringFromInput(
      yamlMonth?.circleColor,
      month.circleColor
    );
    // console.log(month.circleColor);

    // circleColorByValue
    if (typeof yamlMonth?.circleColorByValue === 'boolean') {
      month.circleColorByValue = yamlMonth.circleColorByValue;
    }
    // console.log(month.circleColorByValue);

    // headerYearColor
    month.headerYearColor = getStringFromInput(
      yamlMonth?.headerYearColor,
      month.headerYearColor
    );
    // console.log(month.headerYearColor);

    // headerMonthColor
    month.headerMonthColor = getStringFromInput(
      yamlMonth?.headerMonthColor,
      month.headerMonthColor
    );
    // console.log(month.headerMonthColor);

    // dividingLineColor
    month.dividingLineColor = getStringFromInput(
      yamlMonth?.dividingLineColor,
      month.dividingLineColor
    );
    // console.log(month.dividingLineColor);

    // todayRingColor
    month.todayRingColor = getStringFromInput(
      yamlMonth?.todayRingColor,
      month.todayRingColor
    );
    // console.log(month.todayRingColor);

    // selectedRingColor
    month.selectedRingColor = getStringFromInput(
      yamlMonth?.selectedRingColor,
      month.selectedRingColor
    );
    // console.log(month.selectedRingColor);

    // initMonth
    month.initMonth = getStringFromInput(yamlMonth?.initMonth, month.initMonth);
    // console.log(month.initMonth);

    // showAnnotation
    if (typeof yamlMonth?.showAnnotation === 'boolean') {
      month.showAnnotation = yamlMonth.showAnnotation;
    }
    // console.log(month.showAnnotation);

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
    if (month.annotation.length !== month.dataset.length) {
      const errorMessage =
        'The number of inputs of annotation and dataset not matched';
      return errorMessage;
    }
    // console.log(month.annotation);

    // showAnnotationOfAllTargets
    if (typeof yamlMonth?.showAnnotationOfAllTargets === 'boolean') {
      month.showAnnotationOfAllTargets = yamlMonth.showAnnotationOfAllTargets;
    }
    // console.log(month.showAnnotationOfAllTargets);

    renderInfo.months.push(month);
  } // Month related parameters
  // console.log(renderInfo.month);

  // Heatmap related parameters
  for (const heatmapKey of heatmapKeys) {
    const heatmap = new Heatmap();
    const yamlHeatmap = yaml[heatmapKey];

    const heatmapKeys = getKeys(heatmap);
    const yamlKeys = getKeys(yamlHeatmap);
    // console.log(keysOfHeatmapInfo);
    // console.log(yamlKeys);
    for (const key of yamlKeys) {
      if (!heatmapKeys.includes(key)) {
        errorMessage = "'" + key + "' is not an available key";
        return errorMessage;
      }
    }

    renderInfo.heatmaps.push(heatmap);
  }
  // console.log(renderInfo.heatmap);

  // Bullet related parameters
  for (const bulletKey of bulletKeys) {
    const bullet = new BulletGraph();
    const yamlBullet = yaml[bulletKey];

    const bulletKeys = getKeys(bullet);
    const yamlKeys = getKeys(yamlBullet);
    // console.log(keysOfSummaryInfo);
    // console.log(yamlKeys);
    for (const key of yamlKeys) {
      if (!bulletKeys.includes(key)) {
        errorMessage = "'" + key + "' is not an available key";
        return errorMessage;
      }
    }

    // title
    bullet.title = getStringFromInput(yamlBullet?.title, bullet.title);
    // console.log(bullet.title);

    // dataset
    bullet.dataset = getStringFromInput(yamlBullet?.dataset, bullet.dataset);
    // console.log(bullet.dataset);

    // orientation
    bullet.orientation = getStringFromInput(
      yamlBullet?.orientation,
      bullet.orientation
    );
    // console.log(bullet.orientation);

    // range
    const range = getNumberArray('range', yamlBullet?.range);
    if (typeof range === 'string') return range;

    // Check the value is monotonically increasing
    // Check the value is not negative
    if (range.length === 1) {
      if (range[0] < 0) {
        errorMessage = 'Negative range value is not allowed';
        return errorMessage;
      }
    } else if (range.length > 1) {
      const lastBound = range[0];
      if (lastBound < 0) {
        errorMessage = 'Negative range value is not allowed';
        return errorMessage;
      } else {
        for (let ind = 1; ind < range.length; ind++) {
          if (range[ind] <= lastBound) {
            errorMessage =
              "Values in parameter 'range' should be monotonically increasing";
            return errorMessage;
          }
        }
      }
    } else {
      errorMessage = 'Empty range is not allowed';
      return errorMessage;
    }
    bullet.range = range;
    const numRange = range.length;
    // console.log(renderInfo.bullet.range);

    // range color
    const rangeColor = getStringArrayFromInput(
      'rangeColor',
      yamlBullet?.rangeColor,
      numRange,
      '',
      validateColor,
      true
    );
    if (typeof rangeColor === 'string') {
      return rangeColor; // errorMessage
    }
    bullet.rangeColor = rangeColor;
    // console.log(bullet.rangeColor);

    // actual value, can possess template variable
    bullet.value = getStringFromInput(yamlBullet?.value, bullet.value);
    // console.log(bullet.value);

    // value unit
    bullet.valueUnit = getStringFromInput(
      yamlBullet?.valueUnit,
      bullet.valueUnit
    );
    // console.log(bullet.valueUnit);

    // value color
    bullet.valueColor = getStringFromInput(
      yamlBullet?.valueColor,
      bullet.valueColor
    );
    // console.log(bullet.valueColor);

    // show mark
    if (typeof yamlBullet?.showMarker === 'boolean') {
      bullet.showMarker = yamlBullet.showMarker;
    }
    // console.log(bullet.showMark);

    // mark value
    if (typeof yamlBullet?.markerValue === 'number') {
      bullet.markerValue = yamlBullet.markerValue;
    }
    // console.log(bullet.markValue);

    // mark color
    bullet.markerColor = getStringFromInput(
      yamlBullet?.markerColor,
      bullet.markerColor
    );
    // console.log(bullet.markValue);

    renderInfo.bulletGraphs.push(bullet);
  } // Bullet related parameters
  // console.log(renderInfo.bullet);

  return renderInfo;
};
