import { TFolder, normalizePath, parseYaml } from 'obsidian';
import Tracker from '../main';
import { AspectRatio } from '../models/aspect-ratio';
import { CustomDatasetInfo } from '../models/custom-dataset';
import { SearchType } from '../models/enums';
import { Margin } from '../models/margin';
import { Query } from '../models/query';
import { RenderInfo } from '../models/render-info';
import { BarChart } from '../ui-components/chart/bar-chart.model';
import { LineChart } from '../ui-components/chart/line-chart.model';
import { PieChart } from '../ui-components/chart/pie-chart.model';
import { BulletGraph } from '../ui-components/graph/bullet-graph.model';
import { HeatMap } from '../ui-components/heat-map/heat-map.model';
import { Month } from '../ui-components/month/month.model';
import { Summary } from '../ui-components/summary/summary.model';
import * as helper from '../utils/helper';
import {
  getBooleans,
  getKeys,
  getNumberArray,
  getNumbers,
  getString,
  getStringArray,
  getStrings,
  isColorValid,
  isSearchTypeValid,
  isYAxisLocationValid,
  setCartesianChartInfo,
  splitByComma,
} from './yaml-parser.helper';

// TODO Breakup this function
export const getRenderInfo = (
  yamlText: string,
  plugin: Tracker
): RenderInfo | string => {
  let yaml;
  try {
    // console.log(yamlText);
    yaml = parseYaml(yamlText);
  } catch (err) {
    const errorMessage = 'Error parsing YAML';
    console.log(err);
    return errorMessage;
  }
  if (!yaml) {
    const errorMessage = 'Error parsing YAML';
    return errorMessage;
  }
  // console.log(yaml);
  const keysFoundInYAML = getKeys(yaml);
  // console.log(keysFoundInYAML);

  let errorMessage = '';

  // Search target
  if (!keysFoundInYAML.includes('searchTarget')) {
    const errorMessage = "Parameter 'searchTarget' not found in YAML";
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
    const splitted = splitByComma(yaml.searchTarget);
    // console.log(splitted);
    if (splitted.length > 1) {
      for (let piece of splitted) {
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
    searchTarget[ind] = helper.replaceImgTagByAlt(searchTarget[ind]);
  }
  // console.log(searchTarget);

  if (errorMessage !== '') {
    return errorMessage;
  }

  const numDatasets = searchTarget.length;

  // Search type
  if (!keysFoundInYAML.includes('searchType')) {
    const errorMessage = "Parameter 'searchType' not found in YAML";
    return errorMessage;
  }
  const searchType: Array<SearchType> = [];
  const retSearchType = getStrings(
    'searchType',
    yaml.searchType,
    numDatasets,
    '',
    isSearchTypeValid,
    false
  );
  if (typeof retSearchType === 'string') {
    return retSearchType; // errorMessage
  }
  for (const strType of retSearchType) {
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
        searchType.push(SearchType.DataviewField);
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
  const retMultipleValueSeparator = getStrings(
    'separator',
    yaml.separator,
    numDatasets,
    '', // set the default value later
    null,
    true
  );
  if (typeof retMultipleValueSeparator === 'string') {
    return retMultipleValueSeparator; // errorMessage
  }
  multipleValueSeparator = retMultipleValueSeparator.map((sep) => {
    if (sep === 'comma' || sep === '\\,') {
      return ',';
    }
    return sep;
  });
  // console.log(multipleValueSeparator);

  // xDataset
  const retXDataset = getNumbers('xDataset', yaml.xDataset, {
    valueCount: numDatasets,
    defaultValue: -1,
    allowInvalidValue: true,
  });
  if (typeof retXDataset === 'string') {
    return retXDataset; // errorMessage
  }
  const xDataset = retXDataset.map((d: number) => {
    if (d < 0 || d >= numDatasets) {
      return -1;
    }
    return d;
  });
  // assign this to renderInfo later

  // Create queries
  const queries: Array<Query> = [];
  for (let ind = 0; ind < searchTarget.length; ind++) {
    const query = new Query(queries.length, searchType[ind], searchTarget[ind]);
    query.separator = multipleValueSeparator[ind];
    if (xDataset.includes(ind)) query.usedAsXDataset = true;
    queries.push(query);
  }
  // console.log(queries);

  // Create graph info
  const renderInfo = new RenderInfo(queries);
  const keysOfRenderInfo = getKeys(renderInfo);
  const additionalAllowedKeys = ['searchType', 'searchTarget', 'separator'];
  // console.log(keysOfRenderInfo);
  const yamlLineKeys = [];
  const yamlBarKeys = [];
  const yamlPieKeys = [];
  const yamlSummaryKeys = [];
  const yamlMonthKeys = [];
  const yamlHeatmapKeys = [];
  const yamlBulletKeys = [];
  for (const key of keysFoundInYAML) {
    if (/^line[0-9]*$/.test(key)) {
      yamlLineKeys.push(key);
      additionalAllowedKeys.push(key);
    }
    if (/^bar[0-9]*$/.test(key)) {
      yamlBarKeys.push(key);
      additionalAllowedKeys.push(key);
    }
    if (/^pie[0-9]*$/.test(key)) {
      yamlPieKeys.push(key);
      additionalAllowedKeys.push(key);
    }
    if (/^summary[0-9]*$/.test(key)) {
      yamlSummaryKeys.push(key);
      additionalAllowedKeys.push(key);
    }
    if (/^bullet[0-9]*$/.test(key)) {
      yamlBulletKeys.push(key);
      additionalAllowedKeys.push(key);
    }
    if (/^month[0-9]*$/.test(key)) {
      yamlMonthKeys.push(key);
      additionalAllowedKeys.push(key);
    }
    if (/^heatmap[0-9]*$/.test(key)) {
      yamlHeatmapKeys.push(key);
      additionalAllowedKeys.push(key);
    }
  }
  // Custom dataset
  const yamlCustomDatasetKeys = [];
  for (const key of keysFoundInYAML) {
    if (/^dataset[0-9]*$/.test(key)) {
      // Check the id of custom dataset is not duplicated
      let customDatasetId = -1;
      const strCustomDatasetId = key.replace('dataset', '');
      if (strCustomDatasetId === '') {
        customDatasetId = 0;
      } else {
        customDatasetId = parseFloat(strCustomDatasetId);
      }

      if (
        queries.some((q) => {
          return q.id === customDatasetId;
        })
      ) {
        errorMessage = "Duplicated dataset id for key '" + key + "'";
        return errorMessage;
      }

      yamlCustomDatasetKeys.push(key);
      additionalAllowedKeys.push(key);
    }
  }
  // console.log(additionalAllowedKeys);
  for (const key of keysFoundInYAML) {
    if (
      !keysOfRenderInfo.includes(key) &&
      !additionalAllowedKeys.includes(key)
    ) {
      errorMessage = "'" + key + "' is not an available key";
      return errorMessage;
    }
  }

  const totalNumOutputs =
    yamlLineKeys.length +
    yamlBarKeys.length +
    yamlPieKeys.length +
    yamlSummaryKeys.length +
    yamlBulletKeys.length +
    yamlMonthKeys.length +
    yamlHeatmapKeys.length;
  if (totalNumOutputs === 0) {
    return 'No output parameter provided, please place line, bar, pie, month, bullet, or summary.';
  }

  // Root folder to search
  renderInfo.folder = getString(yaml?.folder, plugin.settings.folder);
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
    const retFiles = getStringArray('file', yaml.file);
    if (typeof retFiles === 'string') {
      return retFiles; // error message
    }
    renderInfo.file = retFiles;
  }
  // console.log(renderInfo.file);

  // specifiedFilesOnly
  if (typeof yaml.specifiedFilesOnly === 'boolean') {
    renderInfo.specifiedFilesOnly = yaml.specifiedFilesOnly;
  }
  // console.log(renderInfo.specifiedFilesOnly);

  // fileContainsLinkedFiles
  if (typeof yaml.fileContainsLinkedFiles === 'string') {
    const retFiles = getStringArray(
      'fileContainsLinkedFiles',
      yaml.fileContainsLinkedFiles
    );
    if (typeof retFiles === 'string') {
      return retFiles;
    }
    renderInfo.fileContainsLinkedFiles = retFiles;
  }
  // console.log(renderInfo.fileContainsLinkedFiles);

  // fileMultiplierAfterLink
  renderInfo.fileMultiplierAfterLink = getString(
    yaml?.fileMultiplierAfterLink,
    renderInfo.fileMultiplierAfterLink
  );
  // console.log(renderInfo.fileMultiplierAfterLink);

  // Date format
  const dateFormat = yaml.dateFormat;
  //?? not sure why I need this to make it work,
  // without it, the assigned the renderInfo.dateFormat will become undefined
  if (typeof yaml.dateFormat === 'string') {
    if (yaml.dateFormat === '') {
      renderInfo.dateFormat = plugin.settings.dateFormat;
    } else {
      renderInfo.dateFormat = dateFormat;
    }
  } else {
    renderInfo.dateFormat = plugin.settings.dateFormat;
  }
  // console.log("renderInfo dateFormat: " + renderInfo.dateFormat);

  // Date format prefix
  renderInfo.dateFormatPrefix = getString(
    yaml?.dateFormatPrefix,
    renderInfo.dateFormatPrefix
  );

  // Date format suffix
  renderInfo.dateFormatSuffix = getString(
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
    const strStartDate = helper.getDateStringFromInputString(
      yaml.startDate,
      renderInfo.dateFormatPrefix,
      renderInfo.dateFormatSuffix
    );
    // console.log(strStartDate);

    // relative date
    let startDate = null;
    let isStartDateValid = false;
    startDate = helper.getDateByDurationToToday(
      strStartDate,
      renderInfo.dateFormat
    );
    // console.log(startDate);

    if (startDate) {
      isStartDateValid = true;
    } else {
      startDate = helper.strToDate(strStartDate, renderInfo.dateFormat);
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
  const retDatasetName = getStrings(
    'datasetName',
    yaml.datasetName,
    numDatasets,
    'untitled',
    null,
    true
  );
  if (typeof retDatasetName === 'string') {
    return retDatasetName; // errorMessage
  }
  // rename untitled
  let indUntitled = 0;
  for (let ind = 0; ind < retDatasetName.length; ind++) {
    if (renderInfo.xDataset.includes(ind)) continue;
    if (retDatasetName[ind] === 'untitled') {
      retDatasetName[ind] = 'untitled' + indUntitled.toString();
      indUntitled++;
    }
  }
  // Check duplicated names
  if (new Set(retDatasetName).size === retDatasetName.length) {
    renderInfo.datasetName = retDatasetName;
  } else {
    const errorMessage = 'Not enough dataset names or duplicated names';
    return errorMessage;
  }
  // console.log(renderInfo.datasetName);

  // constValue
  const retConstValue = getNumbers('constValue', yaml.constValue, {
    valueCount: numDatasets,
    defaultValue: 1.0,
    allowInvalidValue: true,
  });
  if (typeof retConstValue === 'string') {
    return retConstValue; // errorMessage
  }
  renderInfo.constValue = retConstValue;
  // console.log(renderInfo.constValue);

  // ignoreAttachedValue
  const retIgnoreAttachedValue = getBooleans(
    'ignoreAttachedValue',
    yaml.ignoreAttachedValue,
    numDatasets,
    false,
    true
  );
  if (typeof retIgnoreAttachedValue === 'string') {
    return retIgnoreAttachedValue;
  }
  renderInfo.ignoreAttachedValue = retIgnoreAttachedValue;
  // console.log(renderInfo.ignoreAttachedValue);

  // ignoreZeroValue
  const retIgnoreZeroValue = getBooleans(
    'ignoreZeroValue',
    yaml.ignoreZeroValue,
    numDatasets,
    false,
    true
  );
  if (typeof retIgnoreZeroValue === 'string') {
    return retIgnoreZeroValue;
  }
  renderInfo.ignoreZeroValue = retIgnoreZeroValue;
  // console.log(renderInfo.ignoreAttachedValue);

  // accum
  const retAccum = getBooleans('accum', yaml.accum, numDatasets, false, true);
  if (typeof retAccum === 'string') {
    return retAccum;
  }
  renderInfo.accum = retAccum;
  // console.log(renderInfo.accum);

  // penalty
  const retPenalty = getNumbers('penalty', yaml.penalty, {
    valueCount: numDatasets,
    defaultValue: null,
    allowInvalidValue: true,
  });
  if (typeof retPenalty === 'string') {
    return retPenalty;
  }
  renderInfo.penalty = retPenalty;
  // console.log(renderInfo.penalty);

  // valueShift
  const retValueShift = getNumbers('valueShift', yaml.valueShift, {
    valueCount: numDatasets,
    defaultValue: 0,
    allowInvalidValue: true,
  });
  if (typeof retValueShift === 'string') {
    return retValueShift;
  }
  renderInfo.valueShift = retValueShift;
  // console.log(renderInfo.valueShift);

  // shiftOnlyValueLargerThan
  const retShiftOnlyValueLargerThan = getNumbers(
    'shiftOnlyValueLargerThan',
    yaml.shiftOnlyValueLargerThan,
    {
      valueCount: numDatasets,
      defaultValue: null,
      allowInvalidValue: true,
    }
  );
  if (typeof retShiftOnlyValueLargerThan === 'string') {
    return retShiftOnlyValueLargerThan;
  }
  renderInfo.shiftOnlyValueLargerThan = retShiftOnlyValueLargerThan;
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
    const pattern = /([0-9]*):([0-9]*)/;
    let parts = yaml.aspectRatio.match(pattern);
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
  const retMargin = getNumbers('margin', yaml.margin, {
    valueCount: 4,
    defaultValue: 10,
    allowInvalidValue: true,
  });
  if (typeof retMargin === 'string') {
    return retMargin; // errorMessage
  }
  if (retMargin.length > 4) {
    return 'margin accepts not more than four values for top, right, bottom, and left margins.';
  }
  renderInfo.margin = new Margin(
    retMargin[0],
    retMargin[1],
    retMargin[2],
    retMargin[3]
  );
  // console.log(renderInfo.margin);

  // customDataset related parameters
  for (const datasetKey of yamlCustomDatasetKeys) {
    const customDataset = new CustomDatasetInfo();
    const yamlCustomDataset = yaml[datasetKey];

    const keysOfCustomDatasetInfo = getKeys(customDataset);
    const keysFoundInYAML = getKeys(yamlCustomDataset);
    // console.log(keysOfCustomDatasetInfo);
    // console.log(keysFoundInYAML);
    for (const key of keysFoundInYAML) {
      if (!keysOfCustomDatasetInfo.includes(key)) {
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
    customDataset.name = getString(yamlCustomDataset?.name, customDataset.name);

    // xData
    const retXData = getStringArray('xData', yamlCustomDataset?.xData);
    if (typeof retXData === 'string') {
      return retXData;
    }
    customDataset.xData = retXData;
    // console.log(customDataset.xData);
    const numXData = customDataset.xData.length;

    // yData
    const retYData = getStringArray('yData', yamlCustomDataset?.yData);
    if (typeof retYData === 'string') {
      return retYData;
    }
    customDataset.yData = retYData;
    // console.log(customDataset.yData);
    if (customDataset.yData.length !== numXData) {
      const errorMessage = 'Number of elements in xData and yData not matched';
      return errorMessage;
    }

    renderInfo.customDataset.push(customDataset);
  } // customDataset related parameters
  // console.log(renderInfo.customDataset);

  // line related parameters
  for (const lineKey of yamlLineKeys) {
    const line = new LineChart();
    const yamlLine = yaml[lineKey];

    const keysOfLineInfo = getKeys(line);
    const keysFoundInYAML = getKeys(yamlLine);
    // console.log(keysOfLineInfo);
    // console.log(keysFoundInYAML);
    for (const key of keysFoundInYAML) {
      if (!keysOfLineInfo.includes(key)) {
        errorMessage = "'" + key + "' is not an available key";
        return errorMessage;
      }
    }

    const retParseCommonChartInfo = setCartesianChartInfo(yamlLine, line);
    if (typeof retParseCommonChartInfo === 'string') {
      return retParseCommonChartInfo;
    }

    // lineColor
    const retLineColor = getStrings(
      'lineColor',
      yamlLine?.lineColor,
      numDatasets,
      '',
      isColorValid,
      true
    );
    if (typeof retLineColor === 'string') {
      return retLineColor; // errorMessage
    }
    line.lineColor = retLineColor;
    // console.log(line.lineColor);

    // lineWidth
    const retLineWidth = getNumbers('lineWidth', yamlLine?.lineWidth, {
      valueCount: numDatasets,
      defaultValue: 1.5,
      allowInvalidValue: true,
    });
    if (typeof retLineWidth === 'string') {
      return retLineWidth; // errorMessage
    }
    line.lineWidth = retLineWidth;
    // console.log(line.lineWidth);

    // showLine
    const retShowLine = getBooleans(
      'showLine',
      yamlLine?.showLine,
      numDatasets,
      true,
      true
    );
    if (typeof retShowLine === 'string') {
      return retShowLine;
    }
    line.showLine = retShowLine;
    // console.log(line.showLine);

    // showPoint
    const retShowPoint = getBooleans(
      'showPoint',
      yamlLine?.showPoint,
      numDatasets,
      true,
      true
    );
    if (typeof retShowPoint === 'string') {
      return retShowPoint;
    }
    line.showPoint = retShowPoint;
    // console.log(line.showPoint);

    // pointColor
    const retPointColor = getStrings(
      'pointColor',
      yamlLine?.pointColor,
      numDatasets,
      '#69b3a2',
      isColorValid,
      true
    );
    if (typeof retPointColor === 'string') {
      return retPointColor;
    }
    line.pointColor = retPointColor;
    // console.log(line.pointColor);

    // pointBorderColor
    const retPointBorderColor = getStrings(
      'pointBorderColor',
      yamlLine?.pointBorderColor,
      numDatasets,
      '#69b3a2',
      isColorValid,
      true
    );
    if (typeof retPointBorderColor === 'string') {
      return retPointBorderColor;
    }
    line.pointBorderColor = retPointBorderColor;
    // console.log(line.pointBorderColor);

    // pointBorderWidth
    const retPointBorderWidth = getNumbers(
      'pointBorderWidth',
      yamlLine?.pointBorderWidth,
      { valueCount: numDatasets, defaultValue: 0.0, allowInvalidValue: true }
    );
    if (typeof retPointBorderWidth === 'string') {
      return retPointBorderWidth; // errorMessage
    }
    line.pointBorderWidth = retPointBorderWidth;
    // console.log(line.pointBorderWidth);

    // pointSize
    const retPointSize = getNumbers('pointSize', yamlLine?.pointSize, {
      valueCount: numDatasets,
      defaultValue: 3.0,
      allowInvalidValue: true,
    });
    if (typeof retPointSize === 'string') {
      return retPointSize; // errorMessage
    }
    line.pointSize = retPointSize;
    // console.log(line.pointSize);

    // fillGap
    const retFillGap = getBooleans(
      'fillGap',
      yamlLine?.fillGap,
      numDatasets,
      false,
      true
    );
    if (typeof retFillGap === 'string') {
      return retFillGap;
    }
    line.fillGap = retFillGap;
    // console.log(line.fillGap);

    // yAxisLocation
    const retYAxisLocation = getStrings(
      'yAxisLocation',
      yamlLine?.yAxisLocation,
      numDatasets,
      'left',
      isYAxisLocationValid,
      true
    );
    if (typeof retYAxisLocation === 'string') {
      return retYAxisLocation; // errorMessage
    }
    line.yAxisLocation = retYAxisLocation;
    // console.log(line.yAxisLocation);

    renderInfo.line.push(line);
  } // line related parameters
  // console.log(renderInfo.line);

  // bar related parameters
  for (const barKey of yamlBarKeys) {
    const bar = new BarChart();
    const yamlBar = yaml[barKey];

    const keysOfBarInfo = getKeys(bar);
    const keysFoundInYAML = getKeys(yamlBar);
    // console.log(keysOfBarInfo);
    // console.log(keysFoundInYAML);
    for (const key of keysFoundInYAML) {
      if (!keysOfBarInfo.includes(key)) {
        errorMessage = "'" + key + "' is not an available key";
        return errorMessage;
      }
    }

    const retParseCommonChartInfo = setCartesianChartInfo(yamlBar, bar);
    if (typeof retParseCommonChartInfo === 'string') {
      return retParseCommonChartInfo;
    }

    // barColor
    const retBarColor = getStrings(
      'barColor',
      yamlBar?.barColor,
      numDatasets,
      '',
      isColorValid,
      true
    );
    if (typeof retBarColor === 'string') {
      return retBarColor; // errorMessage
    }
    bar.barColor = retBarColor;
    // console.log(bar.barColor);

    // yAxisLocation
    const retYAxisLocation = getStrings(
      'yAxisLocation',
      yamlBar?.yAxisLocation,
      numDatasets,
      'left',
      isYAxisLocationValid,
      true
    );
    if (typeof retYAxisLocation === 'string') {
      return retYAxisLocation; // errorMessage
    }
    bar.yAxisLocation = retYAxisLocation;
    // console.log(bar.yAxisLocation);

    renderInfo.bar.push(bar);
  } // bar related parameters
  // console.log(renderInfo.bar);

  // pie related parameters
  for (const pieKey of yamlPieKeys) {
    const pie = new PieChart();
    const yamlPie = yaml[pieKey];

    const keysOfPieInfo = getKeys(pie);
    const keysFoundInYAML = getKeys(yamlPie);
    // console.log(keysOfPieInfo);
    // console.log(keysFoundInYAML);
    for (const key of keysFoundInYAML) {
      if (!keysOfPieInfo.includes(key)) {
        errorMessage = "'" + key + "' is not an available key";
        return errorMessage;
      }
    }

    // title
    pie.title = getString(yamlPie?.title, pie.title);
    // console.log(pie.title);

    // data
    const retData = getStringArray('data', yamlPie?.data);
    if (typeof retData === 'string') {
      return retData;
    }
    pie.data = retData;
    // console.log(pie.data);
    const numData = pie.data.length;

    // dataColor
    const retDataColor = getStrings(
      'dataColor',
      yamlPie?.dataColor,
      numData,
      null,
      isColorValid,
      true
    );
    if (typeof retDataColor === 'string') {
      return retDataColor; // errorMessage
    }
    pie.dataColor = retDataColor;
    // console.log(pie.dataColor);

    // dataName
    const retDataName = getStrings(
      'dataName',
      yamlPie?.dataName,
      numData,
      '',
      null,
      true
    );
    if (typeof retDataName === 'string') {
      return retDataName; // errorMessage
    }
    pie.dataName = retDataName;
    // console.log(pie.dataName);

    // label
    const retLabel = getStrings(
      'label',
      yamlPie?.label,
      numData,
      '',
      null,
      true
    );
    if (typeof retLabel === 'string') {
      return retLabel; // errorMessage
    }
    pie.label = retLabel;
    // console.log(pie.label);

    // hideLabelLessThan
    if (typeof yamlPie?.hideLabelLessThan === 'number') {
      pie.hideLabelLessThan = yamlPie.hideLabelLessThan;
    }
    // console.log(pie.hideLabelLessThan);

    // extLabel
    const retExtLabel = getStrings(
      'extLabel',
      yamlPie?.extLabel,
      numData,
      '',
      null,
      true
    );
    if (typeof retExtLabel === 'string') {
      return retExtLabel; // errorMessage
    }
    pie.extLabel = retExtLabel;
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
    pie.legendPosition = getString(yamlPie?.legendPosition, 'right');

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
    pie.legendOrientation = getString(
      yamlPie?.legendOrientation,
      defaultLegendOrientation
    );
    // console.log(pie.legendPosition);
    // console.log(pie.legendOrientation);

    // legendBgColor
    pie.legendBgColor = getString(yamlPie?.legendBgColor, pie.legendBgColor);

    // legendBorderColor
    pie.legendBorderColor = getString(
      yamlPie?.legendBorderColor,
      pie.legendBorderColor
    );

    renderInfo.pie.push(pie);
  } // pie related parameters
  // console.log(renderInfo.pie);

  // summary related parameters
  for (const summaryKey of yamlSummaryKeys) {
    const summary = new Summary();
    const yamlSummary = yaml[summaryKey];

    const keysOfSummaryInfo = getKeys(summary);
    const keysFoundInYAML = getKeys(yamlSummary);
    // console.log(keysOfSummaryInfo);
    // console.log(keysFoundInYAML);
    for (const key of keysFoundInYAML) {
      if (!keysOfSummaryInfo.includes(key)) {
        errorMessage = "'" + key + "' is not an available key";
        return errorMessage;
      }
    }

    // template
    summary.template = getString(yamlSummary?.template, summary.template);

    // style
    summary.style = getString(yamlSummary?.style, summary.style);

    renderInfo.summary.push(summary);
  } // summary related parameters

  // Month related parameters
  for (const monthKey of yamlMonthKeys) {
    const month = new Month();
    const yamlMonth = yaml[monthKey];

    const keysOfMonthInfo = getKeys(month);
    const keysFoundInYAML = getKeys(yamlMonth);
    // console.log(keysOfSummaryInfo);
    // console.log(keysFoundInYAML);
    for (const key of keysFoundInYAML) {
      if (!keysOfMonthInfo.includes(key)) {
        errorMessage = "'" + key + "' is not an available key";
        return errorMessage;
      }
    }

    // mode
    month.mode = getString(yamlMonth?.mode, month.mode);
    // console.log(month.mode);

    // dataset
    const retDataset = getNumberArray('dataset', yamlMonth?.dataset);
    if (typeof retDataset === 'string') {
      return retDataset;
    }
    if (retDataset.length === 0) {
      // insert y dataset given
      for (const q of queries) {
        retDataset.push(q.id);
      }
    }
    month.dataset = retDataset;
    // console.log(month.dataset);
    const numDataset = month.dataset.length;

    // startWeekOn
    month.startWeekOn = getString(yamlMonth?.startWeekOn, month.startWeekOn);

    // showCircle
    if (typeof yamlMonth?.showCircle === 'boolean') {
      month.showCircle = yamlMonth.showCircle;
    }

    // threshold
    const retThreshold = getNumberArray('threshold', yamlMonth?.threshold);
    if (typeof retThreshold === 'string') {
      return retThreshold;
    }
    month.threshold = retThreshold;
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

    // yMin
    const retYMin = getNumberArray('yMin', yamlMonth?.yMin);
    if (typeof retYMin === 'string') {
      return retYMin;
    }
    month.yMin = retYMin;
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

    // yMax
    const retYMax = getNumberArray('yMax', yamlMonth?.yMax);
    if (typeof retYMax === 'string') {
      return retYMax;
    }
    month.yMax = retYMax;
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

    // color
    month.color = getString(yamlMonth?.color, month.color);
    // console.log(month.color);

    // dimNotInMonth
    if (typeof yamlMonth?.dimNotInMonth === 'boolean') {
      month.dimNotInMonth = yamlMonth.dimNotInMonth;
    }

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

    // showSelectedRing
    if (typeof yamlMonth?.showSelectedRing === 'boolean') {
      month.showSelectedRing = yamlMonth.showSelectedRing;
    }

    // circleColor
    month.circleColor = getString(yamlMonth?.circleColor, month.circleColor);
    // console.log(month.circleColor);

    // circleColorByValue
    if (typeof yamlMonth?.circleColorByValue === 'boolean') {
      month.circleColorByValue = yamlMonth.circleColorByValue;
    }
    // console.log(month.circleColorByValue);

    // headerYearColor
    month.headerYearColor = getString(
      yamlMonth?.headerYearColor,
      month.headerYearColor
    );
    // console.log(month.headerYearColor);

    // headerMonthColor
    month.headerMonthColor = getString(
      yamlMonth?.headerMonthColor,
      month.headerMonthColor
    );
    // console.log(month.headerMonthColor);

    // dividingLineColor
    month.dividingLineColor = getString(
      yamlMonth?.dividingLineColor,
      month.dividingLineColor
    );
    // console.log(month.dividingLineColor);

    // todayRingColor
    month.todayRingColor = getString(
      yamlMonth?.todayRingColor,
      month.todayRingColor
    );
    // console.log(month.todayRingColor);

    // selectedRingColor
    month.selectedRingColor = getString(
      yamlMonth?.selectedRingColor,
      month.selectedRingColor
    );
    // console.log(month.selectedRingColor);

    // initMonth
    month.initMonth = getString(yamlMonth?.initMonth, month.initMonth);
    // console.log(month.initMonth);

    // showAnnotation
    if (typeof yamlMonth?.showAnnotation === 'boolean') {
      month.showAnnotation = yamlMonth.showAnnotation;
    }
    // console.log(month.showAnnotation);

    // annotation
    const retAnnotation = getStringArray('annotation', yamlMonth?.annotation);
    if (typeof retAnnotation === 'string') {
      return retAnnotation;
    }
    month.annotation = retAnnotation;
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

    renderInfo.month.push(month);
  } // Month related parameters
  // console.log(renderInfo.month);

  // Heatmap related parameters
  for (const heatmapKey of yamlHeatmapKeys) {
    const heatmap = new HeatMap();
    const yamlHeatmap = yaml[heatmapKey];

    const keysOfHeatmapInfo = getKeys(heatmap);
    const keysFoundInYAML = getKeys(yamlHeatmap);
    // console.log(keysOfHeatmapInfo);
    // console.log(keysFoundInYAML);
    for (const key of keysFoundInYAML) {
      if (!keysOfHeatmapInfo.includes(key)) {
        errorMessage = "'" + key + "' is not an available key";
        return errorMessage;
      }
    }

    renderInfo.heatmap.push(heatmap);
  }
  // console.log(renderInfo.heatmap);

  // Bullet related parameters
  for (const bulletKey of yamlBulletKeys) {
    const bullet = new BulletGraph();
    const yamlBullet = yaml[bulletKey];

    const keysOfBulletInfo = getKeys(bullet);
    const keysFoundInYAML = getKeys(yamlBullet);
    // console.log(keysOfSummaryInfo);
    // console.log(keysFoundInYAML);
    for (const key of keysFoundInYAML) {
      if (!keysOfBulletInfo.includes(key)) {
        errorMessage = "'" + key + "' is not an available key";
        return errorMessage;
      }
    }

    // title
    bullet.title = getString(yamlBullet?.title, bullet.title);
    // console.log(bullet.title);

    // dataset
    bullet.dataset = getString(yamlBullet?.dataset, bullet.dataset);
    // console.log(bullet.dataset);

    // orientation
    bullet.orientation = getString(yamlBullet?.orientation, bullet.orientation);
    // console.log(bullet.orientation);

    // range
    const retRange = getNumberArray('range', yamlBullet?.range);
    if (typeof retRange === 'string') {
      return retRange;
    }
    const range = retRange as Array<number>;
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
    const retRangeColor = getStrings(
      'rangeColor',
      yamlBullet?.rangeColor,
      numRange,
      '',
      isColorValid,
      true
    );
    if (typeof retRangeColor === 'string') {
      return retRangeColor; // errorMessage
    }
    bullet.rangeColor = retRangeColor;
    // console.log(bullet.rangeColor);

    // actual value, can possess template variable
    bullet.value = getString(yamlBullet?.value, bullet.value);
    // console.log(bullet.value);

    // value unit
    bullet.valueUnit = getString(yamlBullet?.valueUnit, bullet.valueUnit);
    // console.log(bullet.valueUnit);

    // value color
    bullet.valueColor = getString(yamlBullet?.valueColor, bullet.valueColor);
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
    bullet.markerColor = getString(yamlBullet?.markerColor, bullet.markerColor);
    // console.log(bullet.markValue);

    renderInfo.bullet.push(bullet);
  } // Bullet related parameters
  // console.log(renderInfo.bullet);

  return renderInfo;
};
