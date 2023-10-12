import { ComponentType } from '../../models/enums';
import { Chart } from '../chart/chart.model';

export class PieChart extends Chart {
  constructor() {
    super();
    this.data = [];
    this.dataColor = [];
    this.dataName = [];
    this.label = [];
    this.hideLabelLessThan = 0.03;
    this.extLabel = [];
    this.showExtLabelOnlyIfNoLabel = false;
    this.ratioInnerRadius = 0;
  }

  data: string[];
  dataColor: string[];
  dataName: string[];
  label: string[];
  hideLabelLessThan: number;
  showExtLabelOnlyIfNoLabel: boolean;
  extLabel: string[];
  ratioInnerRadius: number;

  get componentType() {
    return ComponentType.PieChart;
  }
}
