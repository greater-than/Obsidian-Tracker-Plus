import { Query } from './query';

export class TableData {
  filePath: string;
  tableIndex: number;
  xDataset: Query | null;
  yDatasets: Array<Query>;

  constructor(filePath: string, tableIndex: number) {
    this.filePath = filePath;
    this.tableIndex = tableIndex;
    this.xDataset = null;
    this.yDatasets = []; // array of query
  }
}
