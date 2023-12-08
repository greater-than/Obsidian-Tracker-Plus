import {
  App,
  Editor,
  MarkdownPostProcessorContext,
  MarkdownView,
  MetadataCache,
  Plugin,
  TFile,
  Vault,
  Workspace,
} from 'obsidian';
import * as Collector from './data/collector';
import { TrackerError } from './errors';
import { DataMap } from './models/data-map';
import { DatasetCollection } from './models/dataset';
import { ComponentType, SearchType } from './models/enums';
import { ProcessInfo } from './models/process-info';
import { Query } from './models/query';
import { RenderInfo } from './models/render-info';
import { IQueryValuePair, TNumberValueMap } from './models/types';
import { getRenderInfo } from './parser/yaml-parser';
import * as Renderer from './renderer';
import {
  DEFAULT_SETTINGS,
  TrackerSettingTab,
  TrackerSettings,
} from './settings';
import { DateTimeUtils, IoUtils } from './utils';
import { dateToString } from './utils/date-time.utils';
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
  // #region Properties

  settings: TrackerSettings;
  workspace: Workspace = this.app.workspace;
  vault: Vault = this.app.vault;
  metadataCache: MetadataCache = this.app.metadataCache;

  get view() {
    return this.app.workspace.getActiveViewOfType(MarkdownView);
  }

  get editor(): Editor {
    return this.view.editor;
  }

  // #endregion
  // #region Methods

  onload = async (): Promise<void> => {
    console.log('loading Tracker+ plugin');
    await this.loadSettings();
    this.addSettingTab(new TrackerSettingTab(this.app, this));
    this.registerMarkdownCodeBlockProcessor(
      'tracker',
      this.processCodeBlock.bind(this)
    );
    this.addCommands();
  };

  onunload = (): void => console.log('unloading Tracker+ plugin');

  addCommands = () => {
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
  };

  loadSettings = async (): Promise<void> => {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  };

  saveSettings = async (): Promise<void> => await this.saveData(this.settings);

  /**
   * Returns true if the searchType is Frontmatter, Wiki, WikiLink, or WikiDisplay
   * @param renderInfo
   * @returns
   */
  needMetadata = (renderInfo: RenderInfo) =>
    renderInfo.queries.some(
      (q) =>
        q.type === SearchType.Frontmatter ||
        q.type === SearchType.Tag ||
        q.type === SearchType.Wiki ||
        q.type === SearchType.WikiLink ||
        q.type === SearchType.WikiDisplay
    );

  /**
   * @summary Returns true if the queries needs data from the content of notes
   * @param {Query[]} queries
   * @returns {boolean}
   */
  needContent = (queries: Query[]): boolean =>
    queries.some((q) => {
      return (
        q.type === SearchType.Tag ||
        q.type === SearchType.Text ||
        q.type === SearchType.DataviewField ||
        q.type === SearchType.Task ||
        q.type === SearchType.TaskAll ||
        q.type === SearchType.TaskDone ||
        q.type === SearchType.TaskNotDone ||
        (q.type === SearchType.FileMeta &&
          ['numWords', 'numChars', 'numSentences'].includes(q.target))
      );
    });

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
   * @summary Processes a tracker code block
   * @param {string} source
   * @param {HTMLElement} element
   * @param {MarkdownPostProcessorContext} _context
   */
  processCodeBlock = async (
    source: string,
    element: HTMLElement,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _context: MarkdownPostProcessorContext
  ): Promise<void> => {
    const container = document.createElement('div');
    try {
      let yaml = source.trim();

      // Replace tabs with spaces
      const tabSize = this.app.vault.getConfig('tabSize');
      const spaces = Array(tabSize).fill(' ').join('');
      yaml = yaml.replace(/\t/gm, spaces);

      // Get render info
      const renderInfo = getRenderInfo(yaml, this);

      // Get files
      const files: TFile[] = await IoUtils.getFiles(
        renderInfo,
        this.vault,
        this.metadataCache
      );

      // let dailyNotesSettings = getDailyNoteSettings();
      // I always got YYYY-MM-DD from dailyNotesSettings.format
      // Use own settings panel for now

      // Collect data for dataMap
      const dataMap = new DataMap(); // {strDate: [query: value, ...]}

      const processInfo = new ProcessInfo();
      processInfo.fileTotal = files.length;

      // Collect data from files, each file has one data point for each query
      await Promise.all(
        files.map(async (file) => {
          // file cache
          const metadata = this.needMetadata(renderInfo)
            ? this.metadataCache.getFileCache(file)
            : null;

          // content
          const content: string = this.needContent(renderInfo.queries)
            ? await this.vault.adapter.read(file.path)
            : null;

          // Get xValue and add it into xValueMap for later use
          const xValues: TNumberValueMap = new Map(); // queryId: xValue for this file
          let skipThisFile = false;
          for (const id of renderInfo.xDataset) {
            if (xValues.has(id)) continue;

            let xDate = window.moment('');
            if (id === -1) {
              // Default using date in filename as xValue
              xDate = Collector.getFilenameDate(file, renderInfo);
            } else {
              const xDatasetQuery = renderInfo.queries[id];
              switch (xDatasetQuery.type) {
                case SearchType.Frontmatter:
                  xDate = Collector.getFrontmatterDate(
                    metadata,
                    renderInfo,
                    xDatasetQuery
                  );
                  break;
                case SearchType.Tag:
                  xDate = Collector.getInlineTagDate(
                    content,
                    renderInfo,
                    xDatasetQuery
                  );
                  break;
                case SearchType.Text:
                  xDate = Collector.getTextDate(
                    content,
                    renderInfo,
                    xDatasetQuery
                  );
                  break;
                case SearchType.DataviewField:
                  xDate = Collector.getDataviewFieldDate(
                    content,
                    renderInfo,
                    xDatasetQuery
                  );
                  break;
                case SearchType.FileMeta:
                  xDate = Collector.getFileMetaDataDate(
                    file,
                    renderInfo,
                    xDatasetQuery
                  );
                  break;
                case SearchType.Task:
                case SearchType.TaskAll:
                case SearchType.TaskDone:
                case SearchType.TaskNotDone:
                  xDate = Collector.getTaskDate(
                    content,
                    renderInfo,
                    xDatasetQuery
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
              xValues.set(
                id,
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
          if (skipThisFile) return;

          // y-axis queries
          const yQueries = renderInfo.queries.filter(
            (q) => q.type !== SearchType.Table && !q.usedAsXDataset
          );

          await Promise.all(
            yQueries.map(async (query) => {
              // Get xValue from file if xDataset assigned
              // if (renderInfo.xDataset !== null)
              // let xDatasetId = renderInfo.xDataset;

              if (metadata && query.type === SearchType.Tag) {
                // Add frontmatter tags, allow simple tag only
                const dataAdded = Collector.addFrontmatterTagData(
                  metadata,
                  query,
                  renderInfo,
                  dataMap,
                  xValues
                );
                processInfo.gotAnyValidYValue ||= dataAdded;
              } // Search frontmatter tags

              if (
                metadata &&
                query.type === SearchType.Frontmatter &&
                query.target !== 'tags'
              ) {
                const dataAdded = Collector.addFrontmatterData(
                  metadata,
                  query,
                  renderInfo,
                  dataMap,
                  xValues
                );
                processInfo.gotAnyValidYValue ||= dataAdded;
              }

              if (
                metadata &&
                (query.type === SearchType.Wiki ||
                  query.type === SearchType.WikiLink ||
                  query.type === SearchType.WikiDisplay)
              ) {
                const dataAdded = Collector.addWikiData(
                  metadata,
                  query,
                  renderInfo,
                  dataMap,
                  xValues
                );
                processInfo.gotAnyValidYValue ||= dataAdded;
              }

              if (content && query.type === SearchType.Tag) {
                const dataAdded = Collector.addInlineTagData(
                  content,
                  query,
                  renderInfo,
                  dataMap,
                  xValues
                );
                processInfo.gotAnyValidYValue ||= dataAdded;
              } // Search inline tags

              if (content && query.type === SearchType.Text) {
                const dataAdded = Collector.addTextData(
                  content,
                  query,
                  renderInfo,
                  dataMap,
                  xValues
                );
                processInfo.gotAnyValidYValue ||= dataAdded;
              } // Search text

              if (query.type === SearchType.FileMeta) {
                const dataAdded = Collector.addFileMetaData(
                  file,
                  content,
                  query,
                  renderInfo,
                  dataMap,
                  xValues
                );
                processInfo.gotAnyValidYValue ||= dataAdded;
              } // Search FileMeta

              if (content && query.type === SearchType.DataviewField) {
                const dataAdded = Collector.addDataviewFieldData(
                  content,
                  query,
                  renderInfo,
                  dataMap,
                  xValues
                );
                processInfo.gotAnyValidYValue ||= dataAdded;
              } // search dvField

              if (
                content &&
                (query.type === SearchType.Task ||
                  query.type === SearchType.TaskAll ||
                  query.type === SearchType.TaskDone ||
                  query.type === SearchType.TaskNotDone)
              ) {
                const dataAdded = Collector.addTaskData(
                  content,
                  query,
                  renderInfo,
                  dataMap,
                  xValues
                );
                processInfo.gotAnyValidYValue ||= dataAdded;
              } // search Task
            })
          );
        })
      );

      // Collect table data from a note, one file contains full dataset
      await Collector.addTableData(
        this.app.vault,
        dataMap,
        renderInfo,
        processInfo
      );

      // Check date range
      // minDate and maxDate are collected without knowing startDate and endDate
      let message = '';
      if (
        !processInfo.minDate.isValid() ||
        !processInfo.maxDate.isValid() ||
        processInfo.fileAvailable === 0 ||
        !processInfo.gotAnyValidXValue
      ) {
        message = `No valid date as X value found in notes: `;
        if (processInfo.fileOutOfDateRange > 0)
          throw new TrackerError(
            `${message}${processInfo.fileOutOfDateRange} files are out of the date range.`
          );

        if (processInfo.fileNotInFormat)
          throw new TrackerError(
            `${message}${processInfo.fileNotInFormat} files are not in the right format.`
          );
      }
      if (renderInfo.startDate === null && renderInfo.endDate === null) {
        // No date arguments
        renderInfo.startDate = processInfo.minDate.clone();
        renderInfo.endDate = processInfo.maxDate.clone();
      } else if (renderInfo.startDate !== null && renderInfo.endDate === null) {
        if (renderInfo.startDate < processInfo.maxDate) {
          renderInfo.endDate = processInfo.maxDate.clone();
        } else {
          throw new TrackerError('Invalid date range');
        }
      } else if (renderInfo.endDate !== null && renderInfo.startDate === null) {
        if (renderInfo.endDate > processInfo.minDate) {
          renderInfo.startDate = processInfo.minDate.clone();
        } else {
          throw new TrackerError('Invalid date range');
        }
      } else {
        // startDate and endDate are valid
        if (
          (renderInfo.startDate < processInfo.minDate &&
            renderInfo.endDate < processInfo.minDate) ||
          (renderInfo.startDate > processInfo.maxDate &&
            renderInfo.endDate > processInfo.maxDate)
        ) {
          throw new TrackerError('Invalid date range');
        }
      }

      if (!processInfo.gotAnyValidYValue)
        throw new TrackerError('No valid Y value found in notes');

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
          let date = renderInfo.startDate.clone();
          date <= renderInfo.endDate;
          date.add(1, 'days')
        ) {
          if (dataMap.has(dateToString(date, renderInfo.dateFormat))) {
            const queryValues = dataMap
              .get(dateToString(date, renderInfo.dateFormat))
              .filter((qv: IQueryValuePair) => {
                return qv.query.equalTo(query);
              });

            // Merge values of the same day same query
            let value: number = null;
            queryValues.forEach((qv) => {
              if (Number.isNumber(qv.value) && !Number.isNaN(qv.value))
                value += qv.value;
            });
            if (value !== null) dataset.setValue(date, value);
          }
        }
      }
      renderInfo.datasets = datasets;
      Renderer.renderTracker(container, renderInfo);
      element.appendChild(container);
    } catch (e) {
      Renderer.renderError(container, e);
      element.appendChild(container);
    }
  };

  addCodeBlock = (outputType: ComponentType): void => {
    if (!(this.view instanceof MarkdownView)) return;

    let codeBlock = '';
    switch (outputType) {
      case ComponentType.LineChart:
        codeBlock = `\`\`\` tracker
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
        codeBlock = `\`\`\` tracker
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
        codeBlock = `\`\`\` tracker
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

    if (codeBlock !== '') this.insertOnNextLine(codeBlock);
  };

  insertOnNextLine(text: string): boolean {
    if (!this.editor) return false;

    const cursor = this.editor.getCursor();
    const lineNumber = cursor.line;
    const line = this.editor.getLine(lineNumber);

    cursor.ch = line.length;
    this.editor.setSelection(cursor);
    this.editor.replaceSelection('\n' + text);

    return true;
  }

  // #endregion
}
