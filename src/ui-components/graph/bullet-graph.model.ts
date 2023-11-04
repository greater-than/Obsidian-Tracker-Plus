import { ComponentType } from '../../models/enums';
import { IComponent } from '../../models/types';

export class BulletGraph implements IComponent {
  title: string;
  dataset: string;
  orientation: string;
  value: string;
  valueUnit: string;
  valueColor: string;
  range: number[];
  rangeColor: string[];
  showMarker: boolean;
  markerValue: number;
  markerColor: string;

  constructor() {
    this.title = '';
    this.dataset = '0'; // dataset id or name
    this.orientation = 'horizontal'; // or vertical
    this.value = ''; // Can possess template variable
    this.valueUnit = '';
    this.valueColor = '#69b3a2';
    this.range = [];
    this.rangeColor = [];
    this.showMarker = false;
    this.markerValue = 0;
    this.markerColor = '';
  }

  public componentType() {
    return ComponentType.Bullet;
  }
}
