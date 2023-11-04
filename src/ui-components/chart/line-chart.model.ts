import { ComponentType } from '../../models/enums';
import { CartesianChart } from './cartesian-chart.model';

export class LineChart extends CartesianChart {
  lineColor: string[];
  lineWidth: number[];
  showLine: boolean[];
  showPoint: boolean[];
  pointColor: string[];
  pointBorderColor: string[];
  pointBorderWidth: number[];
  pointSize: number[];
  fillGap: boolean[];
  yAxisLocation: string[];

  constructor() {
    super();
    this.lineColor = []; // ""
    this.lineWidth = []; // 1.5
    this.showLine = []; // true
    this.showPoint = []; // true
    this.pointColor = []; // #69b3a2
    this.pointBorderColor = [];
    this.pointBorderWidth = []; // 0.0
    this.pointSize = []; // 3.0
    this.fillGap = []; // false
    this.yAxisLocation = []; // left, for each target
  }

  public componentType() {
    return ComponentType.Line;
  }
}
