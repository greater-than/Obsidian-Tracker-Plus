import { BaseChart } from './base-chart';
import { ComponentType } from './enums';

export class BarChart extends BaseChart {
  barColor: string[];
  yAxisLocation: string[];

  constructor() {
    super();
    this.barColor = []; // #69b3a2
    this.yAxisLocation = []; // left, for each target
  }

  public get componentType() {
    return ComponentType.BarChart;
  }
}
