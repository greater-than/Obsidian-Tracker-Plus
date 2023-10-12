import { ComponentType } from '../../models/enums';
import { Chart } from './chart.model';

export abstract class CartesianChart extends Chart {
  xAxisLabel: string;
  xAxisColor: string;
  xAxisLabelColor: string;
  yAxisLabel: string[];
  yAxisColor: string[];
  yAxisLabelColor: string[];
  yAxisUnit: string[];
  xAxisTickInterval: string;
  yAxisTickInterval: string[];
  xAxisTickLabelFormat: string;
  yAxisTickLabelFormat: string[];
  yMin: number[];
  yMax: number[];
  reverseYAxis: boolean[];
  allowInspectData: boolean;

  constructor() {
    super();
    this.xAxisLabel = 'Date';
    this.xAxisColor = '';
    this.xAxisLabelColor = '';
    this.yAxisLabel = []; // "Value", 2 elements
    this.yAxisColor = []; // "", 2 elements
    this.yAxisLabelColor = []; // "", 2 elements
    this.yAxisUnit = []; // "", 2 elements
    this.xAxisTickInterval = null; // the string will be converted to Duration (a month is not necessary to 30 days)
    this.yAxisTickInterval = []; // null, 2 elements
    this.xAxisTickLabelFormat = null;
    this.yAxisTickLabelFormat = []; // null, 2 elements
    this.yMin = []; // null, 2 elements
    this.yMax = []; // null, 2 elements
    this.reverseYAxis = []; // false, 2 elements
    this.allowInspectData = true;
  }

  abstract get componentType(): ComponentType;
}
