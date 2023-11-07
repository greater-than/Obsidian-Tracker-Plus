import {
  App,
  CachedMetadata,
  Editor,
  MarkdownPostProcessorContext,
  MarkdownView,
  Plugin,
  TFile,
  TFolder,
  normalizePath,
} from 'obsidian';
import * as collecting from './data-collector/data-collector';
import { DataMap } from './models/data-map';
import { DatasetCollection } from './models/dataset';
import { ComponentType, SearchType, ValueType } from './models/enums';
import { ProcessInfo } from './models/process-info';
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

  onunload(): void {
    console.log('unloading Tracker+ plugin');
  }

  getFilesInFolder(
    folder: TFolder,
    includeSubFolders: boolean = true
  ): TFile[] {
    let files: TFile[] = [];

    for (const item of folder.children) {
      if (item instanceof TFile) {
        if (item.extension === 'md') {
          files.push(item);
        }
      } else {
        if (item instanceof TFolder && includeSubFolders) {
          files = files.concat(this.getFilesInFolder(item));
        }
      }
    }

    return files;
  }

  async getFiles(
    files: TFile[],
    renderInfo: RenderInfo,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _includeSubFolders: boolean = true
  ): Promise<void> {
    if (!files) return;

    const folderToSearch = renderInfo.folder;
    const useSpecifiedFilesOnly = renderInfo.specifiedFilesOnly;
    const specifiedFiles = renderInfo.file;
    const filesContainsLinkedFiles = renderInfo.fileContainsLinkedFiles;
    const fileMultiplierAfterLink = renderInfo.fileMultiplierAfterLink;

    // Include files in folder
    if (!useSpecifiedFilesOnly) {
      const folder = this.app.vault.getAbstractFileByPath(
        normalizePath(folderToSearch)
      );
      if (folder && folder instanceof TFolder) {
        const folderFiles = this.getFilesInFolder(folder);
        for (const file of folderFiles) {
          files.push(file);
        }
      }
    }

    // Include specified file
    for (const filePath of specifiedFiles) {
      let path = filePath;
      if (!path.endsWith('.md')) {
        path += '.md';
      }
      path = normalizePath(path);

      const file = this.app.vault.getAbstractFileByPath(path);
      // console.log(file);
      if (file && file instanceof TFile) {
        files.push(file);
      }
    }

    // Include files in pointed by links in file
    let linkedFileMultiplier = 1;
    let searchFileMultiplierAfterLink = true;
    if (fileMultiplierAfterLink === '') {
      searchFileMultiplierAfterLink = false;
    } else if (/^[0-9]+$/.test(fileMultiplierAfterLink)) {
      // integer
      linkedFileMultiplier = parseFloat(fileMultiplierAfterLink);
      searchFileMultiplierAfterLink = false;
    } else if (!/\?<value>/.test(fileMultiplierAfterLink)) {
      // no 'value' named group
      searchFileMultiplierAfterLink = false;
    }
    for (let filePath of filesContainsLinkedFiles) {
      if (!filePath.endsWith('.md')) {
        filePath += '.md';
      }
      const file = this.app.vault.getAbstractFileByPath(
        normalizePath(filePath)
      );
      if (file && file instanceof TFile) {
        // Get linked files
        const fileCache = this.app.metadataCache.getFileCache(file);
        const fileContent = await this.app.vault.adapter.read(file.path);
        const lines = fileContent.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/);
        // console.log(lines);

        if (!fileCache?.links) continue;

        for (const link of fileCache.links) {
          if (!link) continue;
          const linkedFile = this.app.metadataCache.getFirstLinkpathDest(
            link.link,
            filePath
          );
          if (linkedFile && linkedFile instanceof TFile) {
            if (searchFileMultiplierAfterLink) {
              // Get the line of link in file
              const lineNumber = link.position.end.line;
              // console.log(lineNumber);
              if (lineNumber >= 0 && lineNumber < lines.length) {
                const line = lines[lineNumber];
                // console.log(line);

                // Try extract multiplier
                // if (link.position)
                const splitted = line.split(link.original);
                // console.log(splitted);
                if (splitted.length === 2) {
                  const toParse = splitted[1].trim();
                  const pattern = fileMultiplierAfterLink;
                  const regex = new RegExp(pattern, 'gm');
                  let match;
                  while ((match = regex.exec(toParse))) {
                    // console.log(match);
                    if (
                      typeof match.groups !== 'undefined' &&
                      typeof match.groups.value !== 'undefined'
                    ) {
                      // must have group name 'value'
                      const retParse = helper.parseFloatFromAny(
                        match.groups.value.trim(),
                        renderInfo.textValueMap
                      );
                      if (retParse.value !== null) {
                        linkedFileMultiplier = retParse.value;
                        break;
                      }
                    }
                  }
                }
              }
            }

            for (let i = 0; i < linkedFileMultiplier; i++) {
              files.push(linkedFile);
            }
          }
        }
      }
    }
  }

  async processCodeBlock(
    source: string,
    element: HTMLElement,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _ctx: MarkdownPostProcessorContext
  ): Promise<void> {
    const container = document.createElement('div');
    try {
      let yamlText = source.trim();

      // Replace all tabs by spaces
      const tabSize = this.app.vault.getConfig('tabSize');
      const spaces = Array(tabSize).fill(' ').join('');
      yamlText = yamlText.replace(/\t/gm, spaces);

      // Get render info
      const retRenderInfo = getRenderInfo(yamlText, this);
      if (typeof retRenderInfo === 'string') {
        return this.renderErrorMessage(retRenderInfo, container, element);
      }
      const renderInfo = retRenderInfo as RenderInfo;

      // Get files
      const files: TFile[] = [];
      try {
        await this.getFiles(files, renderInfo);
      } catch (e) {
        return this.renderErrorMessage(e.message, container, element);
      }
      if (files.length === 0) {
        return this.renderErrorMessage(
          'No markdown files found in folder',
          container,
          element
        );
      }
      // console.log(files);

      // let dailyNotesSettings = getDailyNoteSettings();
      // console.log(dailyNotesSettings);
      // I always got YYYY-MM-DD from dailyNotesSettings.format
      // Use own settings panel for now

      // Collecting data to dataMap first
      const dataMap = new DataMap(); // {strDate: [query: value, ...]}
      const processInfo = new ProcessInfo();
      processInfo.fileTotal = files.length;

      // Collect data from files, each file has one data point for each query
      const loopFilePromises = files.map(async (file) => {
        // console.log(file.basename);
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
        // console.log(renderInfo.xDataset);
        for (const xDatasetId of renderInfo.xDataset) {
          // console.log(`xDatasetId: ${xDatasetId}`);
          if (!xValueMap.has(xDatasetId)) {
            let xDate = window.moment('');
            if (xDatasetId === -1) {
              // Default using date in filename as xValue
              xDate = collecting.getDateFromFilename(file, renderInfo);
              // console.log(xDate);
            } else {
              const xDatasetQuery = renderInfo.queries[xDatasetId];
              // console.log(xDatasetQuery);
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
              // console.log("Invalid xDate");
              skipThisFile = true;
              processInfo.fileNotInFormat++;
            } else {
              // console.log("file " + file.basename + " accepted");
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

          // console.log("Search inline tags");
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

          // console.log("Search Text");
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
      // console.log(`fileTotal: ${processInfo.fileTotal}`);
      // console.log(`fileAvailable: ${processInfo.fileAvailable}`);
      // console.log(`fileNotInFormat: ${processInfo.fileNotInFormat}`);
      // console.log(`fileOutOfDateRange: ${processInfo.fileOutOfDateRange}`);
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
      // console.log(renderInfo.startDate);
      // console.log(renderInfo.endDate);

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
          // console.log(curDate);

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
              // console.log(hasValue);
              // console.log(value);
              if (value !== null) {
                dataset.setValue(curDate, value);
              }
            }
          }
        }
      }
      renderInfo.datasets = datasets;
      // console.log(renderInfo.datasets);

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
    // console.log("collectDataFromTable");

    const tableQueries = renderInfo.queries.filter(
      (q) => q.type === SearchType.Table
    );
    // console.log(tableQueries);
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
    // console.log(tables);

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
        // console.log(content);

        // Test this in Regex101
        // This is a not-so-strict table selector
        // ((\r?\n){2}|^)([^\r\n]*\|[^\r\n]*(\r?\n)?)+(?=(\r?\n){2}|$)
        const strMDTableRegex =
          '((\\r?\\n){2}|^)([^\\r\\n]*\\|[^\\r\\n]*(\\r?\\n)?)+(?=(\\r?\\n){2}|$)';
        // console.log(strMDTableRegex);
        const mdTableRegex = new RegExp(strMDTableRegex, 'gm');
        let match;
        let indTable = 0;

        while ((match = mdTableRegex.exec(content))) {
          // console.log(match);
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
      // console.log(textTable);

      let tableLines = textTable.split(/\r?\n/);
      tableLines = tableLines.filter((line) => {
        return line !== '';
      });
      let numColumns = 0;
      let numDataRows = 0;
      // console.log(tableLines);

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
          if (!col.includes('-')) {
            break; // Not a valid sep
          }
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
      // console.log(xValues);

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
        // console.log(`columnOfInterest: ${columnOfInterest}, numColumns: ${numColumns}`);
        if (columnOfInterest >= numColumns) continue;

        let indLine = 0;
        for (const tableLine of tableLines) {
          const dataRow = helper.trimByChar(tableLine.trim(), '|');
          const dataRowSplitted = dataRow.split('|');
          if (columnOfInterest < dataRowSplitted.length) {
            const data = dataRowSplitted[columnOfInterest].trim();
            const splitted = data.split(yDatasetQuery.getSeparator());
            // console.log(splitted);
            if (!splitted) continue;
            if (splitted.length === 1) {
              const retParse = helper.parseFloatFromAny(
                splitted[0],
                renderInfo.textValueMap
              );
              // console.log(retParse);
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
              // console.log(splittedPart);
              const retParse = helper.parseFloatFromAny(
                splittedPart,
                renderInfo.textValueMap
              );
              // console.log(retParse);
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
