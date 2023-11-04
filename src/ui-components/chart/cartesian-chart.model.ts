import { ComponentType } from '../../models/enums';
import { BaseChart } from './base-chart.model';

export abstract class CartesianChart extends BaseChart {
  xAxisLabel: string;
  xAxisColor: string;
  xAxisLabelColor: string;
  xAxisTickInterval: string;
  xAxisTickLabelFormat: string;

  yAxisLabel: string[];
  yAxisColor: string[];
  yAxisLabelColor: string[];
  yAxisUnit: string[];
  yAxisTickInterval: string[];
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
    this.xAxisTickInterval = null; // the string will be converted to Duration (a month is not necessary to 30 days)
    this.xAxisTickLabelFormat = null;

    this.yAxisLabel = []; // "Value", 2 elements
    this.yAxisColor = []; // "", 2 elements
    this.yAxisLabelColor = []; // "", 2 elements
    this.yAxisUnit = []; // "", 2 elements
    this.yAxisTickInterval = []; // null, 2 elements
    this.yAxisTickLabelFormat = []; // null, 2 elements
    this.yMin = []; // null, 2 elements
    this.yMax = []; // null, 2 elements

    this.reverseYAxis = []; // false, 2 elements
    this.allowInspectData = true;
  }

  abstract componentType(): ComponentType;
}
