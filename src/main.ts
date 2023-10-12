import {
  App,
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
import { commands } from './commands';
import DataCollector from './data-collector/data-collector';
import { InvalidDateRangeError, TrackerError } from './errors';
import { Datasets } from './models/dataset';
import { ComponentType, SearchType } from './models/enums';
import { ProcessInfo } from './models/process-info';
import { RenderInfo } from './models/render-info';
import { DataMap, IQueryValuePair, XValueMap } from './models/types';
import { getRenderInfoFromYaml } from './parser/yaml-parser';
import Renderer from './renderer';
import { DEFAULT_SETTINGS, TrackerSettingTab } from './settings';
import { TrackerSettings } from './types';
import { DateTimeUtils, NumberUtils } from './utils';
import Moment = moment.Moment;

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
    console.log('loading Tracker+ plugin');

    await this.loadSettings();

    this.addSettingTab(new TrackerSettingTab(this.app, this));

    this.registerMarkdownCodeBlockProcessor(
      'tracker',
      this.postProcessor.bind(this)
    );

    commands.forEach((command) => this.addCommand(command));
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  renderErrorMessage(
    error: Error,
    container: HTMLElement,
    element: HTMLElement
  ): void {
    Renderer.renderErrorMessage(container, error);
    element.appendChild(container);
  }

  onunload(): void {
    console.log('unloading Tracker+ plugin');
  }

  getFilesInFolder(
    folder: TFolder,
    includeSubFolders: boolean = true
  ): TFile[] {
    let files: TFile[] = [];

    folder.children.forEach((item) =>
      item instanceof TFile && item.extension === 'md'
        ? files.push(item)
        : item instanceof TFolder && includeSubFolders
        ? (files = files.concat(this.getFilesInFolder(item)))
        : (files = [])
    );
    return files;
  }

  async getFiles(files: TFile[], renderInfo: RenderInfo): Promise<void> {
    if (!files) return;

    const {
      folder: rootFolder,
      specifiedFilesOnly,
      file: specifiedFiles,
      fileContainsLinkedFiles: linkedFiles,
      fileMultiplierAfterLink,
      textValueMap,
    } = renderInfo;

    const { vault } = this;

    // Include files in folder
    if (!specifiedFilesOnly) {
      const folder = vault.getAbstractFileByPath(normalizePath(rootFolder));
      if (folder && folder instanceof TFolder)
        this.getFilesInFolder(folder).forEach((file) => files.push(file));
    }

    // Include specified files
    specifiedFiles.forEach((filePath) => {
      const path = filePath.endsWith('.md') ? filePath : `${filePath}.md`;
      const file = vault.getAbstractFileByPath(normalizePath(path));
      if (file && file instanceof TFile) files.push(file);
    });

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

    for (const filePath of linkedFiles) {
      const path = filePath.endsWith('.md') ? filePath : `${filePath}.md`;
      const file = this.vault.getAbstractFileByPath(normalizePath(path));
      if (file && file instanceof TFile) {
        // Get linked files
        const fileCache = this.metadataCache.getFileCache(file);
        const fileContent = await vault.adapter.read(file.path);
        const lines = fileContent.split(/\r\n|[\n\v\f\r\x85\u2028\u2029]/);

        if (!fileCache?.links) continue;

        for (const link of fileCache.links) {
          if (!link) continue;
          const linkedFile = this.metadataCache.getFirstLinkpathDest(
            link.link,
            path
          );
          if (linkedFile && linkedFile instanceof TFile) {
            if (!searchFileMultiplierAfterLink) continue;

            // Get the line of link in file
            const lineNumber = link.position.end.line;
            if (!(lineNumber >= 0 && lineNumber < lines.length)) continue;
            const line = lines[lineNumber];

            // Extract multiplier
            const splitLines = line.split(link.original);
            if (!(splitLines.length === 2)) continue;

            const toParse = splitLines[1].trim();
            const pattern = fileMultiplierAfterLink;
            const regex = new RegExp(pattern, 'gm');
            let match;
            while ((match = regex.exec(toParse))) {
              if (
                typeof match.groups !== 'undefined' &&
                typeof match.groups.value !== 'undefined'
              ) {
                // must have group name 'value'
                const parsed = NumberUtils.parseFloatFromAny(
                  match.groups.value.trim(),
                  textValueMap
                );
                if (parsed.value === null) {
                  linkedFileMultiplier = parsed.value;
                  break;
                }
              }
            }

            for (let i = 0; i < linkedFileMultiplier; i++)
              files.push(linkedFile);
          }
        }
      }
    }
  }

  async postProcessor(
    source: string,
    element: HTMLElement,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: MarkdownPostProcessorContext
  ): Promise<void> {
    const container = document.createElement('div');

    try {
      let yamlText = source.trim();

      // Replace all tabs by spaces
      const tabSize = this.vault.getConfig('tabSize');
      const spaces = Array(tabSize).fill(' ').join('');
      yamlText = yamlText.replace(/\t/gm, spaces);

      // Get render info
      const renderInfo = getRenderInfoFromYaml(yamlText, this);

      // Get files
      const files: TFile[] = [];

      await this.getFiles(files, renderInfo);
      if (files.length === 0)
        throw new TrackerError('No markdown files found in folder');

      // Collecting data to dataMap first
      const dataMap: DataMap = new Map(); // {strDate: [query: value, ...]}
      const processInfo = new ProcessInfo();
      processInfo.fileTotal = files.length;

      // Collect data from files, each file has one data point for each query
      const filePromises = files.map(async (file) => {
        // Get fileCache and content
        const needFileCache = renderInfo.queries.some(
          (q) =>
            q.type === SearchType.Frontmatter ||
            SearchType.Tag ||
            SearchType.Wiki ||
            SearchType.WikiLink ||
            SearchType.WikiDisplay
        );

        const fileCache = needFileCache
          ? this.metadataCache.getFileCache(file)
          : null;

        const needContent = renderInfo.queries.some(
          (q) =>
            q.type ===
            (SearchType.Tag ||
              SearchType.Text ||
              SearchType.DvField ||
              SearchType.Task ||
              SearchType.TaskDone ||
              SearchType.TaskNotDone ||
              (SearchType.FileMeta &&
                ['numWords', 'numChars', 'numSentences'].includes(q.target)))
        );

        const content: string = needContent
          ? await this.vault.adapter.read(file.path)
          : null;

        // Get xValue and add it into xValueMap for later use
        const xValueMap: XValueMap = new Map(); // queryId: xValue for this file
        let skipThisFile = false;
        for (const xDatasetId of renderInfo.xDataset) {
          if (!xValueMap.has(xDatasetId)) {
            let xDate = window.moment('');
            if (xDatasetId === -1) {
              // Default using date in filename as xValue
              xDate = DataCollector.getDateFromFilename(file, renderInfo);
            } else {
              const xDatasetQuery = renderInfo.queries[xDatasetId];
              const args = [xDatasetQuery, renderInfo] as const;
              switch (xDatasetQuery.type) {
                case SearchType.Frontmatter:
                  xDate = DataCollector.getDateFromFrontmatter(
                    fileCache,
                    ...args
                  );
                  break;
                case SearchType.Tag:
                  xDate = DataCollector.getDateFromTag(content, ...args);
                  break;
                case SearchType.Text:
                  xDate = DataCollector.getDateFromText(content, ...args);
                  break;
                case SearchType.DvField:
                  xDate = DataCollector.getDateFromDvField(content, ...args);
                  break;
                case SearchType.FileMeta:
                  xDate = DataCollector.getDateFromFileMeta(file, ...args);
                  break;
                case SearchType.Task:
                case SearchType.TaskDone:
                case SearchType.TaskNotDone:
                  xDate = DataCollector.getDateFromTask(content, ...args);
                  break;
              }
            }

            if (!xDate.isValid()) {
              skipThisFile = true;
              processInfo.fileNotInFormat++;
            } else if (
              (renderInfo.startDate !== null && xDate < renderInfo.startDate) ||
              (renderInfo.endDate !== null && xDate > renderInfo.endDate)
            ) {
              skipThisFile = true;
              processInfo.fileOutOfDateRange++;
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
                if (xDate < processInfo.minDate)
                  processInfo.minDate = xDate.clone();
                if (xDate > processInfo.maxDate)
                  processInfo.maxDate = xDate.clone();
              }
            }
          }
        }
        if (skipThisFile) return;

        // Loop over queries
        const yQueries = renderInfo.queries.filter(
          (q) => q.type !== SearchType.Table && !q.usedAsXDataset
        );

        // TODO Why is this callback async?
        const queryPromises = yQueries.map(async (query) => {
          // Get xValue from file if xDataset assigned
          const args = [query, renderInfo, dataMap, xValueMap] as const;

          if (fileCache && query.type === SearchType.Tag) {
            // Add frontmatter tags, allow simple tag only
            processInfo.gotAnyValidYValue ||=
              DataCollector.collectDataFromFrontmatterTag(fileCache, ...args);
          } // Search frontmatter tags

          if (
            fileCache &&
            query.type === SearchType.Frontmatter &&
            query.target !== 'tags'
          ) {
            processInfo.gotAnyValidYValue ||=
              DataCollector.collectDataFromFrontmatterKey(fileCache, ...args);
          }

          if (
            fileCache &&
            (query.type === SearchType.Wiki ||
              SearchType.WikiLink ||
              SearchType.WikiDisplay)
          ) {
            processInfo.gotAnyValidYValue ||= DataCollector.collectDataFromWiki(
              fileCache,
              ...args
            );
          }

          if (content && query.type === SearchType.Tag) {
            processInfo.gotAnyValidYValue ||=
              DataCollector.collectDataFromInlineTag(content, ...args);
          } // Search inline tags

          if (content && query.type === SearchType.Text) {
            processInfo.gotAnyValidYValue ||= DataCollector.collectDataFromText(
              content,
              ...args
            );
          } // Search text

          if (query.type === SearchType.FileMeta) {
            processInfo.gotAnyValidYValue ||=
              DataCollector.collectDataFromFileMeta(file, content, ...args);
          } // Search FileMeta

          if (content && query.type === SearchType.DvField) {
            processInfo.gotAnyValidYValue ||=
              DataCollector.collectDataFromDvField(content, ...args);
          } // search dvField

          if (
            content &&
            (query.type === SearchType.Task ||
              query.type === SearchType.TaskDone ||
              query.type === SearchType.TaskNotDone)
          ) {
            processInfo.gotAnyValidYValue ||= DataCollector.collectDataFromTask(
              content,
              ...args
            );
          } // search Task
        });
        await Promise.all(queryPromises);
      });
      await Promise.all(filePromises);

      // Collect data from a file, one file contains full dataset
      await DataCollector.collectDataFromTable(
        this.vault,
        dataMap,
        renderInfo,
        processInfo
      );

      // Check date range
      // minDate and maxDate are collected without knowing startDate and endDate
      if (
        !processInfo.minDate.isValid() ||
        !processInfo.maxDate.isValid() ||
        processInfo.fileAvailable === 0 ||
        !processInfo.gotAnyValidXValue
      ) {
        const errorMessage = `No valid date as X value found in notes`;
        if (processInfo.fileOutOfDateRange > 0)
          throw new TrackerError(
            `${errorMessage}\n${processInfo.fileOutOfDateRange} files are out of the date range.`
          );

        if (processInfo.fileNotInFormat)
          throw new TrackerError(
            `${errorMessage}\n${processInfo.fileNotInFormat} files are not in the right format.`
          );
      }
      if (renderInfo.startDate === null && renderInfo.endDate === null) {
        // No date arguments
        renderInfo.startDate = processInfo.minDate.clone();
        renderInfo.endDate = processInfo.maxDate.clone();
      } else if (renderInfo.startDate !== null && renderInfo.endDate === null) {
        if (renderInfo.startDate < processInfo.maxDate)
          renderInfo.endDate = processInfo.maxDate.clone();
        else throw new InvalidDateRangeError();
      } else if (renderInfo.endDate !== null && renderInfo.startDate === null) {
        if (renderInfo.endDate <= processInfo.minDate)
          throw new InvalidDateRangeError();
        renderInfo.startDate = processInfo.minDate.clone();
      } else if (
        (renderInfo.startDate < processInfo.minDate &&
          renderInfo.endDate < processInfo.minDate) ||
        (renderInfo.startDate > processInfo.maxDate &&
          renderInfo.endDate > processInfo.maxDate)
      )
        throw new InvalidDateRangeError();

      if (!processInfo.gotAnyValidYValue)
        throw new TrackerError('No valid Y value found in notes');

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
              for (
                let indPair = 0;
                indPair < queryValuePairs.length;
                indPair++
              ) {
                const collected = queryValuePairs[indPair].value;
                if (Number.isNumber(collected) && !Number.isNaN(collected)) {
                  if (value === null) value = collected;
                  else value += collected;
                }
              }
              if (value !== null) dataset.setValue(curDate, value);
            }
          }
        }
      }
      renderInfo.datasets = datasets;

      Renderer.render(container, renderInfo);

      element.appendChild(container);
    } catch (e) {
      this.renderErrorMessage(e, container, element);
    }
  }

  addCodeBlock(type: ComponentType): void {
    const view = this.workspace.getActiveViewOfType(MarkdownView);
    if (!(view instanceof MarkdownView)) return;

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

    this.insertOnNextLine(codeblockToInsert);
  }

  insertOnNextLine(text: string): void {
    if (text === '' || undefined) return;
    const { editor } = this;
    if (editor) {
      const cursor = editor.getCursor();
      const line = editor.getLine(cursor.line);

      cursor.ch = line.length;
      editor.setSelection(cursor);
      editor.replaceSelection('\n' + text);
    }
  }
}
