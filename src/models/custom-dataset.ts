export class CustomDatasetInfo {
  id: number;
  name: string;
  xData: string[];
  yData: string[];

  constructor() {
    this.id = -1;
    this.name = '';
    this.xData = [];
    this.yData = [];
  }
}
