export class Transform {
  translateX: number;
  translateY: number;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(transform: any) {
    this.translateX = 0;
    this.translateY = 0;

    if (typeof transform === 'string') {
      const groups = transform.match(
        /translate\(\s*(?<x>[\d\.\/-]+)\s*,\s*(?<y>[\d\.\/-]+)\s*\)/
      ).groups;
      if (groups) {
        this.translateX = parseFloat(groups.x);
        this.translateY = parseFloat(groups.y);
      }
    }
  }
}
