import { ComponentType } from '../../models/enums';
import { CartesianChart } from './cartesian-chart.model';

export class BarChart extends CartesianChart {
  barColor: string[];
  yAxisLocation: string[];

  constructor() {
    super();
    this.barColor = []; // #69b3a2
    this.yAxisLocation = []; // left, for each target
  }

  public componentType() {
    return ComponentType.Bar;
  }
}
