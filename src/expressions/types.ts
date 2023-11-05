import { Dataset } from '../models/dataset';
import { RenderInfo } from '../models/render-info';
import Moment = moment.Moment;

// Function accept datasetId as first argument
type TDatasetToValue = (
  dataset: Dataset,
  renderInfo: RenderInfo
) => number | Moment | string;

type TDatasetToDataset = (
  dataset: Dataset,
  args: Array<number | Dataset>,
  renderInfo: RenderInfo
) => Dataset | string;

type TUnaryOperation = (
  u: number | Moment | Dataset
) => number | Moment | Dataset | string;

type TBinaryOperation = (
  l: number | Moment | Dataset,
  r: number | Moment | Dataset
) => number | Moment | Dataset | string;

export interface IDatasetToValue {
  [key: string]: TDatasetToValue;
}

export interface IDatasetToDataset {
  [key: string]: TDatasetToDataset;
}

export interface IBinaryOperation {
  [key: string]: TBinaryOperation;
}

export interface IUnaryOperation {
  [key: string]: TUnaryOperation;
}

export interface IExprResolved {
  source: string;
  value: number | Moment;
  format: string;
}
