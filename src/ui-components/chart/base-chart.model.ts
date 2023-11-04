import { ComponentType } from '../../models/enums';
import { IComponent, ILegend } from '../../models/types';

export abstract class BaseChart implements IComponent, ILegend {
  title: string;

  // ILegend
  showLegend: boolean;
  legendPosition: string;
  legendOrientation: string;
  legendBgColor: string;
  legendBorderColor: string;

  constructor() {
    this.title = '';
    this.showLegend = false;
    this.legendPosition = ''; // top, bottom, left, right
    this.legendOrientation = ''; // horizontal, vertical
    this.legendBgColor = '';
    this.legendBorderColor = '';
  }

  abstract componentType(): ComponentType;
}
