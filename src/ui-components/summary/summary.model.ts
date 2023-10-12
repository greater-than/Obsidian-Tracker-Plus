import { ComponentType } from '../../models/enums';
import { IComponent } from '../../models/types';

export class Summary implements IComponent {
  template: string;
  style: string;

  constructor() {
    this.template = '';
    this.style = '';
  }

  public get componentType() {
    return ComponentType.Summary;
  }
}
