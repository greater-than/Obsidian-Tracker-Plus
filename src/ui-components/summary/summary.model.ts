import { ComponentType } from '../../models/enums';
import { IComponent } from '../../models/types';

export class Summary implements IComponent {
  template: string;
  style: string;
  renderAs?: 'text' | 'markdownTable' | 'htmlTable';
  pivot: boolean;

  constructor() {
    this.template = '';
    this.style = '';
    this.renderAs = 'text';
    this.pivot = false;
  }

  get componentType() {
    return ComponentType.Summary;
  }
}
