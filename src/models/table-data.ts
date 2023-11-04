import { Query } from './query';

export class TableData {
  filePath: string;
  tableIndex: number;
  xQuery: Query | null;
  yQueries: Array<Query>;

  constructor(filePath: string, tableIndex: number) {
    this.filePath = filePath;
    this.tableIndex = tableIndex;
    this.xQuery = null;
    this.yQueries = []; // array of query
  }
}
