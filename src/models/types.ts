import { ComponentType, SearchType, ValueType } from './enums';
import { Query } from './query';

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
  getSeparator: (forFrontmatterTags: boolean) => string;
  incrementTargetCount: (num: number) => void;
}

export interface IQueryValuePair {
  query: Query;
  value: number;
}

export interface IComponent {
  componentType(): ComponentType;
}

export interface ILegend {
  showLegend: boolean;
  legendPosition: string;
  legendOrientation: string;
  legendBgColor: string;
  legendBorderColor: string;
}

// TODO Can explicit properties be added here or in derived classes? ex: PieChartElements
export type ComponentElements = {
  // svg: Selection<BaseType, object, null, undefined>;
  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // dataArea: any;
  // // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // graphArea: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type TTextValueMap = { [key: string]: number };
export type TNumberValueMap = Map<number, string>;
export type TDataMap = Map<string, Array<IQueryValuePair>>;
export interface IDataMap extends TDataMap {
  add: (date: string, value: IQueryValuePair) => TDataMap;
}
