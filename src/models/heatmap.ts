import { ComponentType } from './enums';
import { IComponent } from './types';

export class Heatmap implements IComponent {
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

  public get componentType() {
    return ComponentType.Heatmap;
  }
}
