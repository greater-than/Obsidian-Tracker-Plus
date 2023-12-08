import { ComponentType } from '../models/enums';
import { IComponent } from '../models/types';

export abstract class ComponentBase implements IComponent {
  title: string;

  constructor() {
    this.title = '';
  }

  abstract componentType: ComponentType;
}
