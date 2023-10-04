import { ComponentType } from './enums';
import { IComponent } from './types';

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
