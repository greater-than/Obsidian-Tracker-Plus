import { CachedMetadata, TFile, Vault, normalizePath } from 'obsidian';
import { TrackerError } from '../errors';
import { DataMap } from '../models/data-map';
import { SearchType, ValueType } from '../models/enums';
import { ProcessInfo } from '../models/process-info';
import { Query } from '../models/query';
import { RenderInfo } from '../models/render-info';
import { TableData } from '../models/table-data';
import { TNumberValueMap } from '../models/types';
import { PropertyValuePattern, TaskPattern } from '../regex-patterns';
import { DateTimeUtils, NumberUtils, StringUtils } from '../utils';
import {
  getCharacterCount,
  getSentenceCount,
  getWordCount,
} from '../utils/count.utils';
import { getDeepValue } from '../utils/object.utils';
import {
  extractDataWithMultipleValues,
  extractDateUsingRegexWithValue,
} from './collector.helper';
import { WordCharacters } from './constants';
import { TDateGetter, TDateSearchIn } from './types';
import Moment = moment.Moment;

// Date Collectors

/**
 * @summary Returns a Moment object from a note file name
 * @param {TFile} file file.basename is a string that should contain dateFormat only
 * @param {RenderInfo} renderInfo
 * @returns {Moment}
 */
export const getFilenameDate = (
  file: TFile,
  renderInfo: RenderInfo
): Moment => {
  const { basename } = file;
  const { dateFormat, dateFormatPrefix, dateFormatSuffix } = renderInfo;
  const dateString = DateTimeUtils.getDateStringFromInput(
    basename,
    dateFormatPrefix,
    dateFormatSuffix
  );
  return DateTimeUtils.toMoment(dateString, dateFormat);
};

/**
 * @summary Returns a Moment object from a frontmatter property
 * @description No support for multiple targets. In form 'key: value', target used to identify 'frontmatter key'
 * @param {CachedMetadata} metadata
 * @param {RenderInfo} renderInfo
 * @param {Query} query
 * @returns {Moment}
 */
export const getFrontmatterDate = (
  metadata: CachedMetadata,
  renderInfo: RenderInfo,
  query: Query
): Moment => {
  // Get date from 'frontMatterKey: date'
  const frontMatter = metadata.frontmatter;
  if (frontMatter) {
    if (getDeepValue(frontMatter, query.target)) {
      let dateString = getDeepValue(frontMatter, query.target);
      // We only support single value for now
      if (typeof dateString === 'string') {
        dateString = DateTimeUtils.getDateStringFromInput(
          dateString,
          renderInfo.dateFormatPrefix,
          renderInfo.dateFormatSuffix
        );
        return DateTimeUtils.toMoment(dateString, renderInfo.dateFormat);
      }
    }
  }
  return window.moment('');
};

/**
 * @summary
 * @description No support for multiple targets. In form 'key: value', name group 'value' from plugin, not from users
 * @param {string} note
 * @param {RenderInfo} renderInfo
 * @param {Query} query
 * @returns {Moment}
 */
export const getTagDate = (
  note: string,
  renderInfo: RenderInfo,
  query: Query
): Moment => {
  // Get date from '#tagName: date'
  // Inline value-attached tag only
  // use parent tag name for multiple values
  const tagName = query.parentTarget ?? query.target;
  const pattern = `(^|\\s)#${tagName}${PropertyValuePattern}`;
  return extractDateUsingRegexWithValue(note, pattern, renderInfo);
};

/**
 * @summary Returns a Moment object from a date in a note
 * @description No support for multiple targets. In form 'regex with value', name group 'value' from users
 * @param {string} note
 * @param {RenderInfo} renderInfo
 * @param {Query} query
 * @returns {Moment}
 */
export const getTextDate = (
  note: string,
  renderInfo: RenderInfo,
  query: Query
): Moment => extractDateUsingRegexWithValue(note, query.target, renderInfo);

// Not support multiple targets
// In form 'key::value', named group 'value' from plugin
export const getDataviewFieldDate = (
  content: string,
  renderInfo: RenderInfo,
  query: Query
): Moment => {
  // Get date form 'targetName:: date'
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

  return extractDateUsingRegexWithValue(content, pattern, renderInfo);
};

// Not support multiple targets
// In form 'regex with value', name group 'value' from users
export const getWikiDate = (
  metadata: CachedMetadata,
  renderInfo: RenderInfo,
  query: Query
): Moment => {
  // Get date from '[[regex with value]]'

  const date = window.moment('');

  const links = metadata.links;
  if (!links) return date;

  const searchTarget = query.target;
  const searchType = query.type;

  for (const link of links) {
    if (!link) continue;

    let wikiText = '';
    if (searchType === SearchType.Wiki) {
      if (link.displayText) {
        wikiText = link.displayText;
      } else {
        wikiText = link.link;
      }
    } else if (searchType === SearchType.WikiLink) {
      // wiki.link point to a file name
      // a colon is not allowed be in file name
      wikiText = link.link;
    } else if (searchType === SearchType.WikiDisplay) {
      if (link.displayText) {
        wikiText = link.displayText;
      }
    } else {
      if (link.displayText) {
        wikiText = link.displayText;
      } else {
        wikiText = link.link;
      }
    }
    wikiText = wikiText.trim();

    const pattern = `^${searchTarget}$`;
    return extractDateUsingRegexWithValue(wikiText, pattern, renderInfo);
  }

  return date;
};

// Not support multiple targets
export const getFileMetaDataDate = (
  file: TFile,
  renderInfo: RenderInfo,
  query: Query
): Moment => {
  // Get date from cDate, mDate or baseFileName

  let date = window.moment('');

  if (file && file instanceof TFile) {
    const target = query.target;
    if (target === 'cDate') {
      const ctime = file.stat.ctime; // unix time
      date = DateTimeUtils.getDateFromUnixTime(ctime, renderInfo.dateFormat);
    } else if (target === 'mDate') {
      const mtime = file.stat.mtime; // unix time
      date = DateTimeUtils.getDateFromUnixTime(mtime, renderInfo.dateFormat);
    } else if (target === 'name') {
      date = getFilenameDate(file, renderInfo);
    }
  }
  return date;
};

// Not support multiple targets
// In form 'regex with value', name group 'value' from users
export const getTaskDate = (
  content: string,
  renderInfo: RenderInfo,
  query: Query
): Moment => {
  // Get date from '- [ ] regex with value' or '- [x] regex with value'
  return extractDateUsingRegexWithValue(
    content,
    `${TaskPattern[query.type]}${query.target}`,
    renderInfo
  );
};

/**
 * @summary Returns a callable and location to retrieve the xDate
 * @param {RenderInfo} renderInfo
 * @param {number} datasetId
 * @param searchIn
 * @returns {[TDateGetter, TDateSearchIn]}
 */
export const getXDateGetterArgs = (
  renderInfo: RenderInfo,
  datasetId: number,
  searchIn: { metadata: CachedMetadata; content: string; file: TFile }
): readonly [TDateGetter, TDateSearchIn] => {
  if (datasetId === -1) return [getFilenameDate, searchIn.file] as const;

  switch (renderInfo.queries[datasetId].type) {
    case SearchType.Frontmatter:
      return [getFrontmatterDate, searchIn.metadata] as const;

    case SearchType.Tag:
      return [getTagDate, searchIn.content] as const;

    case SearchType.Text:
      return [getTextDate, searchIn.content] as const;

    case SearchType.DataviewField:
      return [getDataviewFieldDate, searchIn.content] as const;

    case SearchType.FileMeta:
      return [getFileMetaDataDate, searchIn.file] as const;

    case SearchType.Task:
    case SearchType.TaskDone:
    case SearchType.TaskNotDone:
      return [getTaskDate, searchIn.content] as const;

    default:
      return null;
  }
};

/**
 * @summary Returns a Moment object from a filename or dataset
 * @param {TDateGetter} getDate
 * @param {TDateSearchIn} searchIn
 * @param {RenderInfo} renderInfo
 * @param {number} datasetId
 * @returns {Moment}
 */
export const getXDate = (
  getDate: TDateGetter,
  searchIn: TDateSearchIn,
  renderInfo: RenderInfo,
  datasetId: number
): moment.Moment => {
  return datasetId === -1
    ? getDate(searchIn, renderInfo) // Get Date from filename
    : getDate(searchIn, renderInfo, renderInfo.queries[datasetId]);
};

// -----

/**
 * @summary
 * @description Get data from '- [ ] regex with value' or '- [x] regex with value'
 * @param {string} content
 * @param {Query} query
 * @param {RenderInfo} renderInfo
 * @param {DataMap} dataMap
 * @param {TNumberValueMap} xValueMap
 * @returns
 */
export const setTaskData = (
  content: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: TNumberValueMap
): boolean =>
  extractDataWithMultipleValues(
    content,
    `${TaskPattern[query.type]}${query.target}`,
    query,
    dataMap,
    xValueMap,
    renderInfo
  );

/**
 * @summary Adds frontmatter data to the dataMap
 * @description In form 'key: value', target used to identify 'frontmatter key'
 * @param {CachedMetaData} metadata
 * @param {Query} query
 * @param {RenderInfo} renderInfo
 * @param {DataMap} dataMap
 * @param {TNumberValueMap} xValueMap
 * @returns {boolean}
 */
export const addFrontmatterData = (
  metadata: CachedMetadata,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: TNumberValueMap
): boolean => {
  if (!metadata.frontmatter) return false;
  const { textValueMap, xDataset } = renderInfo;
  const { parentTarget, target, accessors } = query;
  let toParse = getDeepValue(metadata.frontmatter, target);

  const addToDataMap = (
    dataMap: DataMap,
    type: ValueType,
    query: Query,
    value: number
  ) => {
    if (value === null) return false;
    if (type === ValueType.Time) query.valueType = ValueType.Time;
    query.incrementTargetCount();
    const date = xValueMap.get(xDataset[query.id]);
    dataMap.add(date, { query, value });
    return true;
  };

  if (toParse) {
    const parsed = NumberUtils.parseFloatFromAny(toParse, textValueMap);
    if (parsed.value === null) return false;
    // Try parsing as a boolean: true means 1, false means 0.
    if (toParse !== 'true' && toParse !== 'false') return false;
    parsed.type = ValueType.Number;
    parsed.value = toParse === 'true' ? 1 : 0;
    const { type, value } = parsed;
    return addToDataMap(dataMap, type, query, value);
  }

  toParse = getDeepValue(metadata.frontmatter, parentTarget);
  if (!(parentTarget && toParse)) return false;

  const values = Array.isArray(toParse)
    ? toParse.map((p) => p.toString())
    : typeof toParse === 'string'
    ? toParse.split(query.getSeparator())
    : null;

  if (!(values && values.length > accessors[0] && accessors[0] >= 0))
    return false;

  // TODO: it's not efficient to retrieve one value at a time, enhance this
  const { type, value } = NumberUtils.parseFloatFromAny(
    values[accessors[0]].trim(),
    textValueMap
  );
  return addToDataMap(dataMap, type, query, value);
};

/**
 * @summary
 * @description No value, count occurrences only
 * @param {CachedMetadata} metadata
 * @param {Query} query
 * @param {RenderInfo} renderInfo
 * @param {DataMap} dataMap
 * @param {TNumberValueMap} xValueMap
 * @returns {boolean}
 */
export const setFrontmatterTagData = (
  metadata: CachedMetadata,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: TNumberValueMap
): boolean => {
  const frontMatter = metadata.frontmatter;
  let frontMatterTags: string[] = [];
  if (frontMatter && frontMatter.tags) {
    let tagMeasure = 0.0;
    let tagExist = false;
    if (Array.isArray(frontMatter.tags)) {
      frontMatterTags = frontMatterTags.concat(frontMatter.tags);
    } else if (typeof frontMatter.tags === 'string') {
      const splitted = frontMatter.tags.split(query.getSeparator(true));
      for (const splittedPart of splitted) {
        const part = splittedPart.trim();
        if (part !== '') {
          frontMatterTags.push(part);
        }
      }
    }

    for (const tag of frontMatterTags) {
      if (tag === query.target) {
        // simple tag
        tagMeasure = tagMeasure + renderInfo.constValue[query.id];
        tagExist = true;
        query.incrementTargetCount();
      } else if (tag.startsWith(query.target + '/')) {
        // nested tag
        tagMeasure = tagMeasure + renderInfo.constValue[query.id];
        tagExist = true;
        query.incrementTargetCount();
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
      dataMap.add(xValue, { query, value });
      return true;
    }
  }

  return false;
};

// In form 'key: value', name group 'value' from plugin, not from users
export const setInlineTagData = (
  content: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: TNumberValueMap
): boolean => {
  // Test this in Regex101
  // (^|\s)#tagName(\/[\w-]+)*(:(?<value>[\d\.\/-]*)[a-zA-Z]*)?([\\.!,\\?;~-]*)?(\s|$)
  let tagName = query.target;
  if (query.parentTarget) {
    tagName = query.parentTarget; // use parent tag name for multiple values
  }
  if (tagName.length > 1 && tagName.startsWith('#')) {
    tagName = tagName.substring(1);
  }
  const pattern = `(^|\\s)#${tagName}${PropertyValuePattern}`;

  return extractDataWithMultipleValues(
    content,
    pattern,
    query,
    dataMap,
    xValueMap,
    renderInfo
  );
};

// In form 'regex with value', name group 'value' from users
export const setWikiData = (
  metadata: CachedMetadata,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: TNumberValueMap
): boolean => {
  const links = metadata.links;
  if (!links) return false;

  const searchTarget = query.target;
  const searchType = query.type;

  let textToSearch = '';
  const pattern = searchTarget;

  // Prepare textToSearch
  for (const link of links) {
    if (!link) continue;

    let wikiText = '';
    if (searchType === SearchType.Wiki) {
      if (link.displayText) {
        wikiText = link.displayText;
      } else {
        wikiText = link.link;
      }
    } else if (searchType === SearchType.WikiLink) {
      // wiki.link point to a file name
      // a colon is not allowed be in file name
      wikiText = link.link;
    } else if (searchType === SearchType.WikiDisplay) {
      if (link.displayText) {
        wikiText = link.displayText;
      }
    } else {
      if (link.displayText) {
        wikiText = link.displayText;
      } else {
        wikiText = link.link;
      }
    }
    wikiText = wikiText.trim();

    textToSearch += wikiText + '\n';
  }

  return extractDataWithMultipleValues(
    textToSearch,
    pattern,
    query,
    dataMap,
    xValueMap,
    renderInfo
  );
};

// In form 'regex with value', name group 'value' from users
export const setTextData = (
  content: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: TNumberValueMap
): boolean => {
  const pattern = query.target;

  return extractDataWithMultipleValues(
    content,
    pattern,
    query,
    dataMap,
    xValueMap,
    renderInfo
  );
};

/**
 * Gets timestamp from file and adds it to the dataMap
 * @param {TFile} file
 * @param {string} content
 * @param {Query} query
 * @param {RenderInfo} renderInfo
 * @param {DataMap} dataMap
 * @param {NumberValueMap} valueMap
 * @returns
 */
export const setDataFromFileMetaData = (
  file: TFile,
  content: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: TNumberValueMap
): boolean => {
  if (file && file instanceof TFile) {
    const target = query.target;
    const xValue = xValueMap.get(renderInfo.xDataset[query.id]);

    if (target === 'cDate') {
      const ctime = file.stat.ctime; // unix time
      query.valueType = ValueType.Date;
      query.incrementTargetCount();
      dataMap.add(xValue, { query, value: ctime });
      return true;
    } else if (target === 'mDate') {
      const mtime = file.stat.mtime; // unix time
      query.valueType = ValueType.Date;
      query.incrementTargetCount();
      dataMap.add(xValue, { query, value: mtime });
      return true;
    } else if (target === 'size') {
      const size = file.stat.size; // number in
      query.incrementTargetCount();
      dataMap.add(xValue, { query, value: size });
      return true;
    } else if (target === 'numWords') {
      const numWords = getWordCount(content);
      dataMap.add(xValue, { query, value: numWords });
      return true;
    } else if (target === 'numChars') {
      const numChars = getCharacterCount(content);
      query.incrementTargetCount();
      dataMap.add(xValue, { query, value: numChars });
      return true;
    } else if (target === 'numSentences') {
      const numSentences = getSentenceCount(content);
      query.incrementTargetCount();
      dataMap.add(xValue, { query, value: numSentences });
      return true;
    } else if (target === 'name') {
      let targetMeasure = 0.0;
      let targetExist = false;
      const retParse = NumberUtils.parseFloatFromAny(
        file.basename,
        renderInfo.textValueMap
      );
      if (retParse.value !== null) {
        if (retParse.type === ValueType.Time) {
          targetMeasure = retParse.value;
          targetExist = true;
          query.valueType = ValueType.Time;
          query.incrementTargetCount();
        } else {
          if (!renderInfo.ignoreZeroValue[query.id] || retParse.value !== 0) {
            targetMeasure += retParse.value;
            targetExist = true;
            query.incrementTargetCount();
          }
        }
      }

      let value = null;
      if (targetExist) {
        value = targetMeasure;
      }
      if (value !== null) {
        dataMap.add(xValue, { query, value });
        return true;
      }
    }
  }

  return false;
};

// In form 'key::value', named group 'value' from plugin
export const setDataviewFieldData = (
  content: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: TNumberValueMap
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
  const outline = extractDataWithMultipleValues(
    content,
    pattern,
    query,
    dataMap,
    xValueMap,
    renderInfo
  );
  const inline = getInlineDataviewFieldData(
    content,
    query,
    renderInfo,
    dataMap,
    xValueMap
  );
  return outline || inline;
};

// In form 'key::value', named group 'value' from plugin
export const getInlineDataviewFieldData = (
  content: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  xValueMap: TNumberValueMap
): boolean => {
  let { target } = query;
  if (query.parentTarget) {
    target = query.parentTarget; // use parent tag name for multiple values
  }
  // Dataview ask user to add dashes for spaces as search target
  // So a dash may stands for a real dash or a space
  target = target.replace('-', '[\\s\\-]');

  // Test this in Regex101
  // remember '\s' includes new line
  // ^.*?(\[|\()\*{0,2}dvTarget\*{0,2}(::[ |\t]*(?<value>[\d\.\/\-\w,@; \t:]*))(\]|\)).*?
  const pattern =
    '^.*?(\\[|\\()\\*{0,2}' +
    target +
    '\\*{0,2}(::[ |\\t]*(?<value>[\\d\\.\\/\\-,@; \\t:' +
    WordCharacters +
    ']*))(\\]|\\)).*?$';

  return extractDataWithMultipleValues(
    content,
    pattern,
    query,
    dataMap,
    xValueMap,
    renderInfo
  );
};

/**
 * @summary
 * @param {Vault} vault
 * @param {RenderInfo} renderInfo
 * @returns {TableData[]}
 */
export const getTables = (
  vault: Vault,
  renderInfo: RenderInfo
): TableData[] => {
  const queries = renderInfo.queries.filter(
    (q) => q.type === SearchType.Table && !q.usedAsXDataset
  );
  // Separate queries by tables and xDatasets/yDatasets
  const tables: Array<TableData> = [];

  for (const query of queries) {
    const filePath = query.parentTarget;
    const file = vault.getAbstractFileByPath(normalizePath(filePath + '.md'));
    if (!file || !(file instanceof TFile))
      throw new TrackerError(`File '${file}' containing tables not found`);

    const tableIndex = query.accessors[0];
    const isX = query.usedAsXDataset;

    const table = tables.find(
      (t) => t.filePath === filePath && t.tableIndex === tableIndex
    );
    if (table) {
      if (isX) table.xQuery = query;
      else table.yQueries.push(query);
      continue;
    }
    const tableData = new TableData(filePath, tableIndex);
    if (isX) tableData.xQuery = query;
    else tableData.yQueries.push(query);
    tables.push(tableData);
  }

  return tables;
};

/**
 * @summary Appends data to the dataMap and updates processInfo
 * @param {Vault} vault A reference to the current vault
 * @param {DataMap} dataMap
 * @param {RenderInfo} renderInfo
 * @param {ProcessInfo} processInfo
 * @returns
 */
export const setDataFromTable = async (
  vault: Vault,
  dataMap: DataMap,
  renderInfo: RenderInfo,
  processInfo: ProcessInfo
): Promise<void> => {
  // Separate queries by tables and xDatasets/yDatasets
  const tables = getTables(vault, renderInfo);

  for (const table of tables) {
    //extract xQuery
    const { xQuery } = table;
    if (!xQuery) continue; // missing xDataset

    const { yQueries } = table;
    let filePath = xQuery.parentTarget;
    const tableIndex = xQuery.accessors[0];

    // Get table content
    let tableContent = '';
    filePath = filePath + '.md';
    const file = vault.getAbstractFileByPath(normalizePath(filePath));
    if (file && file instanceof TFile) {
      processInfo.fileAvailable++;
      const content = await vault.adapter.read(file.path);

      // Test this in Regex101
      // This is a not-so-strict table selector
      // ((\r?\n){2}|^)([^\r\n]*\|[^\r\n]*(\r?\n)?)+(?=(\r?\n){2}|$)
      const pattern =
        '((\\r?\\n){2}|^)([^\\r\\n]*\\|[^\\r\\n]*(\\r?\\n)?)+(?=(\\r?\\n){2}|$)';

      const regex = new RegExp(pattern, 'gm');
      let match;
      let index = 0;

      while ((match = regex.exec(content))) {
        if (index === tableIndex) {
          tableContent = match[0];
          break;
        }
        index++;
      }
    } else {
      // file does not exist
      continue;
    }

    let tableRows = tableContent.split(/\r?\n/);
    tableRows = tableRows.filter((line) => line !== '');
    let columnCount = 0;
    let rowCount = 0;

    // Make sure it is a valid table first
    if (tableRows.length >= 2) {
      // Must have header and separator line
      const headerRow = StringUtils.parseMarkdownTableRow(
        tableRows.shift().trim()
      );
      const columns = headerRow.split('|');
      columnCount = columns.length;

      let sepLine = tableRows.shift().trim();
      sepLine = StringUtils.parseMarkdownTableRow(sepLine);
      const rows = sepLine.split('|');
      for (const col of rows) if (!col.includes('-')) break; // Not a valid separator

      rowCount = tableRows.length;
    }

    if (rowCount == 0) continue;

    // get x data
    const columnIndex = xQuery.accessors[1];
    if (columnIndex >= columnCount) continue;
    const xValues = [];

    for (const row of tableRows) {
      const dataRow = StringUtils.parseMarkdownTableRow(row.trim());
      const cells = dataRow.split('|');
      if (columnIndex < cells.length) {
        const data = cells[columnIndex].trim();
        const date = DateTimeUtils.toMoment(data, renderInfo.dateFormat);

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
        } else xValues.push(null);
      } else xValues.push(null);
    }

    if (xValues.every((v) => v === null))
      throw new TrackerError('No valid date as X value found in table');

    // get y data
    for (const query of yQueries) {
      const columnIndex = query.accessors[1];
      if (columnIndex >= columnCount) continue;

      let rowIndex = 0;
      for (const row of tableRows) {
        const dataRow = StringUtils.parseMarkdownTableRow(row.trim());
        const columns = dataRow.split('|');
        if (columnIndex < columns.length) {
          const rowData = columns[columnIndex]
            .trim()
            .split(query.getSeparator());
          if (!rowData) continue;
          if (rowData.length === 1) {
            const { type, value } = NumberUtils.parseFloatFromAny(
              rowData[0],
              renderInfo.textValueMap
            );
            if (value !== null) {
              if (type === ValueType.Time) query.valueType = ValueType.Time;
              if (rowIndex < xValues.length && xValues[rowIndex]) {
                dataMap.add(
                  DateTimeUtils.dateToString(
                    xValues[rowIndex],
                    renderInfo.dateFormat
                  ),
                  { query, value }
                );
              }
            }
          } else if (
            rowData.length > query.accessors[2] &&
            query.accessors[2] >= 0
          ) {
            const { type, value } = NumberUtils.parseFloatFromAny(
              rowData[query.accessors[2]].trim(),
              renderInfo.textValueMap
            );
            if (value !== null) {
              if (type === ValueType.Time) query.valueType = ValueType.Time;

              if (rowIndex < xValues.length && xValues[rowIndex]) {
                dataMap.add(
                  DateTimeUtils.dateToString(
                    xValues[rowIndex],
                    renderInfo.dateFormat
                  ),
                  { query, value }
                );
              }
            }
          }
        }
        rowIndex++;
      } // Loop over tableRows
    }
  }
};
