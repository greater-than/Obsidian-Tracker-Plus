import { Moment } from 'moment';
import { Dataset } from '../models/dataset';
import { RenderInfo } from '../models/render-info';

// Function accept datasetId as first argument
type FnDatasetToValue = (
  dataset: Dataset,
  renderInfo: RenderInfo
) => number | Moment | string;

type FnDatasetToDataset = (
  dataset: Dataset,
  args: Array<number | Dataset>,
  renderInfo: RenderInfo
) => Dataset | string;

type FnUnaryOp = (
  u: number | Moment | Dataset
) => number | Moment | Dataset | string;

type FnBinaryOp = (
  l: number | Moment | Dataset,
  r: number | Moment | Dataset
) => number | Moment | Dataset | string;

export interface IDatasetToValueMap {
  [key: string]: FnDatasetToValue;
}

export interface IDatasetToDatasetMap {
  [key: string]: FnDatasetToDataset;
}

export interface IBinaryOperationMap {
  [key: string]: FnBinaryOp;
}

export interface IMapUnaryOperationMap {
  [key: string]: FnUnaryOp;
}

export interface IExprResolved {
  source: string;
  value: number | Moment;
  format: string;
}
