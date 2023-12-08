import { ComponentType } from '../../models/enums';
import { ILegend } from '../../models/types';
import { ComponentBase } from '../component-base.model';

export abstract class ChartBase extends ComponentBase implements ILegend {
  // ILegend
  showLegend: boolean;
  legendPosition: string;
  legendOrientation: string;
  legendBgColor: string;
  legendBorderColor: string;

  constructor() {
    super();
    this.showLegend = false;
    this.legendPosition = ''; // top, bottom, left, right
    this.legendOrientation = ''; // horizontal, vertical
    this.legendBgColor = '';
    this.legendBorderColor = '';
  }

  abstract componentType: ComponentType;
}
