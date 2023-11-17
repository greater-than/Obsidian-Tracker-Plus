import { TransformerPattern } from '../regex-patterns';

export class Transformer {
  x: number;
  y: number;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(transform: any) {
    this.x = 0;
    this.y = 0;
    if (typeof transform === 'string') {
      const groups = transform.match(TransformerPattern).groups;
      if (groups) {
        this.x = parseFloat(groups.x);
        this.y = parseFloat(groups.y);
      }
    }
  }
}
