import {
  App,
  CachedMetadata,
  Editor,
  MarkdownPostProcessorContext,
  MarkdownView,
  MetadataCache,
  Plugin,
  TFile,
  Vault,
  Workspace,
  normalizePath,
} from 'obsidian';
import * as collecting from './data-collector/data-collector';
import { TrackerError } from './errors';
import { DataMap } from './models/data-map';
import { DatasetCollection } from './models/dataset';
import { ComponentType, SearchType, ValueType } from './models/enums';
import { ProcessInfo } from './models/process-info';
import { Query } from './models/query';
import { RenderInfo } from './models/render-info';
import { TableData } from './models/table-data';
import { IQueryValuePair, TNumberValueMap } from './models/types';
import { getRenderInfo } from './parser/yaml-parser';
import * as renderer from './renderer';
import * as rendering from './renderer';
import {
  DEFAULT_SETTINGS,
  TrackerSettingTab,
  TrackerSettings,
} from './settings';
import { DateTimeUtils, IoUtils } from './utils';
import * as helper from './utils/helper';
// import { getDailyNoteSettings } from "obsidian-daily-notes-interface";

declare global {
  interface Window {
    app: App;
    moment: () => moment.Moment;
  }
}

declare module 'obsidian' {
  interface Vault {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getConfig(prop: string): any;
  }
}

export default class Tracker extends Plugin {
  settings: TrackerSettings;
  workspace: Workspace = this.app.workspace;
  vault: Vault = this.app.vault;
  metadataCache: MetadataCache = this.app.metadataCache;

  async onload(): Promise<void> {
    console.log('loading Tracker+ plugin');

    await this.loadSettings();

    this.addSettingTab(new TrackerSettingTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor(
      'tracker',
      this.processCodeBlock.bind(this)
    );

    this.addCommand({
      id: 'add-line-chart-tracker',
      name: 'Add Line Chart Tracker',
      callback: () => this.addCodeBlock(ComponentType.Line),
    });

    this.addCommand({
      id: 'add-bar-chart-tracker',
      name: 'Add Bar Chart Tracker',
      callback: () => this.addCodeBlock(ComponentType.Bar),
    });

    this.addCommand({
      id: 'add-summary-tracker',
      name: 'Add Summary Tracker',
      callback: () => this.addCodeBlock(ComponentType.Summary),
    });
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  renderErrorMessage(
    message: string,
    canvas: HTMLElement,
    el: HTMLElement
  ): void {
    rendering.renderErrorMessage(canvas, message);
    el.appendChild(canvas);
    return;
  }

  onunload = (): void => console.log('unloading Tracker+ plugin');

  /**
   * @summary Returns true if the query needs data from the note
   * @param {Query[]} queries
   * @returns {boolean}
   */
  needContent = (queries: Query[]): boolean =>
    queries.some(
      (q) =>
        q.type ===
        (SearchType.Tag ||
          SearchType.Text ||
          SearchType.DataviewField ||
          SearchType.Task ||
          SearchType.TaskDone ||
          SearchType.TaskNotDone ||
          (SearchType.FileMeta &&
            ['numWords', 'numChars', 'numSentences'].includes(q.target)))
    );

  /**
   * @summary Returns min/max dates if xDate is valid, within the range of renderInfo start/end dates, and
   * @param {ProcessInfo} processInfo
   * @param {RenderInfo} renderInfo
   * @param {moment.Moment} date
   * @returns {boolean} true if processInfo min/max dates were updated
   */
  getMinMaxDates = (
    processInfo: ProcessInfo,
    renderInfo: RenderInfo,
    date: moment.Moment
  ): { minDate: moment.Moment; maxDate: moment.Moment } => {
    const xDateIsValid =
      date.isValid() &&
      ((renderInfo.startDate !== null && date < renderInfo.startDate) ||
        (renderInfo.endDate !== null && date > renderInfo.endDate));
    if (!xDateIsValid) return { minDate: null, maxDate: null };

    let minDate = null;
    let maxDate = null;

    if (processInfo.fileAvailable == 1) minDate = maxDate = date.clone();
    else if (date < processInfo.minDate) minDate = date.clone();
    else if (date > processInfo.maxDate) maxDate = date.clone();

    return { minDate, maxDate };
  };

  /**
   * Returns datasets for each renderInfo query
   * @param {RenderInfo} renderInfo
   * @param {DataMap} dataMap
   * @returns {DatasetCollection}
   */
  getDatasets = (
    renderInfo: RenderInfo,
    dataMap: DataMap
  ): DatasetCollection => {
    const { startDate, endDate, dateFormat } = renderInfo;
    const datasets = new DatasetCollection(startDate, endDate);
    renderInfo.queries.forEach((query) => {
      // We still create a dataset for each xDataset,
      // to keep the sequence and order of targets
      const dataset = datasets.add(query, renderInfo);

      dataset.incrementTargetCount(query.numTargets);
      const date = startDate.clone();
      while (date <= endDate) {
        if (dataMap.has(DateTimeUtils.dateToString(date, dateFormat))) {
          const values = dataMap
            .get(DateTimeUtils.dateToString(date, dateFormat))
            .filter((qv: IQueryValuePair) => qv.query.equalTo(query));

          const value =
            values.length > 0
              ? values.reduce((prev, qv) => {
                  if (Number.isNumber(qv.value) && !Number.isNaN(qv.value))
                    prev.value += qv.value;
                  return prev;
                }).value
              : null;
          if (value !== null) dataset.setValue(date, value);
        }
        date.add(1, 'days');
      }
    });
    return datasets;
  };

  /**
   * @summary Returns true if the queries are searching Frontmatter, Tags, or Wikis
   * @param {RenderInfo} renderInfo
   * @returns {boolean}
   */
  needFileCache = (renderInfo: RenderInfo): boolean => {
    return renderInfo.queries.some(
      (q) =>
        q.type === SearchType.Frontmatter ||
        SearchType.Tag ||
        SearchType.Wiki ||
        SearchType.WikiLink ||
        SearchType.WikiDisplay
    );
  };

  /**
   * @summary Processes a tracker code block
   * @param {string} source
   * @param {HTMLElement} element
   * @param {MarkdownPostProcessorContext} _context
   */
  async processCodeBlock(
    source: string,
    element: HTMLElement,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: MarkdownPostProcessorContext
  ): Promise<void> {
    const container = document.createElement('div');
    try {
      let yamlText = source.trim();

      // Replace all tabs with spaces
      const tabSize = this.app.vault.getConfig('tabSize');
      const spaces = Array(tabSize).fill(' ').join('');
      yamlText = yamlText.replace(/\t/gm, spaces);

      // Get render info
      const renderInfo = getRenderInfo(yamlText, this);

      // Get files
      const files: TFile[] = await IoUtils.getFiles(
        renderInfo,
        this.vault,
        this.metadataCache
      );
      if (files.length === 0)
        // TODO should this move to the getFiles func?
        throw new TrackerError(
          `Markdown files not found in folder '${renderInfo.folder}'`
        );

      // Collect data for dataMap
      const dataMap = new DataMap(); // {strDate: [query: value, ...]}
      const processInfo = new ProcessInfo();
      processInfo.fileTotal = files.length;

      // Collect data from files, each file has one data point for each query
      const loopFilePromises = files.map(async (file) => {
        // Get fileCache and content
        let fileCache: CachedMetadata = null;
        const needFileCache = renderInfo.queries.some((q) => {
          const type = q.type;

          // Why is this here?
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const target = q.target;

          if (
            type === SearchType.Frontmatter ||
            type === SearchType.Tag ||
            type === SearchType.Wiki ||
            type === SearchType.WikiLink ||
            type === SearchType.WikiDisplay
          ) {
            return true;
          }
          return false;
        });
        if (needFileCache) {
          fileCache = this.app.metadataCache.getFileCache(file);
        }

        let content: string = null;
        const needContent = renderInfo.queries.some((q) => {
          const type = q.type;
          const target = q.target;
          if (
            type === SearchType.Tag ||
            type === SearchType.Text ||
            type === SearchType.DataviewField ||
            type === SearchType.Task ||
            type === SearchType.TaskAll ||
            type === SearchType.TaskDone ||
            type === SearchType.TaskNotDone
          ) {
            return true;
          } else if (type === SearchType.FileMeta) {
            if (
              target === 'numWords' ||
              target === 'numChars' ||
              target === 'numSentences'
            ) {
              return true;
            }
          }
          return false;
        });
        if (needContent) {
          content = await this.app.vault.adapter.read(file.path);
        }

        // Get xValue and add it into xValueMap for later use
        const xValueMap: TNumberValueMap = new Map(); // queryId: xValue for this file
        let skipThisFile = false;
        for (const xDatasetId of renderInfo.xDataset) {
          if (!xValueMap.has(xDatasetId)) {
            let xDate = window.moment('');
            if (xDatasetId === -1) {
              // Default using date in filename as xValue
              xDate = collecting.getDateFromFilename(file, renderInfo);
            } else {
              const xDatasetQuery = renderInfo.queries[xDatasetId];
              switch (xDatasetQuery.type) {
                case SearchType.Frontmatter:
                  xDate = collecting.getDateFromFrontmatter(
                    fileCache,
                    xDatasetQuery,
                    renderInfo
                  );
                  break;
                case SearchType.Tag:
                  xDate = collecting.getDateFromTag(
                    content,
                    xDatasetQuery,
                    renderInfo
                  );
                  break;
                case SearchType.Text:
                  xDate = collecting.getDateFromText(
                    content,
                    xDatasetQuery,
                    renderInfo
                  );
                  break;
                case SearchType.DataviewField:
                  xDate = collecting.getDateFromDvField(
                    content,
                    xDatasetQuery,
                    renderInfo
                  );
                  break;
                case SearchType.FileMeta:
                  xDate = collecting.getDateFromFileMeta(
                    file,
                    xDatasetQuery,
                    renderInfo
                  );
                  break;
                case SearchType.Task:
                case SearchType.TaskAll:
                case SearchType.TaskDone:
                case SearchType.TaskNotDone:
                  xDate = collecting.getDateFromTask(
                    content,
                    xDatasetQuery,
                    renderInfo
                  );
                  break;
              }
            }

            if (!xDate.isValid()) {
              skipThisFile = true;
              processInfo.fileNotInFormat++;
            } else {
              if (renderInfo.startDate !== null) {
                if (xDate < renderInfo.startDate) {
                  skipThisFile = true;
                  processInfo.fileOutOfDateRange++;
                }
              }
              if (renderInfo.endDate !== null) {
                if (xDate > renderInfo.endDate) {
                  skipThisFile = true;
                  processInfo.fileOutOfDateRange++;
                }
              }
            }

            if (!skipThisFile) {
              processInfo.gotAnyValidXValue ||= true;
              xValueMap.set(
                xDatasetId,
                helper.dateToStr(xDate, renderInfo.dateFormat)
              );
              processInfo.fileAvailable++;

              // Get min/max date
              if (processInfo.fileAvailable == 1) {
                processInfo.minDate = xDate.clone();
                processInfo.maxDate = xDate.clone();
              } else {
                if (xDate < processInfo.minDate) {
                  processInfo.minDate = xDate.clone();
                }
                if (xDate > processInfo.maxDate) {
                  processInfo.maxDate = xDate.clone();
                }
              }
            }
          }
        }
        if (skipThisFile) return;

        // Loop over queries
        const yDatasetQueries = renderInfo.queries.filter((q) => {
          return q.type !== SearchType.Table && !q.usedAsXDataset;
        });

        const loopQueryPromises = yDatasetQueries.map(async (query) => {
          // Get xValue from file if xDataset assigned
          // if (renderInfo.xDataset !== null)
          // let xDatasetId = renderInfo.xDataset;

          if (fileCache && query.type === SearchType.Tag) {
            // Add frontmatter tags, allow simple tag only
            const gotAnyValue = collecting.collectDataFromFrontmatterTag(
              fileCache,
              query,
              renderInfo,
              dataMap,
              xValueMap
            );
            processInfo.gotAnyValidYValue ||= gotAnyValue;
          } // Search frontmatter tags

          if (
            fileCache &&
            query.type === SearchType.Frontmatter &&
            query.target !== 'tags'
          ) {
            const gotAnyValue = collecting.collectDataFromFrontmatterKey(
              fileCache,
              query,
              renderInfo,
              dataMap,
              xValueMap
            );
            processInfo.gotAnyValidYValue ||= gotAnyValue;
          }

          if (
            fileCache &&
            (query.type === SearchType.Wiki ||
              query.type === SearchType.WikiLink ||
              query.type === SearchType.WikiDisplay)
          ) {
            const gotAnyValue = collecting.collectDataFromWiki(
              fileCache,
              query,
              renderInfo,
              dataMap,
              xValueMap
            );
            processInfo.gotAnyValidYValue ||= gotAnyValue;
          }

          if (content && query.type === SearchType.Tag) {
            const gotAnyValue = collecting.collectDataFromInlineTag(
              content,
              query,
              renderInfo,
              dataMap,
              xValueMap
            );
            processInfo.gotAnyValidYValue ||= gotAnyValue;
          } // Search inline tags

          if (content && query.type === SearchType.Text) {
            const gotAnyValue = collecting.collectDataFromText(
              content,
              query,
              renderInfo,
              dataMap,
              xValueMap
            );
            processInfo.gotAnyValidYValue ||= gotAnyValue;
          } // Search text

          if (query.type === SearchType.FileMeta) {
            const gotAnyValue = collecting.collectDataFromFileMeta(
              file,
              content,
              query,
              renderInfo,
              dataMap,
              xValueMap
            );
            processInfo.gotAnyValidYValue ||= gotAnyValue;
          } // Search FileMeta

          if (content && query.type === SearchType.DataviewField) {
            const gotAnyValue = collecting.collectDataFromDvField(
              content,
              query,
              renderInfo,
              dataMap,
              xValueMap
            );
            processInfo.gotAnyValidYValue ||= gotAnyValue;
          } // search dvField

          if (
            content &&
            (query.type === SearchType.Task ||
              query.type === SearchType.TaskAll ||
              query.type === SearchType.TaskDone ||
              query.type === SearchType.TaskNotDone)
          ) {
            const gotAnyValue = collecting.collectDataFromTask(
              content,
              query,
              renderInfo,
              dataMap,
              xValueMap
            );
            processInfo.gotAnyValidYValue ||= gotAnyValue;
          } // search Task
        });
        await Promise.all(loopQueryPromises);
      });
      await Promise.all(loopFilePromises);

      // Collect data from a file, one file contains full dataset
      await this.collectDataFromTable(dataMap, renderInfo, processInfo);
      if (processInfo.errorMessage) {
        return this.renderErrorMessage(
          processInfo.errorMessage,
          container,
          element
        );
      }

      // Check date range
      // minDate and maxDate are collected without knowing startDate and endDate
      let dateErrorMessage = '';
      if (
        !processInfo.minDate.isValid() ||
        !processInfo.maxDate.isValid() ||
        processInfo.fileAvailable === 0 ||
        !processInfo.gotAnyValidXValue
      ) {
        dateErrorMessage = `No valid date as X value found in notes`;
        if (processInfo.fileOutOfDateRange > 0) {
          dateErrorMessage += `\n${processInfo.fileOutOfDateRange} files are out of the date range.`;
        }
        if (processInfo.fileNotInFormat) {
          dateErrorMessage += `\n${processInfo.fileNotInFormat} files are not in the right format.`;
        }
      }
      if (renderInfo.startDate === null && renderInfo.endDate === null) {
        // No date arguments
        renderInfo.startDate = processInfo.minDate.clone();
        renderInfo.endDate = processInfo.maxDate.clone();
      } else if (renderInfo.startDate !== null && renderInfo.endDate === null) {
        if (renderInfo.startDate < processInfo.maxDate) {
          renderInfo.endDate = processInfo.maxDate.clone();
        } else {
          dateErrorMessage = 'Invalid date range';
        }
      } else if (renderInfo.endDate !== null && renderInfo.startDate === null) {
        if (renderInfo.endDate > processInfo.minDate) {
          renderInfo.startDate = processInfo.minDate.clone();
        } else {
          dateErrorMessage = 'Invalid date range';
        }
      } else {
        // startDate and endDate are valid
        if (
          (renderInfo.startDate < processInfo.minDate &&
            renderInfo.endDate < processInfo.minDate) ||
          (renderInfo.startDate > processInfo.maxDate &&
            renderInfo.endDate > processInfo.maxDate)
        ) {
          dateErrorMessage = 'Invalid date range';
        }
      }
      if (dateErrorMessage) {
        return this.renderErrorMessage(dateErrorMessage, container, element);
      }

      if (!processInfo.gotAnyValidYValue) {
        return this.renderErrorMessage(
          'No valid Y value found in notes',
          container,
          element
        );
      }

      // Reshape data for rendering
      const datasets = new DatasetCollection(
        renderInfo.startDate,
        renderInfo.endDate
      );
      for (const query of renderInfo.queries) {
        // We still create a dataset for xDataset,
        // to keep the sequence and order of targets
        const dataset = datasets.createDataset(query, renderInfo);
        // Add number of targets to the dataset
        // Number of targets has been accumulated while collecting data
        dataset.incrementTargetCount(query.numTargets);
        for (
          let curDate = renderInfo.startDate.clone();
          curDate <= renderInfo.endDate;
          curDate.add(1, 'days')
        ) {
          // dataMap --> {date: [query: value, ...]}
          if (dataMap.has(helper.dateToStr(curDate, renderInfo.dateFormat))) {
            const queryValuePairs = dataMap
              .get(helper.dateToStr(curDate, renderInfo.dateFormat))
              .filter((pair: IQueryValuePair) => {
                return pair.query.equalTo(query);
              });
            if (queryValuePairs.length > 0) {
              // Merge values of the same day same query
              let value = null;
              for (
                let indPair = 0;
                indPair < queryValuePairs.length;
                indPair++
              ) {
                const collected = queryValuePairs[indPair].value;
                if (Number.isNumber(collected) && !Number.isNaN(collected)) {
                  if (value === null) {
                    value = collected;
                  } else {
                    value += collected;
                  }
                }
              }
              if (value !== null) {
                dataset.setValue(curDate, value);
              }
            }
          }
        }
      }
      renderInfo.datasets = datasets;

      const retRender = renderer.renderTracker(container, renderInfo);
      if (typeof retRender === 'string') {
        return this.renderErrorMessage(retRender, container, element);
      }

      element.appendChild(container);
    } catch (e) {
      renderer.renderError(container, e);
      element.appendChild(container);
    }
  }

  // TODO: remove this.app and move to collecting.ts
  async collectDataFromTable(
    dataMap: DataMap,
    renderInfo: RenderInfo,
    processInfo: ProcessInfo
  ): Promise<void> {
    const tableQueries = renderInfo.queries.filter(
      (q) => q.type === SearchType.Table
    );
    // Separate queries by tables and xDatasets/yDatasets
    const tables: Array<TableData> = [];
    let tableFileNotFound = false;
    for (const query of tableQueries) {
      const filePath = query.parentTarget;
      const file = this.app.vault.getAbstractFileByPath(
        normalizePath(filePath + '.md')
      );
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
        if (isX) {
          table.xQuery = query;
        } else {
          table.yQueries.push(query);
        }
      } else {
        const tableData = new TableData(filePath, tableIndex);
        if (isX) {
          tableData.xQuery = query;
        } else {
          tableData.yQueries.push(query);
        }
        tables.push(tableData);
      }
    }

    if (tableFileNotFound) {
      processInfo.errorMessage = 'File containing tables not found';
      return;
    }

    for (const tableData of tables) {
      //extract xDataset from query
      const xDatasetQuery = tableData.xQuery;
      if (!xDatasetQuery) {
        // missing xDataset
        continue;
      }
      const yDatasetQueries = tableData.yQueries;
      let filePath = xDatasetQuery.parentTarget;
      const tableIndex = xDatasetQuery.getAccessor();

      // Get table text
      let textTable = '';
      filePath = filePath + '.md';
      const file = this.app.vault.getAbstractFileByPath(
        normalizePath(filePath)
      );
      if (file && file instanceof TFile) {
        processInfo.fileAvailable++;
        const content = await this.app.vault.adapter.read(file.path);

        // Test this in Regex101
        // This is a not-so-strict table selector
        // ((\r?\n){2}|^)([^\r\n]*\|[^\r\n]*(\r?\n)?)+(?=(\r?\n){2}|$)
        const strMDTableRegex =
          '((\\r?\\n){2}|^)([^\\r\\n]*\\|[^\\r\\n]*(\\r?\\n)?)+(?=(\\r?\\n){2}|$)';
        const mdTableRegex = new RegExp(strMDTableRegex, 'gm');
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
        // file not exists
        continue;
      }

      let tableLines = textTable.split(/\r?\n/);
      tableLines = tableLines.filter((line) => {
        return line !== '';
      });
      let numColumns = 0;
      let numDataRows = 0;

      // Make sure it is a valid table first
      if (tableLines.length >= 2) {
        // Must have header and separator line
        let headerLine = tableLines.shift().trim();
        headerLine = helper.trimByChar(headerLine, '|');
        const headerSplitted = headerLine.split('|');
        numColumns = headerSplitted.length;

        let sepLine = tableLines.shift().trim();
        sepLine = helper.trimByChar(sepLine, '|');
        const sepLineSplitted = sepLine.split('|');
        for (const col of sepLineSplitted) {
          if (!col.includes('-')) break; // Not a valid sep
        }

        numDataRows = tableLines.length;
      }

      if (numDataRows == 0) continue;

      // get x data
      const columnXDataset = xDatasetQuery.getAccessor(1);
      if (columnXDataset >= numColumns) continue;
      const xValues = [];

      let indLine = 0;
      for (const tableLine of tableLines) {
        const dataRow = helper.trimByChar(tableLine.trim(), '|');
        const dataRowSplitted = dataRow.split('|');
        if (columnXDataset < dataRowSplitted.length) {
          const data = dataRowSplitted[columnXDataset].trim();
          const date = helper.strToDate(data, renderInfo.dateFormat);

          if (date.isValid()) {
            xValues.push(date);

            if (
              !processInfo.minDate.isValid() &&
              !processInfo.maxDate.isValid()
            ) {
              processInfo.minDate = date.clone();
              processInfo.maxDate = date.clone();
            } else {
              if (date < processInfo.minDate) {
                processInfo.minDate = date.clone();
              }
              if (date > processInfo.maxDate) {
                processInfo.maxDate = date.clone();
              }
            }
          } else {
            xValues.push(null);
          }
        } else {
          xValues.push(null);
        }

        // TODO What is this doing?
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        indLine++;
      }

      if (
        xValues.every((v) => {
          return v === null;
        })
      ) {
        processInfo.errorMessage = 'No valid date as X value found in table';
        return;
      } else {
        processInfo.gotAnyValidXValue ||= true;
      }

      // get y data
      for (const yDatasetQuery of yDatasetQueries) {
        const columnOfInterest = yDatasetQuery.getAccessor(1);
        if (columnOfInterest >= numColumns) continue;

        let indLine = 0;
        for (const tableLine of tableLines) {
          const dataRow = helper.trimByChar(tableLine.trim(), '|');
          const dataRowSplitted = dataRow.split('|');
          if (columnOfInterest < dataRowSplitted.length) {
            const data = dataRowSplitted[columnOfInterest].trim();
            const splitted = data.split(yDatasetQuery.getSeparator());
            if (!splitted) continue;
            if (splitted.length === 1) {
              const retParse = helper.parseFloatFromAny(
                splitted[0],
                renderInfo.textValueMap
              );
              if (retParse.value !== null) {
                if (retParse.type === ValueType.Time) {
                  yDatasetQuery.valueType = ValueType.Time;
                }
                const value = retParse.value;
                if (indLine < xValues.length && xValues[indLine]) {
                  processInfo.gotAnyValidYValue ||= true;
                  dataMap.add(
                    helper.dateToStr(xValues[indLine], renderInfo.dateFormat),
                    { query: yDatasetQuery, value }
                  );
                }
              }
            } else if (
              splitted.length > yDatasetQuery.getAccessor(2) &&
              yDatasetQuery.getAccessor(2) >= 0
            ) {
              let value = null;
              const splittedPart =
                splitted[yDatasetQuery.getAccessor(2)].trim();
              const retParse = helper.parseFloatFromAny(
                splittedPart,
                renderInfo.textValueMap
              );
              if (retParse.value !== null) {
                if (retParse.type === ValueType.Time) {
                  yDatasetQuery.valueType = ValueType.Time;
                }
                value = retParse.value;
                if (indLine < xValues.length && xValues[indLine]) {
                  processInfo.gotAnyValidYValue ||= true;
                  dataMap.add(
                    helper.dateToStr(xValues[indLine], renderInfo.dateFormat),
                    { query: yDatasetQuery, value }
                  );
                }
              }
            }
          }

          indLine++;
        } // Loop over tableLines
      }
    }
  }

  getEditor(): Editor {
    return this.app.workspace.getActiveViewOfType(MarkdownView).editor;
  }

  addCodeBlock(outputType: ComponentType): void {
    const currentView = this.app.workspace.activeLeaf.view;

    if (!(currentView instanceof MarkdownView)) {
      return;
    }

    let codeblockToInsert = '';
    switch (outputType) {
      case ComponentType.Line:
        codeblockToInsert = `\`\`\` tracker
searchType: tag
searchTarget: tagName
folder: /
startDate:
endDate:
line:
    title: "Line Chart"
    xAxisLabel: Date
    yAxisLabel: Value
\`\`\``;
        break;
      case ComponentType.Bar:
        codeblockToInsert = `\`\`\` tracker
searchType: tag
searchTarget: tagName
folder: /
startDate:
endDate:
bar:
    title: "Bar Chart"
    xAxisLabel: Date
    yAxisLabel: Value
\`\`\``;
        break;
      case ComponentType.Summary:
        codeblockToInsert = `\`\`\` tracker
searchType: tag
searchTarget: tagName
folder: /
startDate:
endDate:
summary:
    template: "Average value of tagName is {{average}}"
    style: "color:white;"
\`\`\``;
        break;
      default:
        break;
    }

    if (codeblockToInsert !== '') {
      const textInserted = this.insertToNextLine(codeblockToInsert);
      if (!textInserted) {
      }
    }
  }

  insertToNextLine(text: string): boolean {
    const editor = this.getEditor();

    if (editor) {
      const cursor = editor.getCursor();
      const lineNumber = cursor.line;
      const line = editor.getLine(lineNumber);

      cursor.ch = line.length;
      editor.setSelection(cursor);
      editor.replaceSelection('\n' + text);

      return true;
    }

    return false;
  }
}
