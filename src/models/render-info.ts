import Moment = moment.Moment;
import { BarChart } from '../ui-components/chart/bar-chart.model';
import { LineChart } from '../ui-components/chart/line-chart.model';
import { PieChart } from '../ui-components/chart/pie-chart.model';
import { BulletGraph } from '../ui-components/graph/bullet-graph.model';
import { HeatMap } from '../ui-components/heat-map/heat-map.model';
import { Month } from '../ui-components/month/month.model';
import { Summary } from '../ui-components/summary/summary.model';
import { AspectRatio } from './aspect-ratio';
import { CustomDatasetInfo } from './custom-dataset';
import { DatasetCollection } from './dataset';
import { Margin } from './margin';
import { Query } from './query';
import { Size } from './size';
import { TTextValueMap } from './types';

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
  textValueMap: TTextValueMap;

  dataAreaSize: Size;
  margin: Margin;

  fixedScale: number;
  fitPanelWidth: boolean;
  aspectRatio: AspectRatio;

  // # Output
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output: any[]; // TODO Can this be an array of allowed output components?
  line: LineChart[];
  bar: BarChart[];
  pie: PieChart[];
  bullet: BulletGraph[];
  month: Month[];
  heatmap: HeatMap[];
  summary: Summary[];
  customDataset: CustomDatasetInfo[];

  public datasets: DatasetCollection | null;

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
    this.line = [];
    this.bar = [];
    this.pie = [];
    this.summary = [];
    this.month = [];
    this.heatmap = [];
    this.bullet = [];
    this.customDataset = [];

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
