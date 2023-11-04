import { IComponent } from '../../models/types';

import { ComponentType } from '../../models/enums';

export class Summary implements IComponent {
  template: string;
  style: string;

  constructor() {
    this.template = '';
    this.style = '';
  }

  public componentType() {
    return ComponentType.Summary;
  }
}
