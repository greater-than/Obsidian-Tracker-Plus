import { GraphType, SearchType, ValueType } from './enums';

export type TextValueMap = {
  [key: string]: number;
};

export interface IQuery {
  id: number;
  type: SearchType;
  target: string;
  parentTarget: string | null;
  separator: string; // multiple value separator
  accessors: number[];
  valueType: ValueType;
  usedAsXDataset: boolean;

  equalTo: (other: IQuery) => boolean;
  getType: () => SearchType;
  getTarget: () => string;
  getParentTarget: () => string;
  getId: () => number;
  getAccessor: (index: number) => number;
  setSeparator: (sep: string) => void;
  getSeparator: (isForFrontmatterTags: boolean) => string;
  addNumTargets: (num: number) => void;
  getNumTargets: () => number;
}

export interface QueryValuePair {
  query: IQuery;
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
