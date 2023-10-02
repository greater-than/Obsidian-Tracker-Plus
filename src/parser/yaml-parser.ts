import { TFolder, normalizePath, parseYaml } from 'obsidian';
import { SearchType } from 'src/models/enums';
import Tracker from '../main';
import {
  AspectRatio,
  BarInfo,
  BulletInfo,
  CustomDatasetInfo,
  HeatmapInfo,
  LineInfo,
  Margin,
  MonthInfo,
  PieInfo,
  Query,
  RenderInfo,
  SummaryInfo,
} from '../models/data';
import { DateTimeUtils, StringUtils } from '../utils';
import {
  getAvailableKeysOfClass,
  getBoolArrayFromInput,
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
} from './helper';

// TODO Breakup this function
export const getRenderInfoFromYaml = (
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
  const keysFoundInYAML = getAvailableKeysOfClass(yaml);
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
    const splitted = splitInputByComma(yaml.searchTarget);
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
    searchTarget[ind] = StringUtils.replaceImgTagByAlt(searchTarget[ind]);
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
  const retSearchType = getStringArrayFromInput(
    'searchType',
    yaml.searchType,
    numDatasets,
    '',
    validateSearchType,
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
  const retMultipleValueSeparator = getStringArrayFromInput(
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
  const retXDataset = getNumberArrayFromInput(
    'xDataset',
    yaml.xDataset,
    numDatasets,
    -1,
    true
  );
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
    query.setSeparator(multipleValueSeparator[ind]);
    if (xDataset.includes(ind)) query.usedAsXDataset = true;
    queries.push(query);
  }
  // console.log(queries);

  // Create graph info
  const renderInfo = new RenderInfo(queries);
  const keysOfRenderInfo = getAvailableKeysOfClass(renderInfo);
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
          return q.getId() === customDatasetId;
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
  renderInfo.fileMultiplierAfterLink = getStringFromInput(
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
      startDate = DateTimeUtils.strToDate(strStartDate, renderInfo.dateFormat);
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
      endDate = DateTimeUtils.strToDate(strEndDate, renderInfo.dateFormat);
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
  const retDatasetName = getStringArrayFromInput(
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
  const retConstValue = getNumberArrayFromInput(
    'constValue',
    yaml.constValue,
    numDatasets,
    1.0,
    true
  );
  if (typeof retConstValue === 'string') {
    return retConstValue; // errorMessage
  }
  renderInfo.constValue = retConstValue;
  // console.log(renderInfo.constValue);

  // ignoreAttachedValue
  const retIgnoreAttachedValue = getBoolArrayFromInput(
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
  const retIgnoreZeroValue = getBoolArrayFromInput(
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
  const retAccum = getBoolArrayFromInput(
    'accum',
    yaml.accum,
    numDatasets,
    false,
    true
  );
  if (typeof retAccum === 'string') {
    return retAccum;
  }
  renderInfo.accum = retAccum;
  // console.log(renderInfo.accum);

  // penalty
  const retPenalty = getNumberArrayFromInput(
    'penalty',
    yaml.penalty,
    numDatasets,
    null,
    true
  );
  if (typeof retPenalty === 'string') {
    return retPenalty;
  }
  renderInfo.penalty = retPenalty;
  // console.log(renderInfo.penalty);

  // valueShift
  const retValueShift = getNumberArrayFromInput(
    'valueShift',
    yaml.valueShift,
    numDatasets,
    0,
    true
  );
  if (typeof retValueShift === 'string') {
    return retValueShift;
  }
  renderInfo.valueShift = retValueShift;
  // console.log(renderInfo.valueShift);

  // shiftOnlyValueLargerThan
  const retShiftOnlyValueLargerThan = getNumberArrayFromInput(
    'shiftOnlyValueLargerThan',
    yaml.shiftOnlyValueLargerThan,
    numDatasets,
    null,
    true
  );
  if (typeof retShiftOnlyValueLargerThan === 'string') {
    return retShiftOnlyValueLargerThan;
  }
  renderInfo.shiftOnlyValueLargerThan = retShiftOnlyValueLargerThan;
  // console.log(renderInfo.shiftOnlyValueLargerThan);

  // textValueMap
  if (typeof yaml.textValueMap !== 'undefined') {
    const keys = getAvailableKeysOfClass(yaml.textValueMap);
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
  const retMargin = getNumberArrayFromInput('margin', yaml.margin, 4, 10, true);
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

    const keysOfCustomDatasetInfo = getAvailableKeysOfClass(customDataset);
    const keysFoundInYAML = getAvailableKeysOfClass(yamlCustomDataset);
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
    customDataset.name = getStringFromInput(
      yamlCustomDataset?.name,
      customDataset.name
    );

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
    const line = new LineInfo();
    const yamlLine = yaml[lineKey];

    const keysOfLineInfo = getAvailableKeysOfClass(line);
    const keysFoundInYAML = getAvailableKeysOfClass(yamlLine);
    // console.log(keysOfLineInfo);
    // console.log(keysFoundInYAML);
    for (const key of keysFoundInYAML) {
      if (!keysOfLineInfo.includes(key)) {
        errorMessage = "'" + key + "' is not an available key";
        return errorMessage;
      }
    }

    const retParseCommonChartInfo = parseCommonChartInfo(yamlLine, line);
    if (typeof retParseCommonChartInfo === 'string') {
      return retParseCommonChartInfo;
    }

    // lineColor
    const retLineColor = getStringArrayFromInput(
      'lineColor',
      yamlLine?.lineColor,
      numDatasets,
      '',
      validateColor,
      true
    );
    if (typeof retLineColor === 'string') {
      return retLineColor; // errorMessage
    }
    line.lineColor = retLineColor;
    // console.log(line.lineColor);

    // lineWidth
    const retLineWidth = getNumberArrayFromInput(
      'lineWidth',
      yamlLine?.lineWidth,
      numDatasets,
      1.5,
      true
    );
    if (typeof retLineWidth === 'string') {
      return retLineWidth; // errorMessage
    }
    line.lineWidth = retLineWidth;
    // console.log(line.lineWidth);

    // showLine
    const retShowLine = getBoolArrayFromInput(
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
    const retShowPoint = getBoolArrayFromInput(
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
    const retPointColor = getStringArrayFromInput(
      'pointColor',
      yamlLine?.pointColor,
      numDatasets,
      '#69b3a2',
      validateColor,
      true
    );
    if (typeof retPointColor === 'string') {
      return retPointColor;
    }
    line.pointColor = retPointColor;
    // console.log(line.pointColor);

    // pointBorderColor
    const retPointBorderColor = getStringArrayFromInput(
      'pointBorderColor',
      yamlLine?.pointBorderColor,
      numDatasets,
      '#69b3a2',
      validateColor,
      true
    );
    if (typeof retPointBorderColor === 'string') {
      return retPointBorderColor;
    }
    line.pointBorderColor = retPointBorderColor;
    // console.log(line.pointBorderColor);

    // pointBorderWidth
    const retPointBorderWidth = getNumberArrayFromInput(
      'pointBorderWidth',
      yamlLine?.pointBorderWidth,
      numDatasets,
      0.0,
      true
    );
    if (typeof retPointBorderWidth === 'string') {
      return retPointBorderWidth; // errorMessage
    }
    line.pointBorderWidth = retPointBorderWidth;
    // console.log(line.pointBorderWidth);

    // pointSize
    const retPointSize = getNumberArrayFromInput(
      'pointSize',
      yamlLine?.pointSize,
      numDatasets,
      3.0,
      true
    );
    if (typeof retPointSize === 'string') {
      return retPointSize; // errorMessage
    }
    line.pointSize = retPointSize;
    // console.log(line.pointSize);

    // fillGap
    const retFillGap = getBoolArrayFromInput(
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
    const retYAxisLocation = getStringArrayFromInput(
      'yAxisLocation',
      yamlLine?.yAxisLocation,
      numDatasets,
      'left',
      validateYAxisLocation,
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
    const bar = new BarInfo();
    const yamlBar = yaml[barKey];

    const keysOfBarInfo = getAvailableKeysOfClass(bar);
    const keysFoundInYAML = getAvailableKeysOfClass(yamlBar);
    // console.log(keysOfBarInfo);
    // console.log(keysFoundInYAML);
    for (const key of keysFoundInYAML) {
      if (!keysOfBarInfo.includes(key)) {
        errorMessage = "'" + key + "' is not an available key";
        return errorMessage;
      }
    }

    const retParseCommonChartInfo = parseCommonChartInfo(yamlBar, bar);
    if (typeof retParseCommonChartInfo === 'string') {
      return retParseCommonChartInfo;
    }

    // barColor
    const retBarColor = getStringArrayFromInput(
      'barColor',
      yamlBar?.barColor,
      numDatasets,
      '',
      validateColor,
      true
    );
    if (typeof retBarColor === 'string') {
      return retBarColor; // errorMessage
    }
    bar.barColor = retBarColor;
    // console.log(bar.barColor);

    // yAxisLocation
    const retYAxisLocation = getStringArrayFromInput(
      'yAxisLocation',
      yamlBar?.yAxisLocation,
      numDatasets,
      'left',
      validateYAxisLocation,
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
    const pie = new PieInfo();
    const yamlPie = yaml[pieKey];

    const keysOfPieInfo = getAvailableKeysOfClass(pie);
    const keysFoundInYAML = getAvailableKeysOfClass(yamlPie);
    // console.log(keysOfPieInfo);
    // console.log(keysFoundInYAML);
    for (const key of keysFoundInYAML) {
      if (!keysOfPieInfo.includes(key)) {
        errorMessage = "'" + key + "' is not an available key";
        return errorMessage;
      }
    }

    // title
    pie.title = getStringFromInput(yamlPie?.title, pie.title);
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
    const retDataColor = getStringArrayFromInput(
      'dataColor',
      yamlPie?.dataColor,
      numData,
      null,
      validateColor,
      true
    );
    if (typeof retDataColor === 'string') {
      return retDataColor; // errorMessage
    }
    pie.dataColor = retDataColor;
    // console.log(pie.dataColor);

    // dataName
    const retDataName = getStringArrayFromInput(
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
    const retLabel = getStringArrayFromInput(
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
    const retExtLabel = getStringArrayFromInput(
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

    renderInfo.pie.push(pie);
  } // pie related parameters
  // console.log(renderInfo.pie);

  // summary related parameters
  for (const summaryKey of yamlSummaryKeys) {
    const summary = new SummaryInfo();
    const yamlSummary = yaml[summaryKey];

    const keysOfSummaryInfo = getAvailableKeysOfClass(summary);
    const keysFoundInYAML = getAvailableKeysOfClass(yamlSummary);
    // console.log(keysOfSummaryInfo);
    // console.log(keysFoundInYAML);
    for (const key of keysFoundInYAML) {
      if (!keysOfSummaryInfo.includes(key)) {
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

    renderInfo.summary.push(summary);
  } // summary related parameters

  // Month related parameters
  for (const monthKey of yamlMonthKeys) {
    const month = new MonthInfo();
    const yamlMonth = yaml[monthKey];

    const keysOfMonthInfo = getAvailableKeysOfClass(month);
    const keysFoundInYAML = getAvailableKeysOfClass(yamlMonth);
    // console.log(keysOfSummaryInfo);
    // console.log(keysFoundInYAML);
    for (const key of keysFoundInYAML) {
      if (!keysOfMonthInfo.includes(key)) {
        errorMessage = "'" + key + "' is not an available key";
        return errorMessage;
      }
    }

    // mode
    month.mode = getStringFromInput(yamlMonth?.mode, month.mode);
    // console.log(month.mode);

    // dataset
    const retDataset = getNumberArray('dataset', yamlMonth?.dataset);
    if (typeof retDataset === 'string') {
      return retDataset;
    }
    if (retDataset.length === 0) {
      // insert y dataset given
      for (const q of queries) {
        retDataset.push(q.getId());
      }
    }
    month.dataset = retDataset;
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
    // console.log(month.threshold);

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
    // console.log(month.yMin);

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
    const heatmap = new HeatmapInfo();
    const yamlHeatmap = yaml[heatmapKey];

    const keysOfHeatmapInfo = getAvailableKeysOfClass(heatmap);
    const keysFoundInYAML = getAvailableKeysOfClass(yamlHeatmap);
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
    const bullet = new BulletInfo();
    const yamlBullet = yaml[bulletKey];

    const keysOfBulletInfo = getAvailableKeysOfClass(bullet);
    const keysFoundInYAML = getAvailableKeysOfClass(yamlBullet);
    // console.log(keysOfSummaryInfo);
    // console.log(keysFoundInYAML);
    for (const key of keysFoundInYAML) {
      if (!keysOfBulletInfo.includes(key)) {
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
    const retRangeColor = getStringArrayFromInput(
      'rangeColor',
      yamlBullet?.rangeColor,
      numRange,
      '',
      validateColor,
      true
    );
    if (typeof retRangeColor === 'string') {
      return retRangeColor; // errorMessage
    }
    bullet.rangeColor = retRangeColor;
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

    renderInfo.bullet.push(bullet);
  } // Bullet related parameters
  // console.log(renderInfo.bullet);

  return renderInfo;
};
