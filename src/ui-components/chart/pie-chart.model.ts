import { ComponentType } from '../../models/enums';
import { IComponent, ILegend } from '../../models/types';

export class PieChart implements IComponent, ILegend {
  title: string;
  data: string[];
  dataColor: string[];
  dataName: string[];
  label: string[];
  hideLabelLessThan: number;
  showExtLabelOnlyIfNoLabel: boolean;
  extLabel: string[];

  ratioInnerRadius: number;

  // ILegend
  showLegend: boolean;
  legendPosition: string;
  legendOrientation: string;
  legendBgColor: string;
  legendBorderColor: string;

  constructor() {
    this.title = '';
    this.data = [];
    this.dataColor = [];
    this.dataName = [];
    this.label = [];
    this.hideLabelLessThan = 0.03;
    this.extLabel = [];
    this.showExtLabelOnlyIfNoLabel = false;
    this.ratioInnerRadius = 0;

    // ILegend
    this.showLegend = false;
    this.legendPosition = ''; // top, bottom, left, right
    this.legendOrientation = ''; // horizontal, vertical
    this.legendBgColor = '';
    this.legendBorderColor = '';
  }

  public componentType() {
    return ComponentType.Pie;
  }
}
