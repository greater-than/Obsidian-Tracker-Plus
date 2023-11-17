import { CachedMetadata, TFile, Vault, normalizePath } from 'obsidian';
import { WordCharacterPattern } from 'src/regex-patterns';
import { TrackerError } from '../errors';
import { DataMap } from '../models/data-map';
import { SearchType, ValueType } from '../models/enums';
import { ProcessInfo } from '../models/process-info';
import { Query } from '../models/query';
import { RenderInfo } from '../models/render-info';
import { TableData } from '../models/table-data';
import { TNumberValueMap } from '../models/types';
import {
  PropertyValuePattern,
  TableSelectorPattern,
  TaskPattern,
} from '../regex-patterns';
import { DateTimeUtils, NumberUtils, StringUtils } from '../utils';
import { getSentenceCount, getWordCount } from '../utils/count.utils';
import { getDateFromUnixTime } from '../utils/date-time.utils';
import { getDeepValue } from '../utils/object.utils';
import { addMultipleValues, extractDate } from './collector.helper';
import { ISearchIn, TDateGetter, TDateSearchIn } from './types';
import Moment = moment.Moment;

// #region Date Collectors

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
  const dateString = DateTimeUtils.getDateString(
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
  const { frontmatter } = metadata;
  if (frontmatter) {
    if (getDeepValue(frontmatter, query.target)) {
      const value = getDeepValue(frontmatter, query.target);
      // Only a single value is supported for now
      if (typeof value === 'string') {
        const { dateFormat, dateFormatPrefix, dateFormatSuffix } = renderInfo;
        const date = DateTimeUtils.getDateString(
          value,
          dateFormatPrefix,
          dateFormatSuffix
        );
        return DateTimeUtils.toMoment(date, dateFormat);
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
  const target = query.parentTarget ?? query.target;
  const pattern = `(^|\\s)#${target}${PropertyValuePattern}`;
  return extractDate(note, pattern, renderInfo);
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
): Moment => extractDate(note, query.target, renderInfo);

/**
 * @summary Returns a Moment object from a dataview field
 * @description No support for multiple targets. In form 'regex with value', name group 'value' from users
 * @param {string} note
 * @param {RenderInfo} renderInfo
 * @param {Query} query
 * @returns {Moment}
 */
export const getDataviewFieldDate = (
  note: string,
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
  // (^| |\t)\*{0,2}target\*{0,2}(::[ |\t]*(?<value>[\d\.\/\-\w,@; \t:]*))(\r?\n|\r|$)
  const pattern = `(^| |\\t)\\*{0,2}${target}\\*{0,2}(::[ |\\t]*(?<value>[\\d\\.\\/\\-\\w,@; \\t:]*))(\\r\\?\\n|\\r|$)`;
  return extractDate(note, pattern, renderInfo);
};

/**
 * @summary Returns the first date as a Moment object from Wiki metadata
 * @description No support for multiple targets. In form 'regex with value', name group 'value' from users
 * @param metadata
 * @param renderInfo
 * @param query
 * @returns
 */
export const getWikiDate = (
  metadata: CachedMetadata,
  renderInfo: RenderInfo,
  query: Query
): Moment => {
  if (!metadata.links) return window.moment('');
  for (const ref of metadata.links) {
    if (!ref) continue;
    const { WikiLink, WikiDisplay } = SearchType;
    const wikiText = (
      query.type === WikiLink
        ? ref.link
        : query.type === WikiDisplay && ref.displayText
        ? ref.displayText
        : ref.displayText ?? ref.link
    ).trim();
    return extractDate(wikiText, `^${query.target}$`, renderInfo);
  }
  return window.moment('');
};

/**
 * @summary Returns a Moment object from a file's metadata
 * @description No support for multiple targets
 * @param {TFile} file
 * @param {RenderInfo} renderInfo
 * @param {Query }query
 * @returns {Moment}
 */
export const getFileMetaDataDate = (
  file: TFile,
  renderInfo: RenderInfo,
  query: Query
): Moment => {
  if (!(file && file instanceof TFile)) return window.moment('');
  // Get date from cDate, mDate or filename
  switch (query.target) {
    case 'cDate':
      return getDateFromUnixTime(file.stat.ctime, renderInfo.dateFormat);
    case 'mDate':
      return getDateFromUnixTime(file.stat.mtime, renderInfo.dateFormat);
    default:
      return getFilenameDate(file, renderInfo);
  }
};

/**
 * @summary Returns a Moment object from a task
 * @description No support for multiple targets. In form 'regex with value', name group 'value' from users
 * @param {string} note
 * @param {RenderInfo} renderInfo
 * @param {Query} query
 * @returns {Moment}
 */
export const getTaskDate = (
  note: string,
  renderInfo: RenderInfo,
  query: Query
): Moment => {
  // Get date from '- [ ] regex with value' or '- [x] regex with value'
  return extractDate(
    note,
    `${TaskPattern[query.type]}${query.target}`,
    renderInfo
  );
};

/**
 * @summary Returns a callable and location to retrieve the a date
 * @param {RenderInfo} renderInfo
 * @param {number} datasetId
 * @param {ISearchIn} searchIn
 * @returns {[TDateGetter, TDateSearchIn]}
 */
export const getXDateGetterArgs = (
  renderInfo: RenderInfo,
  datasetId: number,
  searchIn: ISearchIn
): readonly [TDateGetter, TDateSearchIn] => {
  if (datasetId === -1) return [getFilenameDate, searchIn.file] as const;

  switch (renderInfo.queries[datasetId].type) {
    case SearchType.Frontmatter:
      return [getFrontmatterDate, searchIn.metadata] as const;

    case SearchType.Tag:
      return [getTagDate, searchIn.note] as const;

    case SearchType.Text:
      return [getTextDate, searchIn.note] as const;

    case SearchType.DataviewField:
      return [getDataviewFieldDate, searchIn.note] as const;

    case SearchType.FileMeta:
      return [getFileMetaDataDate, searchIn.file] as const;

    case SearchType.Task:
    case SearchType.TaskDone:
    case SearchType.TaskNotDone:
      return [getTaskDate, searchIn.note] as const;

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

// #endregion

/**
 * @summary Adds task data to the dataMap
 * @description Collects data from '- [ ] regex with value' or '- [x] regex with value'
 * @param {string} note
 * @param {Query} query
 * @param {RenderInfo} renderInfo
 * @param {DataMap} dataMap
 * @param {TNumberValueMap} valeMap
 * @returns
 */
export const addTaskData = (
  note: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  valeMap: TNumberValueMap
): boolean =>
  addMultipleValues(
    note,
    `${TaskPattern[query.type]}${query.target}`,
    query,
    dataMap,
    valeMap,
    renderInfo
  );

/**
 * @summary Adds frontmatter data to the dataMap
 * @description In form 'key: value', target used to identify 'frontmatter key'
 * @param {CachedMetaData} metadata
 * @param {Query} query
 * @param {RenderInfo} renderInfo
 * @param {DataMap} dataMap
 * @param {TNumberValueMap} valueMap
 * @returns {boolean}
 */
export const addFrontmatterData = (
  metadata: CachedMetadata,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  valueMap: TNumberValueMap
): boolean => {
  if (!metadata.frontmatter) return false;
  const { textValueMap, xDataset } = renderInfo;
  const { parentTarget, target, accessors } = query;
  const { frontmatter } = metadata;
  let toParse = getDeepValue(frontmatter, target);
  const addToDataMap = (
    dataMap: DataMap,
    type: ValueType,
    query: Query,
    value: number
  ) => {
    if (value === null) return false;
    if (type === ValueType.Time) query.valueType = ValueType.Time;
    query.incrementTargetCount();
    const date = valueMap.get(xDataset[query.id]);
    dataMap.add(date, { query, value });
    return true;
  };

  if (toParse) {
    const parsed = NumberUtils.parseFloatFromAny(toParse, textValueMap);
    const { type, value } = parsed;
    if (value === null) return false;
    // Try parsing as a boolean: true means 1, false means 0.
    if (toParse !== 'true' && toParse !== 'false') return false;
    parsed.type = ValueType.Number;
    parsed.value = toParse === 'true' ? 1 : 0;
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
 * @summary Adds frontmatter tag count to dataMap
 * @description No value, count occurrences only
 * @param {CachedMetadata} metadata
 * @param {Query} query
 * @param {RenderInfo} renderInfo
 * @param {DataMap} dataMap
 * @param {TNumberValueMap} valueMap
 * @returns {boolean}
 */
export const addFrontmatterTagData = (
  metadata: CachedMetadata,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  valueMap: TNumberValueMap
): boolean => {
  const frontMatter = metadata.frontmatter;
  let tags: string[] = [];
  if (frontMatter && frontMatter.tags) {
    let tagMeasure = 0.0;
    let exists = false;
    if (Array.isArray(frontMatter.tags)) tags = tags.concat(frontMatter.tags);
    else if (typeof frontMatter.tags === 'string') {
      const values = frontMatter.tags.split(query.getSeparator(true));
      for (const value of values)
        if (value.trim() !== '') tags.push(value.trim());
    }

    for (const tag of tags) {
      // Simple or Nested target
      if (tag === query.target || tag.startsWith(query.target + '/')) {
        tagMeasure = tagMeasure + renderInfo.constValue[query.id];
        exists = true;
        query.incrementTargetCount();
      } else continue;

      // valued-tag in frontmatter is not supported
      // because the "tag:value" in frontmatter will be consider as a new tag for each existing value
      const value = exists ? tagMeasure : null;
      const date = valueMap.get(renderInfo.xDataset[query.id]);
      dataMap.add(date, { query, value });
      return true;
    }
  }
  return false;
};

/**
 * @summary Adds inline tag data to the dataMap
 * @description In form 'key: value', name group 'value' from plugin, not from users
 * @param {string} note
 * @param {Query} query
 * @param {RenderInfo} renderInfo
 * @param {DataMap} dataMap
 * @param {TNumberValueMap} valueMap
 * @returns {boolean}
 */
export const addInlineTagData = (
  note: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  valueMap: TNumberValueMap
): boolean => {
  // Test this in Regex101
  // (^|\s)#tagName(\/[\w-]+)*(:(?<value>[\d\.\/-]*)[a-zA-Z]*)?([\\.!,\\?;~-]*)?(\s|$)
  let { target } = query;
  if (query.parentTarget) target = query.parentTarget; // use parent tag name for multiple values
  if (target.length > 1 && target.startsWith('#')) target = target.substring(1);
  const pattern = `(^|\\s)#${target}${PropertyValuePattern}`;
  return addMultipleValues(note, pattern, query, dataMap, valueMap, renderInfo);
};

/**
 * @summary Adds wiki data to the dataMap
 * @description In form 'regex with value', name group 'value' from users
 * @param {Cache} metadata
 * @param {Query} query
 * @param {RenderInfo} renderInfo
 * @param {DataMap} dataMap
 * @param {TNumberValueMap} valueMap
 * @returns {boolean}
 */
export const addWikiData = (
  metadata: CachedMetadata,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  valueMap: TNumberValueMap
): boolean => {
  if (!metadata.links) return false;
  const { target } = query;
  const { WikiLink, WikiDisplay } = SearchType;

  const text = metadata.links
    .map((ref) => {
      if (!ref) return;
      return (
        query.type === WikiLink
          ? ref.link
          : query.type === WikiDisplay && ref.displayText
          ? ref.displayText
          : ref.displayText ?? ref.link
      ).trim();
    })
    .join('\n');

  return addMultipleValues(text, target, query, dataMap, valueMap, renderInfo);
};

/**
 * @summary Adds text data to the dataMap
 * @description In form 'regex with value', name group 'value' from users
 * @param {string} note
 * @param {Query} query
 * @param {RenderInfo} renderInfo
 * @param {DataMap} dataMap
 * @param {TNumberValueMap} valueMap
 * @returns {boolean}
 */
export const addTextData = (
  note: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  valueMap: TNumberValueMap
): boolean => {
  const pattern = query.target;
  return addMultipleValues(note, pattern, query, dataMap, valueMap, renderInfo);
};

/**
 * Adds a note timestamp to the dataMap
 * @param {TFile} file
 * @param {string} note
 * @param {Query} query
 * @param {RenderInfo} renderInfo
 * @param {DataMap} dataMap
 * @param {NumberValueMap} valueMap
 * @returns {boolean}
 */
export const addFileMetaData = (
  file: TFile,
  note: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  valueMap: TNumberValueMap
): boolean => {
  if (!(file && file instanceof TFile)) return false;
  const { target } = query;
  const date = valueMap.get(renderInfo.xDataset[query.id]);

  switch (target) {
    case 'cDate':
      query.valueType = ValueType.Date;
      query.incrementTargetCount();
      dataMap.add(date, { query, value: file.stat.ctime });
      return true;
    case 'mDate':
      query.valueType = ValueType.Date;
      query.incrementTargetCount();
      dataMap.add(date, { query, value: file.stat.mtime });
      return true;
    case 'size':
      query.incrementTargetCount();
      dataMap.add(date, { query, value: file.stat.size });
      return true;
    case 'numWords':
      dataMap.add(date, { query, value: getWordCount(note) });
      return true;
    case 'numSentences':
      query.incrementTargetCount();
      dataMap.add(date, { query, value: getSentenceCount(note) });
      return true;
    case 'name':
      let targetMeasure = 0.0;
      let targetExists = false;
      const { type, value } = NumberUtils.parseFloatFromAny(
        file.basename,
        renderInfo.textValueMap
      );
      if (value !== null) {
        if (type === ValueType.Time) {
          targetMeasure = value;
          targetExists = true;
          query.valueType = ValueType.Time;
          query.incrementTargetCount();
        } else if (!renderInfo.ignoreZeroValue[query.id] || value !== 0) {
          targetMeasure += value;
          targetExists = true;
          query.incrementTargetCount();
        }
      }
      if (targetExists && targetMeasure !== null) {
        dataMap.add(date, { query, value: targetMeasure });
        return true;
      }
  }
  return false;
};

/**
 * @summary Adds data from a dataview field to the dataMap
 * @description In form 'key::value', named group 'value' from plugin
 * @param {string} note
 * @param {Query} query
 * @param {RenderInfo} renderInfo
 * @param {DataMap} dataMap
 * @param {TNumberValueMap} valueMap
 * @returns
 */
export const addDataviewFieldData = (
  note: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  valueMap: TNumberValueMap
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
  // (^| |\t)\*{0,2}target\*{0,2}(::[ |\t]*(?<value>[\d\.\/\-\w,@; \t:]*))(\r?\n|\r|$)
  const pattern = `(^| |\\t)\\*{0,2}${target}\\*{0,2}(::[ |\\t]*(?<value>[\\d\\.\\/\\-,@; \\t:${WordCharacterPattern}]*))(\\r\\?\\n|\\r|$)`;
  const outline = addMultipleValues(
    note,
    pattern,
    query,
    dataMap,
    valueMap,
    renderInfo
  );
  const inline = addInlineDataviewFieldData(
    note,
    query,
    renderInfo,
    dataMap,
    valueMap
  );
  return outline || inline;
};

/**
 * @summary Adds data from an inline dataview to the dataMap
 * @description In form 'key::value', named group 'value' from plugin
 * @param {string} note
 * @param {Query} query
 * @param {RenderInfo} renderInfo
 * @param {DataMap} dataMap
 * @param {TNumberValueMap} valueMap
 * @returns {boolean}
 */
export const addInlineDataviewFieldData = (
  note: string,
  query: Query,
  renderInfo: RenderInfo,
  dataMap: DataMap,
  valueMap: TNumberValueMap
): boolean => {
  let { target } = query;
  if (query.parentTarget) target = query.parentTarget; // use parent tag name for multiple values

  // Dataview ask user to add dashes for spaces as search target
  // So a dash may stands for a real dash or a space
  target = target.replace('-', '[\\s\\-]');

  // Test this in Regex101
  // remember '\s' includes new line
  // ^.*?(\[|\()\*{0,2}dvTarget\*{0,2}(::[ |\t]*(?<value>[\d\.\/\-\w,@; \t:]*))(\]|\)).*?
  const pattern = `^.*?(\\[|\\()\\*{0,2}${target}\\*{0,2}(::[ |\\t]*(?<value>[\\d\\.\\/\\-,@; \\t:${WordCharacterPattern}]*))(\\]|\\)).*?$`;

  return addMultipleValues(note, pattern, query, dataMap, valueMap, renderInfo);
};

/**
 * @summary Collects data from tables in notes
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

    const accessor = query.accessors[0];
    const { usedAsXDataset } = query;

    const table = tables.find(
      (t) => t.filePath === filePath && t.tableIndex === accessor
    );
    if (table) {
      if (usedAsXDataset) table.xQuery = query;
      else table.yQueries.push(query);
      continue;
    }
    const tableData = new TableData(filePath, accessor);
    if (usedAsXDataset) tableData.xQuery = query;
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
export const addTableData = async (
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
      const regex = new RegExp(TableSelectorPattern, 'gm');
      let match;
      let index = 0;

      while ((match = regex.exec(content))) {
        if (index === tableIndex) {
          tableContent = match[0];
          break;
        }
        index++;
      }
    } else continue; // file does not exist

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
    const values = [];

    for (const row of tableRows) {
      const dataRow = StringUtils.parseMarkdownTableRow(row.trim());
      const cells = dataRow.split('|');
      if (columnIndex < cells.length) {
        const data = cells[columnIndex].trim();
        const date = DateTimeUtils.toMoment(data, renderInfo.dateFormat);

        if (date.isValid()) {
          values.push(date);
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
        } else values.push(null);
      } else values.push(null);
    }

    if (values.every((v) => v === null))
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
              if (rowIndex < values.length && values[rowIndex]) {
                dataMap.add(
                  DateTimeUtils.dateToString(
                    values[rowIndex],
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

              if (rowIndex < values.length && values[rowIndex]) {
                dataMap.add(
                  DateTimeUtils.dateToString(
                    values[rowIndex],
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
