import {
  App,
  CachedMetadata,
  Editor,
  MarkdownPostProcessorContext,
  MarkdownView,
  MetadataCache,
  normalizePath,
  Plugin,
  TFile,
  TFolder,
  Vault,
  Workspace,
} from 'obsidian';
import DataCollector from './data-collector/data-collector';
import { Datasets } from './models/dataset';
import { ComponentType, SearchType } from './models/enums';
import { ProcessInfo } from './models/process-info';
import { RenderInfo } from './models/render-info';
import { DataMap, IQueryValuePair, XValueMap } from './models/types';
import { getRenderInfoFromYaml } from './parser/yaml-parser';
import Renderer from './renderer';
import { DEFAULT_SETTINGS, TrackerSettingTab } from './settings';
import { TrackerSettings } from './types';
import Moment = moment.Moment;

import { DateTimeUtils, NumberUtils } from './utils';
// import { getDailyNoteSettings } from "obsidian-daily-notes-interface";

declare global {
  interface Window {
    app: App;
    moment: () => Moment;
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

  get editor(): Editor {
    return this.workspace.getActiveViewOfType(MarkdownView).editor;
  }

  async onload(): Promise<void> {
    console.log('loading TrackerGT plugin');

    await this.loadSettings();

    this.addSettingTab(new TrackerSettingTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor(
      'tracker',
      this.postProcessor.bind(this)
    );

    this.addCommand({
      id: 'add-line-chart-tracker',
      name: 'Add Line Chart Tracker',
      callback: () => this.addCodeBlock(ComponentType.LineChart),
    });

    this.addCommand({
      id: 'add-bar-chart-tracker',
      name: 'Add Bar Chart Tracker',
      callback: () => this.addCodeBlock(ComponentType.BarChart),
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
    element: HTMLElement
  ): void {
    Renderer.renderErrorMessage(canvas, message);
    element.appendChild(canvas);
    return;
  }

  onunload(): void {
    console.log('unloading TrackerGT plugin');
  }

  getFilesInFolder(
    folder: TFolder,
    includeSubFolders: boolean = true
  ): TFile[] {
    let files: TFile[] = [];

    for (const item of folder.children) {
      if (item instanceof TFile && item.extension === 'md') {
        files.push(item);
      } else if (item instanceof TFolder && includeSubFolders) {
        files = files.concat(this.getFilesInFolder(item));
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
    // console.log(useSpecifiedFilesOnly);
    if (!useSpecifiedFilesOnly) {
      const folder = this.vault.getAbstractFileByPath(
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
    // console.log(specifiedFiles);
    for (const filePath of specifiedFiles) {
      let path = filePath;
      if (!path.endsWith('.md')) {
        path += '.md';
      }
      path = normalizePath(path);
      // console.log(path);

      const file = this.vault.getAbstractFileByPath(path);
      // console.log(file);
      if (file && file instanceof TFile) {
        files.push(file);
      }
    }
    // console.log(files);

    // Include files in pointed by links in file
    // console.log(filesContainsLinkedFiles);
    // console.log(fileMultiplierAfterLink);
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
      const file = this.vault.getAbstractFileByPath(normalizePath(filePath));
      if (file && file instanceof TFile) {
        // Get linked files
        const fileCache = this.metadataCache.getFileCache(file);
        const fileContent = await this.vault.adapter.read(file.path);
        const lines = fileContent.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/);
        // console.log(lines);

        if (!fileCache?.links) continue;

        for (const link of fileCache.links) {
          if (!link) continue;
          const linkedFile = this.metadataCache.getFirstLinkpathDest(
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
                const splitLines = line.split(link.original);
                // console.log(splitLines);
                if (splitLines.length === 2) {
                  const toParse = splitLines[1].trim();
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
                      const parsed = NumberUtils.parseFloatFromAny(
                        match.groups.value.trim(),
                        renderInfo.textValueMap
                      );
                      if (parsed.value !== null) {
                        linkedFileMultiplier = parsed.value;
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

    // console.log(files);
  }

  async postProcessor(
    source: string,
    element: HTMLElement,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: MarkdownPostProcessorContext
  ): Promise<void> {
    // console.log("postprocess");
    const canvas = document.createElement('div');

    let yamlText = source.trim();

    // Replace all tabs by spaces
    const tabSize = this.vault.getConfig('tabSize');
    const spaces = Array(tabSize).fill(' ').join('');
    yamlText = yamlText.replace(/\t/gm, spaces);

    // Get render info
    const renderInfo = getRenderInfoFromYaml(yamlText, this);
    if (typeof renderInfo === 'string') {
      return this.renderErrorMessage(renderInfo, canvas, element);
    }
    // console.log(renderInfo);

    // Get files
    const files: TFile[] = [];
    try {
      await this.getFiles(files, renderInfo);
    } catch (e) {
      return this.renderErrorMessage(e.message, canvas, element);
    }
    if (files.length === 0) {
      return this.renderErrorMessage(
        'No markdown files found in folder',
        canvas,
        element
      );
    }
    // console.log(files);

    // let dailyNotesSettings = getDailyNoteSettings();
    // console.log(dailyNotesSettings);
    // I always got YYYY-MM-DD from dailyNotesSettings.format
    // Use own settings panel for now

    // Collecting data to dataMap first
    const dataMap: DataMap = new Map(); // {strDate: [query: value, ...]}
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
        fileCache = this.metadataCache.getFileCache(file);
      }

      let content: string = null;
      const needContent = renderInfo.queries.some((q) => {
        const type = q.type;
        const target = q.target;
        if (
          type === SearchType.Tag ||
          type === SearchType.Text ||
          type === SearchType.dvField ||
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
        content = await this.vault.adapter.read(file.path);
      }

      // Get xValue and add it into xValueMap for later use
      const xValueMap: XValueMap = new Map(); // queryId: xValue for this file
      let skipThisFile = false;
      // console.log(renderInfo.xDataset);
      for (const xDatasetId of renderInfo.xDataset) {
        // console.log(`xDatasetId: ${xDatasetId}`);
        if (!xValueMap.has(xDatasetId)) {
          let xDate = window.moment('');
          if (xDatasetId === -1) {
            // Default using date in filename as xValue
            xDate = DataCollector.getDateFromFilename(file, renderInfo);
            // console.log(xDate);
          } else {
            const xDatasetQuery = renderInfo.queries[xDatasetId];
            // console.log(xDatasetQuery);
            switch (xDatasetQuery.type) {
              case SearchType.Frontmatter:
                xDate = DataCollector.getDateFromFrontmatter(
                  fileCache,
                  xDatasetQuery,
                  renderInfo
                );
                break;
              case SearchType.Tag:
                xDate = DataCollector.getDateFromTag(
                  content,
                  xDatasetQuery,
                  renderInfo
                );
                break;
              case SearchType.Text:
                xDate = DataCollector.getDateFromText(
                  content,
                  xDatasetQuery,
                  renderInfo
                );
                break;
              case SearchType.dvField:
                xDate = DataCollector.getDateFromDvField(
                  content,
                  xDatasetQuery,
                  renderInfo
                );
                break;
              case SearchType.FileMeta:
                xDate = DataCollector.getDateFromFileMeta(
                  file,
                  xDatasetQuery,
                  renderInfo
                );
                break;
              case SearchType.Task:
              case SearchType.TaskDone:
              case SearchType.TaskNotDone:
                xDate = DataCollector.getDateFromTask(
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
              DateTimeUtils.dateToString(xDate, renderInfo.dateFormat)
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
      // console.log(xValueMap);
      // console.log(`minDate: ${minDate}`);
      // console.log(`maxDate: ${maxDate}`);

      // Loop over queries
      const yDatasetQueries = renderInfo.queries.filter((q) => {
        return q.type !== SearchType.Table && !q.usedAsXDataset;
      });
      // console.log(yDatasetQueries);

      const loopQueryPromises = yDatasetQueries.map(async (query) => {
        // Get xValue from file if xDataset assigned
        // if (renderInfo.xDataset !== null)
        // let xDatasetId = renderInfo.xDataset;

        if (fileCache && query.type === SearchType.Tag) {
          // Add frontmatter tags, allow simple tag only
          const gotAnyValue = DataCollector.collectDataFromFrontmatterTag(
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
          const gotAnyValue = DataCollector.collectDataFromFrontmatterKey(
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
          const gotAnyValue = DataCollector.collectDataFromWiki(
            fileCache,
            query,
            renderInfo,
            dataMap,
            xValueMap
          );
          processInfo.gotAnyValidYValue ||= gotAnyValue;
        }

        if (content && query.type === SearchType.Tag) {
          const gotAnyValue = DataCollector.collectDataFromInlineTag(
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
          const gotAnyValue = DataCollector.collectDataFromText(
            content,
            query,
            renderInfo,
            dataMap,
            xValueMap
          );
          processInfo.gotAnyValidYValue ||= gotAnyValue;
        } // Search text

        // console.log("Search FileMeta");
        if (query.type === SearchType.FileMeta) {
          const gotAnyValue = DataCollector.collectDataFromFileMeta(
            file,
            content,
            query,
            renderInfo,
            dataMap,
            xValueMap
          );
          processInfo.gotAnyValidYValue ||= gotAnyValue;
        } // Search FileMeta

        // console.log("Search dvField");
        if (content && query.type === SearchType.dvField) {
          const gotAnyValue = DataCollector.collectDataFromDvField(
            content,
            query,
            renderInfo,
            dataMap,
            xValueMap
          );
          processInfo.gotAnyValidYValue ||= gotAnyValue;
        } // search dvField

        // console.log("Search Task");
        if (
          content &&
          (query.type === SearchType.Task ||
            query.type === SearchType.TaskDone ||
            query.type === SearchType.TaskNotDone)
        ) {
          const gotAnyValue = DataCollector.collectDataFromTask(
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
    // console.log(dataMap);

    // Collect data from a file, one file contains full dataset
    await DataCollector.collectDataFromTable(
      this.vault,
      dataMap,
      renderInfo,
      processInfo
    );
    if (processInfo.errorMessage) {
      return this.renderErrorMessage(processInfo.errorMessage, canvas, element);
    }
    // console.log(minDate);
    // console.log(maxDate);
    // console.log(dataMap);

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
      return this.renderErrorMessage(dateErrorMessage, canvas, element);
    }
    // console.log(renderInfo.startDate);
    // console.log(renderInfo.endDate);

    if (!processInfo.gotAnyValidYValue) {
      return this.renderErrorMessage(
        'No valid Y value found in notes',
        canvas,
        element
      );
    }

    // Reshape data for rendering
    const datasets = new Datasets(renderInfo.startDate, renderInfo.endDate);
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
        if (
          dataMap.has(
            DateTimeUtils.dateToString(curDate, renderInfo.dateFormat)
          )
        ) {
          const queryValuePairs = dataMap
            .get(DateTimeUtils.dateToString(curDate, renderInfo.dateFormat))
            .filter((pair: IQueryValuePair) => {
              return pair.query.equalTo(query);
            });
          if (queryValuePairs.length > 0) {
            // Merge values of the same day same query
            let value = null;
            for (let indPair = 0; indPair < queryValuePairs.length; indPair++) {
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
            if (value !== null) dataset.setValue(curDate, value);
          }
        }
      }
    }
    renderInfo.datasets = datasets;
    // console.log(renderInfo.datasets);

    const rendered = Renderer.render(canvas, renderInfo);
    if (typeof rendered === 'string') {
      return this.renderErrorMessage(rendered, canvas, element);
    }

    element.appendChild(canvas);
  }

  addCodeBlock(type: ComponentType): void {
    const currentView = this.workspace.activeLeaf.view;

    if (!(currentView instanceof MarkdownView)) {
      return;
    }

    let codeblockToInsert = '';
    switch (type) {
      case ComponentType.LineChart:
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
      case ComponentType.BarChart:
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
      const textInserted = this.insertOnNextLine(codeblockToInsert);
      if (!textInserted) {
      }
    }
  }

  insertOnNextLine(text: string): boolean {
    const editor = this.editor;
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
