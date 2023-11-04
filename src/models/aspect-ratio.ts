import { Size } from './size';

export class AspectRatio {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public recalculateSize(size: Size): Size {
    const aspectRatio = this.x / this.y;
    const width = parseFloat((size.width * aspectRatio).toFixed(2));
    return new Size(width, size.height);
  }
}
