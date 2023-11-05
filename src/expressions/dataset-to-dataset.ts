import { Dataset } from '../models/dataset';
import { IDatasetToDataset } from './types';

export const DatasetToDataset: IDatasetToDataset = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  normalize: (dataset, _args, _renderInfo): Dataset | string => {
    // console.log("normalize");
    // console.log(dataset);
    const yMin = dataset.yMin;
    const yMax = dataset.yMax;
    // console.log(`yMin/yMax: ${yMin}/${yMax}`);
    if (yMin !== null && yMax !== null && yMax > yMin) {
      const normalized = dataset.clone();
      normalized.values.forEach((value, index, array) => {
        array[index] = (value - yMin) / (yMax - yMin);
      });
      normalized.recalculateYMinMax();
      return normalized;
    }
    return "Error: invalid data range for function 'normalize'";
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setMissingValues: (dataset, args, _renderInfo): Dataset | string => {
    // console.log("setMissingValues");
    // console.log(dataset);
    // console.log(args);
    if (args && args.length > 0) {
      const missingValue = args[0];
      // console.log(missingValue);
      const newDataset = dataset.clone();
      if (Number.isNumber(missingValue) && !Number.isNaN(missingValue)) {
        newDataset.values.forEach((value, index, array) => {
          if (value === null) {
            array[index] = missingValue as number;
          }
        });
        newDataset.recalculateYMinMax();
        return newDataset;
      }
      return "Error: invalid arguments for function 'setMissingValues'";
    }
    return "Error: invalid arguments for function 'setMissingValues";
  },
};
