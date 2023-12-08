import { Orientation } from '../../enums';
import { ComponentType } from '../../models/enums';
import { IComponent } from '../../models/types';
import { ComponentBase } from '../component-base.model';

export class BulletGraph extends ComponentBase implements IComponent {
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
    super();
    this.dataset = '0'; // dataset id or name
    this.orientation = Orientation.HORIZONTAL; // or vertical
    this.value = ''; // Can possess template variable
    this.valueUnit = '';
    this.valueColor = '#69b3a2';
    this.range = [];
    this.rangeColor = [];
    this.showMarker = false;
    this.markerValue = 0;
    this.markerColor = '';
  }

  get componentType() {
    return ComponentType.BulletGraph;
  }
}
