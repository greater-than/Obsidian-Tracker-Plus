import { ComponentType } from './enums';
import { IComponent, ILegend } from './types';

export class BaseChart implements IComponent, ILegend {
  title: string;
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

  // ILegend
  showLegend: boolean;
  legendPosition: string;
  legendOrientation: string;
  legendBgColor: string;
  legendBorderColor: string;

  constructor() {
    this.title = '';
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

    // ILegend
    this.showLegend = false;
    this.legendPosition = ''; // top, bottom, left, right
    this.legendOrientation = ''; // horizontal, vertical
    this.legendBgColor = '';
    this.legendBorderColor = '';
  }

  public get componentType() {
    return ComponentType.Unknown;
  }
}
