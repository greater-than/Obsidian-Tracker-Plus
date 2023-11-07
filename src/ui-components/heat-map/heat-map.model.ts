import { ComponentType } from '../../models/enums';
import { IComponent } from '../../models/types';

export class HeatMap implements IComponent {
  dataset: string;
  startWeekOn: string;
  orientation: string;
  yMin: number;
  yMax: number;
  color: string;

  constructor() {
    this.dataset = '0';
    this.startWeekOn = 'Sun';
    this.orientation = 'vertical';
    this.yMin = null;
    this.yMax = null;
    this.color = null;
  }

  public componentType() {
    return ComponentType.Heatmap;
  }
}
