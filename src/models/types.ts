import { ComponentType, SearchType, ValueType } from './enums';

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
  getAccessor: (index: number) => number;
  setSeparator: (sep: string) => void;
  getSeparator: (isForFrontmatterTags: boolean) => string;
  incrementTargets: (num: number) => void;
}

export interface IQueryValuePair {
  query: IQuery;
  value: number;
}
export interface IComponent {
  componentType: ComponentType;
}

export interface ILegend {
  showLegend: boolean;
  legendPosition: string;
  legendOrientation: string;
  legendBgColor: string;
  legendBorderColor: string;
}

// TODO Can explicit properties be added here or to derived classes? ex: PieChartElements
export type ChartElements = {
  //svg: Selection<GElement, OldDatum, null, undefined>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type XValueMap = Map<number, string>;

export type DataMap = Map<string, Array<IQueryValuePair>>;
