import { Query } from './data';
import { GraphType, QueryValuePair } from './types';

export enum SearchType {
  Tag,
  Frontmatter,
  Wiki,
  WikiLink,
  WikiDisplay,
  Text,
  dvField,
  Table,
  FileMeta,
  Task,
  TaskDone,
  TaskNotDone,
}

export enum GraphType {
  Line,
  Bar,
  Pie,
  Radar,
  Summary,
  Table,
  Month,
  Heatmap,
  Bullet,
  Unknown,
}

export enum ValueType {
  Number,
  Int,
  Date,
  Time,
  DateTime,
  String,
}

export type TextValueMap = {
  [key: string]: number;
};
export interface QueryValuePair {
  query: Query;
  value: number;
}
export interface IGraph {
  GetGraphType(): GraphType;
}

export interface ILegend {
  showLegend: boolean;
  legendPosition: string;
  legendOrientation: string;
  legendBgColor: string;
  legendBorderColor: string;
}
export type ChartElements = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};
export type XValueMap = Map<number, string>;
export type DataMap = Map<string, Array<QueryValuePair>>;
