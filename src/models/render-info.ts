import { Moment } from 'moment';
import { AspectRatio } from './aspect-ratio';
import { BarChart } from './bar-chart';
import { BulletGraph } from './bullet-graph';
import { CustomDataset } from './custom-dataset';
import { Datasets } from './dataset';
import { Heatmap } from './heatmap';
import { LineChart } from './line-chart';
import { Margin } from './margin';
import { MonthInfo } from './month';
import { PieChart } from './pie-chart';
import { Query } from './query';
import { Size } from './size';
import { Summary } from './summary';
import { TextValueMap } from './types';

export class RenderInfo {
  // Input
  queries: Query[];
  xDataset: number[];
  folder: string;
  file: string[];
  specifiedFilesOnly: boolean;
  fileContainsLinkedFiles: string[];
  fileMultiplierAfterLink: string;
  dateFormat: string;
  dateFormatPrefix: string;
  dateFormatSuffix: string;
  startDate: Moment | null;
  endDate: Moment | null;
  datasetName: string[];
  constValue: number[];
  ignoreAttachedValue: boolean[];
  ignoreZeroValue: boolean[];
  accum: boolean[];
  penalty: number[];
  valueShift: number[];
  shiftOnlyValueLargerThan: number[];
  valueType: string[]; // number/float, int, string, boolean, date, time, datetime
  textValueMap: TextValueMap;

  dataAreaSize: Size;
  margin: Margin;

  fixedScale: number;
  fitPanelWidth: boolean;
  aspectRatio: AspectRatio;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output: any[];
  lineCharts: LineChart[];
  barCharts: BarChart[];
  pieCharts: PieChart[];
  summaries: Summary[];
  month: MonthInfo[];
  heatmaps: Heatmap[];
  bulletGraphs: BulletGraph[];
  customDatasets: CustomDataset[];

  public datasets: Datasets | null;

  constructor(queries: Query[]) {
    this.queries = queries;
    this.xDataset = []; // use file name
    this.folder = '/';
    this.file = []; // extra files to use
    this.specifiedFilesOnly = false; // if true, use files specified only
    this.fileContainsLinkedFiles = [];
    this.fileMultiplierAfterLink = ''; // regex pattern to extract multiplier after link
    this.dateFormat = 'YYYY-MM-DD';
    this.dateFormatPrefix = '';
    this.dateFormatSuffix = '';
    this.startDate = null;
    this.endDate = null;
    this.datasetName = []; // untitled
    this.constValue = [1];
    this.ignoreAttachedValue = []; // false
    this.ignoreZeroValue = []; // false
    this.accum = []; // false, accum values start from zero over days
    this.penalty = []; // null, use this value instead of null value
    this.valueShift = [];
    this.shiftOnlyValueLargerThan = [];
    this.valueType = [];
    this.textValueMap = {};

    this.dataAreaSize = new Size(300, 300);
    this.aspectRatio = new AspectRatio(1, 1);
    this.margin = new Margin(10, 10, 10, 10); // top, right, bottom, left

    this.fixedScale = 1;
    this.fitPanelWidth = false;

    this.output = [];
    this.lineCharts = [];
    this.barCharts = [];
    this.pieCharts = [];
    this.summaries = [];
    this.month = [];
    this.heatmaps = [];
    this.bulletGraphs = [];
    this.customDatasets = [];

    this.datasets = null;
  }

  public getQueryById(id: number) {
    for (const query of this.queries) {
      if (query.id === id) {
        return query;
      }
    }
  }
}
