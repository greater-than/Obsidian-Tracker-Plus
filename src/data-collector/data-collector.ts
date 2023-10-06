import { CachedMetadata, TFile, Vault, normalizePath } from 'obsidian';
import { SearchType, ValueType } from '../models/enums';
import { ProcessInfo } from '../models/process-info';
import { Query } from '../models/query';
import { RenderInfo } from '../models/render-info';
import { TableData } from '../models/table-data';
import { DataMap, XValueMap } from '../models/types';
import {
  CountUtils,
  DateTimeUtils,
  NumberUtils,
  ObjectUtils,
  StringUtils,
} from '../utils';
import {
  addToDataMap,
  extractDataUsingRegexWithMultipleValues,
  extractDateUsingRegexWithValue,
} from './helper';
import Moment = moment.Moment;

// ref: https://www.rapidtables.com/code/text/unicode-characters.html
const CurrencyCodes =
  '\u0024\u20AC\u00A3\u00A5\u00A2\u20B9\u20A8\u20B1\u20A9\u0E3F\u20AB\u20AA';
const AlphabetCodes = '\u03B1-\u03C9\u0391-\u03A9';
const IntellectualPropertyCodes = '\u00A9\u00AE\u2117\u2122\u2120';
const CJKCodes = '\u4E00-\u9FFF\u3400-\u4DBF\u3000\u3001-\u303F';
const WordCharacters =
  '\\w' + CurrencyCodes + AlphabetCodes + IntellectualPropertyCodes + CJKCodes;

// fileBaseName is a string contains dateFormat only
export const getDateFromFilename = (
  file: TFile,
  renderInfo: RenderInfo
): Moment => {
  // console.log(`getDateFromFilename: ${file.name}`);
  // Get date form fileBaseName

  const fileBaseName = file.basename;

  const dateString = DateTimeUtils.getDateStringFromInputString(
    fileBaseName,
    renderInfo.dateFormatPrefix,
    renderInfo.dateFormatSuffix
  );
  // console.log(dateString);

  const fileDate = DateTimeUtils.stringToDate(
    dateString,
    renderInfo.dateFormat
  );
  // console.log(fileDate);

  return fileDate;
};

// Not support multiple targets
// In form 'key: value', target used to identify 'frontmatter key'
export const getDateFromFrontmatter = (
  fileCache: CachedMetadata,
  query: Query,
  renderInfo: RenderInfo
): Moment => {
  // console.log("getDateFromFrontmatter");
  // Get date from 'frontMatterKey: date'

  let date = window.moment('');

  const frontMatter = fileCache.frontmatter;
  if (frontMatter) {
    if (ObjectUtils.getDeepValue(frontMatter, query.target)) {
      let strDate = ObjectUtils.getDeepValue(frontMatter, query.target);

      // We only support single value for now
      if (typeof strDate === 'string') {
        strDate = DateTimeUtils.getDateStringFromInputString(
          strDate,
          renderInfo.dateFormatPrefix,
          renderInfo.dateFormatSuffix
        );

        date = DateTimeUtils.stringToDate(strDate, renderInfo.dateFormat);
        // console.log(date);
      }
    }
  }

  return date;
};

// Not support multiple targets
// In form 'key: value', name group 'value' from plugin, not from users
export const getDateFromTag = (
  content: string,
  query: Query,
  renderInfo: RenderInfo
): Moment => {
  // console.log("getDateFromTag");
  // Get date from '#tagName: date'
  // Inline value-attached tag only

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const date = window.moment('');

  let tagName = query.target;
  if (query.parentTarget) {
    tagName = query.parentTarget; // use parent tag name for multiple values
  }
  // console.log(tagName);

  const pattern =
    '(^|\\s)#' +
    tagName +
    '(\\/[\\w-]+)*(:(?<value>[\\d\\.\\/-]*)[a-zA-Z]*)?([\\.!,\\?;~-]*)?(\\s|$)';
  // console.log(pattern);

  return extractDateUsingRegexWithValue(content, pattern, renderInfo);
};

// Not support multiple targets
// In form 'regex with value', name group 'value' from users
export const getDateFromText = (
  content: string,
  query: Query,
  renderInfo: RenderInfo
): Moment => {
  // console.log("getDateFromText");
  // Get date from text using regex with value

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const date = window.moment('');

  const pattern = query.target;
  // console.log(strTextRegex);

  return extractDateUsingRegexWithValue(content, pattern, renderInfo);
};

// Not support multiple targets
// In form 'key::value', named group 'value' from plugin
export const getDateFromDvField = (
  content: string,
  query: Query,
  renderInfo: RenderInfo
): Moment => {
  // console.log("getDateFromDvField");
  // Get date form 'targetName:: date'

  // TODO Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const date = window.moment('');

  let target = query.parentTarget ?? query.target;

  // Dataview ask user to add dashes for spaces as search target
  // So a dash may stands for a real dash or a space
  target = target.replace('-', '[\\s\\-]');

  // Test this in Regex101
  // remember '\s' includes new line
  // (^| |\t)\*{0,2}dvTarget\*{0,2}(::[ |\t]*(?<value>[\d\.\/\-\w,@; \t:]*))(\r?\n|\r|$)
  const pattern =
    '(^| |\\t)\\*{0,2}' +
    target +
    '\\*{0,2}(::[ |\\t]*(?<value>[\\d\\.\\/\\-\\w,@; \\t:]*))(\\r\\?\\n|\\r|$)';
  // console.log(pattern);

  return extractDateUsingRegexWithValue(content, pattern, renderInfo);
};

// Not support multiple targets
// In form 'regex with value', name group 'value' from users
export const getDateFromWiki = (
  metadata: CachedMetadata,
  query: Query,
  renderInfo: RenderInfo
): Moment => {
  // console.log("getDateFromWiki");
  // Get date from '[[regex with value]]'

  const date = window.moment('');

  const links = metadata.links;
  if (!links) return date;

  const searchTarget = query.target;
  const searchType = query.type;

  for (const link of links) {
    if (!link) continue;

    let wikiText = '';
    if (searchType === SearchType.WikiLink) {
      // wiki.link point to a file name
      // a colon is not allowed be in file name
      wikiText = link.link;
    } else if (searchType === SearchType.WikiDisplay) {
      if (link.displayText) wikiText = link.displayText;
    } else {
      wikiText = link.displayText ? link.displayText : link.link;
    }
    wikiText = wikiText.trim();

    const pattern = `^${searchTarget}$`;
    return extractDateUsingRegexWithValue(wikiText, pattern, renderInfo);
  }

  return date;
};

// Not support multiple targets
export const getDateFromFileMeta = (
  file: TFile,
  query: Query,
  renderInfo: RenderInfo
): Moment => {
  // console.log("getDateFromFileMeta");
  // Get date from cDate, mDate or baseFileName

  let date = window.moment('');

  if (file && file instanceof TFile) {
    // console.log(file.stat);

    const target = query.target;
    if (target === 'cDate') {
      const ctime = file.stat.ctime; // unix time
      date = DateTimeUtils.getDateFromUnixTime(ctime, renderInfo.dateFormat);
    } else if (target === 'mDate') {
      const mtime = file.stat.mtime; // unix time
      date = DateTimeUtils.getDateFromUnixTime(mtime, renderInfo.dateFormat);
    } else if (target === 'name') {
      date = getDateFromFilename(file, renderInfo);
    }
  }

  // console.log(date);
  return date;
};

// Not support multiple targets
// In form 'regex with value', name group 'value' from users
export const getDateFromTask = (
  content: string,
  query: Query,
  renderInfo: RenderInfo
): Moment => {
  // console.log("getDateFromTask");
  // Get date from '- [ ] regex with value' or '- [x] regex with value'

  // Why is this here?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const date = window.moment('');
  const { target, type } = query;

  const pattern = getSearchTypePattern(type);

  return extractDateUsingRegexWithValue(
    content,
    `${pattern}${target}`,
    renderInfo
  );
};

export const getSearchTypePattern = (searchType: SearchType): string => {
  switch (searchType) {
    case SearchType.Task:
      return '\\[[\\sx]\\]\\';
    case SearchType.TaskDone:
      return '\\[x\\]\\s';
    case SearchType.TaskNotDone:
      return '\\[\\s\\]\\s';
    default:
      return '\\[[\\sx]\\]\\s';
  }
};

// No value, count occurrences only
export const collectDataFromFrontmatterTag = (
  fileCache: CachedMetadata,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: XValueMap
): boolean => {
  // console.log("collectDataFromFrontmatterTag");
  // console.log(query);
  // console.log(dataMap);
  // console.log(xValueMap);

  const frontMatter = fileCache.frontmatter;
  let frontMatterTags: string[] = [];
  if (frontMatter && frontMatter.tags) {
    // console.log(frontMatter.tags);
    let tagMeasure = 0.0;
    let tagExist = false;
    if (Array.isArray(frontMatter.tags)) {
      frontMatterTags = frontMatterTags.concat(frontMatter.tags);
    } else if (typeof frontMatter.tags === 'string') {
      const splitTags = frontMatter.tags.split(query.getSeparator(true));
      for (const tag of splitTags) {
        const part = tag.trim();
        if (part !== '') frontMatterTags.push(part);
      }
    }
    // console.log(frontMatterTags);
    // console.log(query.target);

    for (const tag of frontMatterTags) {
      if (tag === query.target) {
        // simple tag
        tagMeasure = tagMeasure + renderInfo.constValue[query.id];
        tagExist = true;
        query.incrementTargets();
      } else if (tag.startsWith(query.target + '/')) {
        // nested tag
        tagMeasure = tagMeasure + renderInfo.constValue[query.id];
        tagExist = true;
        query.incrementTargets();
      } else {
        continue;
      }

      // valued-tag in frontmatter is not supported
      // because the "tag:value" in frontmatter will be consider as a new tag for each existing value

      let value = null;
      if (tagExist) {
        value = tagMeasure;
      }
      const xValue = xValueMap.get(renderInfo.xDataset[query.id]);
      addToDataMap(dataMap, xValue, query, value);
      return true;
    }
  }

  return false;
};

// In form 'key: value', target used to identify 'frontmatter key'
export const collectDataFromFrontmatterKey = (
  fileCache: CachedMetadata,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: XValueMap
): boolean => {
  // console.log("collectDataFromFrontmatterKey");

  const frontMatter = fileCache.frontmatter;
  if (frontMatter) {
    const deepValue = ObjectUtils.getDeepValue(frontMatter, query.target);
    if (deepValue) {
      const parsed = NumberUtils.parseFloatFromAny(
        deepValue,
        renderInfo.textValueMap
      );
      if (parsed.value === null) {
        // Try parsing as a boolean: true means 1, false means 0.
        if (deepValue === 'true' || deepValue === 'false') {
          parsed.type = ValueType.Number;
          parsed.value = deepValue === 'true' ? 1 : 0;
        }
      }
      if (parsed.value !== null) {
        if (parsed.type === ValueType.Time) {
          query.valueType = ValueType.Time;
        }
        query.incrementTargets();
        const xValue = xValueMap.get(renderInfo.xDataset[query.id]);
        addToDataMap(dataMap, xValue, query, parsed.value);
        return true;
      }
    } else if (
      query.parentTarget &&
      ObjectUtils.getDeepValue(frontMatter, query.parentTarget)
    ) {
      // console.log("multiple values");
      // console.log(query.target);
      // console.log(query.parentTarget);
      // console.log(query.getSubId());
      // console.log(
      //     frontMatter[query.parentTarget]
      // );
      const toParse = ObjectUtils.getDeepValue(frontMatter, query.parentTarget);
      let splitted = null;
      if (Array.isArray(toParse)) {
        splitted = toParse.map((p) => p.toString());
      } else if (typeof toParse === 'string') {
        splitted = toParse.split(query.getSeparator());
      }
      // console.log(splitted);
      if (
        splitted &&
        splitted.length > query.getAccessor() &&
        query.getAccessor() >= 0
      ) {
        // TODO: it's not efficient to retrieve one value at a time, enhance this
        const accessor0 = splitted[query.getAccessor()].trim();
        const parsed = NumberUtils.parseFloatFromAny(
          accessor0,
          renderInfo.textValueMap
        );
        if (parsed.value !== null) {
          if (parsed.type === ValueType.Time) {
            query.valueType = ValueType.Time;
          }
          query.incrementTargets();
          const xValue = xValueMap.get(renderInfo.xDataset[query.id]);
          addToDataMap(dataMap, xValue, query, parsed.value);
          return true;
        }
      }
    }
  }

  return false;
};

// In form 'regex with value', name group 'value' from users
export const collectDataFromWiki = (
  fileCache: CachedMetadata,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: XValueMap
): boolean => {
  const links = fileCache.links;
  if (!links) return false;

  const { target: pattern, type } = query;

  let textToSearch = '';

  // Prepare textToSearch
  for (const link of links) {
    if (!link) continue;

    let wikiText = '';
    if (type === SearchType.WikiLink) {
      // wiki.link point to a file name
      // a colon is not allowed be in file name
      wikiText = link.link;
    } else if (type === SearchType.WikiDisplay) {
      if (link.displayText) wikiText = link.displayText;
    } else {
      wikiText = link.displayText ? link.displayText : link.link;
    }
    wikiText = wikiText.trim();
    textToSearch += wikiText + '\n';
  }

  return extractDataUsingRegexWithMultipleValues(
    textToSearch,
    pattern,
    query,
    dataMap,
    xValueMap,
    renderInfo
  );
};

// In form 'key: value', name group 'value' from plugin, not from users
export const collectDataFromInlineTag = (
  content: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: XValueMap
): boolean => {
  // console.log(content);
  // Test this in Regex101
  // (^|\s)#tagName(\/[\w-]+)*(:(?<value>[\d\.\/-]*)[a-zA-Z]*)?([\\.!,\\?;~-]*)?(\s|$)
  let tagName = query.target;
  if (query.parentTarget) {
    tagName = query.parentTarget; // use parent tag name for multiple values
  }
  if (tagName.length > 1 && tagName.startsWith('#')) {
    tagName = tagName.substring(1);
  }
  const pattern =
    '(^|\\s)#' +
    tagName +
    '(\\/[\\w-]+)*(:(?<value>[\\d\\.\\/-]*)[a-zA-Z]*)?([\\.!,\\?;~-]*)?(\\s|$)';
  // console.log(pattern);

  return extractDataUsingRegexWithMultipleValues(
    content,
    pattern,
    query,
    dataMap,
    xValueMap,
    renderInfo
  );
};

// In form 'regex with value', name group 'value' from users
export const collectDataFromText = (
  content: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: XValueMap
): boolean => {
  // console.log("collectDataFromText");

  const { target: pattern } = query;
  // console.log(pattern);

  return extractDataUsingRegexWithMultipleValues(
    content,
    pattern,
    query,
    dataMap,
    xValueMap,
    renderInfo
  );
};

export const collectDataFromFileMeta = (
  file: TFile,
  content: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: XValueMap
): boolean => {
  // console.log("collectDataFromFileMeta");

  if (file && file instanceof TFile) {
    // console.log(file.stat);

    const target = query.target;
    const xValue = xValueMap.get(renderInfo.xDataset[query.id]);

    if (target === 'cDate') {
      const ctime = file.stat.ctime; // unix time
      query.valueType = ValueType.Date;
      query.incrementTargets();
      addToDataMap(dataMap, xValue, query, ctime);
      return true;
    } else if (target === 'mDate') {
      const mtime = file.stat.mtime; // unix time
      query.valueType = ValueType.Date;
      query.incrementTargets();
      addToDataMap(dataMap, xValue, query, mtime);
      return true;
    } else if (target === 'size') {
      const size = file.stat.size; // number in
      query.incrementTargets();
      addToDataMap(dataMap, xValue, query, size);
      return true;
    } else if (target === 'numWords') {
      const numWords = CountUtils.getWordCount(content);
      addToDataMap(dataMap, xValue, query, numWords);
      return true;
    } else if (target === 'numChars') {
      query.incrementTargets();
      addToDataMap(dataMap, xValue, query, content.length);
      return true;
    } else if (target === 'numSentences') {
      const numSentences = CountUtils.getSentenceCount(content);
      query.incrementTargets();
      addToDataMap(dataMap, xValue, query, numSentences);
      return true;
    } else if (target === 'name') {
      let targetMeasure = 0.0;
      let targetExist = false;
      const parsed = NumberUtils.parseFloatFromAny(
        file.basename,
        renderInfo.textValueMap
      );
      if (parsed.value !== null) {
        if (parsed.type === ValueType.Time) {
          targetMeasure = parsed.value;
          targetExist = true;
          query.valueType = ValueType.Time;
          query.incrementTargets();
        } else {
          if (!renderInfo.ignoreZeroValue[query.id] || parsed.value !== 0) {
            targetMeasure += parsed.value;
            targetExist = true;
            query.incrementTargets();
          }
        }
      }

      let value = null;
      if (targetExist) {
        value = targetMeasure;
      }
      if (value !== null) {
        addToDataMap(dataMap, xValue, query, value);
        return true;
      }
    }
  }

  return false;
};

// In form 'key::value', named group 'value' from plugin
export const collectDataFromDvField = (
  content: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: XValueMap
): boolean => {
  let dvTarget = query.target;
  if (query.parentTarget) {
    dvTarget = query.parentTarget; // use parent tag name for multiple values
  }
  // Dataview ask user to add dashes for spaces as search target
  // So a dash may stands for a real dash or a space
  dvTarget = dvTarget.replace('-', '[\\s\\-]');

  // Test this in Regex101
  // remember '\s' includes new line
  // (^| |\t)\*{0,2}dvTarget\*{0,2}(::[ |\t]*(?<value>[\d\.\/\-\w,@; \t:]*))(\r?\n|\r|$)
  const pattern =
    '(^| |\\t)\\*{0,2}' +
    dvTarget +
    '\\*{0,2}(::[ |\\t]*(?<value>[\\d\\.\\/\\-,@; \\t:' +
    WordCharacters +
    ']*))(\\r\\?\\n|\\r|$)';
  const outline = extractDataUsingRegexWithMultipleValues(
    content,
    pattern,
    query,
    dataMap,
    xValueMap,
    renderInfo
  );
  const inline = collectDataFromInlineDvField(
    content,
    query,
    renderInfo,
    dataMap,
    xValueMap
  );
  return outline || inline;
};

// In form 'key::value', named group 'value' from plugin
export const collectDataFromInlineDvField = (
  content: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: XValueMap
): boolean => {
  let dvTarget = query.target;
  if (query.parentTarget) {
    dvTarget = query.parentTarget; // use parent tag name for multiple values
  }
  // Dataview ask user to add dashes for spaces as search target
  // So a dash may stands for a real dash or a space
  dvTarget = dvTarget.replace('-', '[\\s\\-]');

  // Test this in Regex101
  // remember '\s' includes new line
  // ^.*?(\[|\()\*{0,2}dvTarget\*{0,2}(::[ |\t]*(?<value>[\d\.\/\-\w,@; \t:]*))(\]|\)).*?
  const pattern =
    '^.*?(\\[|\\()\\*{0,2}' +
    dvTarget +
    '\\*{0,2}(::[ |\\t]*(?<value>[\\d\\.\\/\\-,@; \\t:' +
    WordCharacters +
    ']*))(\\]|\\)).*?$';
  // console.log(pattern);

  return extractDataUsingRegexWithMultipleValues(
    content,
    pattern,
    query,
    dataMap,
    xValueMap,
    renderInfo
  );
};

// In form 'regex with value', name group 'value' from users
export const collectDataFromTask = (
  content: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: XValueMap
): boolean => {
  // console.log("collectDataFromTask");
  const queryType = query.type;
  // console.log(searchType);

  let strRegex = query.target;
  if (queryType === SearchType.Task) {
    strRegex = '\\[[\\sx]\\]\\s' + strRegex;
  } else if (queryType === SearchType.TaskDone) {
    strRegex = '\\[x\\]\\s' + strRegex;
  } else if (queryType === SearchType.TaskNotDone) {
    strRegex = '\\[\\s\\]\\s' + strRegex;
  } else {
    // all
    strRegex = '\\[[\\sx]\\]\\s' + strRegex;
  }
  // console.log(strRegex);

  return extractDataUsingRegexWithMultipleValues(
    content,
    strRegex,
    query,
    dataMap,
    xValueMap,
    renderInfo
  );
};

/**
 * Appends data to the dataMap provided
 * @param {Vault} vault A reference to the current vault
 * @param {DataMap} dataMap
 * @param {RenderInfo} renderInfo
 * @param {ProcessInfo} processInfo
 * @returns
 */
export const collectDataFromTable = async (
  vault: Vault,
  dataMap: DataMap,
  renderInfo: RenderInfo,
  processInfo: ProcessInfo
): Promise<void> => {
  const tableQueries = renderInfo.queries.filter(
    (q) => q.type === SearchType.Table
  );

  // Separate queries by tables and xDatasets/yDatasets
  const tables: Array<TableData> = [];
  let tableFileNotFound = false;
  for (const query of tableQueries) {
    const filePath = query.parentTarget;
    const file = vault.getAbstractFileByPath(normalizePath(filePath + '.md'));
    if (!file || !(file instanceof TFile)) {
      tableFileNotFound = true;
      break;
    }

    const tableIndex = query.getAccessor();
    const isX = query.usedAsXDataset;

    const table = tables.find(
      (t) => t.filePath === filePath && t.tableIndex === tableIndex
    );
    if (table) {
      if (isX) table.xDataset = query;
      else table.yDatasets.push(query);
    } else {
      const tableData = new TableData(filePath, tableIndex);
      if (isX) tableData.xDataset = query;
      else tableData.yDatasets.push(query);

      tables.push(tableData);
    }
  }

  if (tableFileNotFound) {
    processInfo.errorMessage = 'File containing tables not found';
    return;
  }

  for (const tableData of tables) {
    //extract xDataset from query
    const xDatasetQuery = tableData.xDataset;
    if (!xDatasetQuery) {
      // missing xDataset
      continue;
    }
    const yDatasetQueries = tableData.yDatasets;
    let filePath = xDatasetQuery.parentTarget;
    const tableIndex = xDatasetQuery.getAccessor();

    // Get table text
    let textTable = '';
    filePath = filePath + '.md';
    const file = vault.getAbstractFileByPath(normalizePath(filePath));
    if (file && file instanceof TFile) {
      processInfo.fileAvailable++;
      const content = await vault.adapter.read(file.path);

      // Test this in Regex101
      // This is a not-so-strict table selector
      // ((\r?\n){2}|^)([^\r\n]*\|[^\r\n]*(\r?\n)?)+(?=(\r?\n){2}|$)
      const strMdTableRegex =
        '((\\r?\\n){2}|^)([^\\r\\n]*\\|[^\\r\\n]*(\\r?\\n)?)+(?=(\\r?\\n){2}|$)';
      // console.log(strMDTableRegex);
      const mdTableRegex = new RegExp(strMdTableRegex, 'gm');
      let match;
      let indTable = 0;

      while ((match = mdTableRegex.exec(content))) {
        if (indTable === tableIndex) {
          textTable = match[0];
          break;
        }
        indTable++;
      }
    } else {
      // file does not exist
      continue;
    }

    let tableRows = textTable.split(/\r?\n/);
    tableRows = tableRows.filter((line) => line !== '');
    let numColumns = 0;
    let numDataRows = 0;

    // Make sure it is a valid table first
    if (tableRows.length >= 2) {
      // Must have header and separator line
      let headerRow = tableRows.shift().trim();
      headerRow = StringUtils.parseMarkdownTableRow(headerRow);
      const columns = headerRow.split('|');
      numColumns = columns.length;

      let sepLine = tableRows.shift().trim();
      sepLine = StringUtils.parseMarkdownTableRow(sepLine);
      const rows = sepLine.split('|');
      for (const col of rows) if (!col.includes('-')) break; // Not a valid separator

      numDataRows = tableRows.length;
    }

    if (numDataRows == 0) continue;

    // get x data
    const columnXDataset = xDatasetQuery.getAccessor(1);
    if (columnXDataset >= numColumns) continue;
    const xValues = [];

    for (const row of tableRows) {
      const dataRow = StringUtils.parseMarkdownTableRow(row.trim());
      const cells = dataRow.split('|');
      if (columnXDataset < cells.length) {
        const data = cells[columnXDataset].trim();
        const date = DateTimeUtils.stringToDate(data, renderInfo.dateFormat);

        if (date.isValid()) {
          xValues.push(date);
          if (
            !processInfo.minDate.isValid() &&
            !processInfo.maxDate.isValid()
          ) {
            processInfo.minDate = date.clone();
            processInfo.maxDate = date.clone();
          } else {
            if (date < processInfo.minDate) processInfo.minDate = date.clone();
            if (date > processInfo.maxDate) processInfo.maxDate = date.clone();
          }
        } else {
          xValues.push(null);
        }
      } else {
        xValues.push(null);
      }
    }

    if (xValues.every((v) => v === null)) {
      processInfo.errorMessage = 'No valid date as X value found in table';
      return;
    } else {
      processInfo.gotAnyValidXValue ||= true;
    }

    // get y data
    for (const yDatasetQuery of yDatasetQueries) {
      const columnOfInterest = yDatasetQuery.getAccessor(1);
      // console.log(`columnOfInterest: ${columnOfInterest}, numColumns: ${numColumns}`);
      if (columnOfInterest >= numColumns) continue;

      let indLine = 0;
      for (const row of tableRows) {
        const dataRow = StringUtils.parseMarkdownTableRow(row.trim());
        const dataRowSplitted = dataRow.split('|');
        if (columnOfInterest < dataRowSplitted.length) {
          const data = dataRowSplitted[columnOfInterest].trim();
          const splitData = data.split(yDatasetQuery.getSeparator());
          // console.log(splitData);
          if (!splitData) continue;
          if (splitData.length === 1) {
            const parsed = NumberUtils.parseFloatFromAny(
              splitData[0],
              renderInfo.textValueMap
            );
            // console.log(parsed);
            if (parsed.value !== null) {
              if (parsed.type === ValueType.Time) {
                yDatasetQuery.valueType = ValueType.Time;
              }
              const value = parsed.value;
              if (indLine < xValues.length && xValues[indLine]) {
                processInfo.gotAnyValidYValue ||= true;
                addToDataMap(
                  dataMap,
                  DateTimeUtils.dateToString(
                    xValues[indLine],
                    renderInfo.dateFormat
                  ),
                  yDatasetQuery,
                  value
                );
              }
            }
          } else if (
            splitData.length > yDatasetQuery.getAccessor(2) &&
            yDatasetQuery.getAccessor(2) >= 0
          ) {
            let value = null;
            const accessor2 = splitData[yDatasetQuery.getAccessor(2)].trim();
            // console.log(accessor2);
            const parsed = NumberUtils.parseFloatFromAny(
              accessor2,
              renderInfo.textValueMap
            );
            // console.log(parsed);
            if (parsed.value !== null) {
              if (parsed.type === ValueType.Time) {
                yDatasetQuery.valueType = ValueType.Time;
              }
              value = parsed.value;
              if (indLine < xValues.length && xValues[indLine]) {
                processInfo.gotAnyValidYValue ||= true;
                addToDataMap(
                  dataMap,
                  DateTimeUtils.dateToString(
                    xValues[indLine],
                    renderInfo.dateFormat
                  ),
                  yDatasetQuery,
                  value
                );
              }
            }
          }
        }

        indLine++;
      } // Loop over tableRows
    }
  }
};

const DataCollector = {
  getDateFromFilename,
  getDateFromFrontmatter,
  getDateFromTag,
  getDateFromText,
  getDateFromDvField,
  getDateFromWiki,
  getDateFromFileMeta,
  getDateFromTask,
  collectDataFromFrontmatterTag,
  collectDataFromFrontmatterKey,
  collectDataFromWiki,
  collectDataFromInlineTag,
  collectDataFromText,
  collectDataFromFileMeta,
  collectDataFromDvField,
  collectDataFromInlineDvField,
  collectDataFromTask,
  collectDataFromTable,
};

export default DataCollector;
