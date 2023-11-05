import { Dataset } from '../models/dataset';
import Moment = moment.Moment;

export type TDivisor = number | Dataset | Moment;

export const isDivisorValid = <T extends TDivisor>(obj: T): boolean => {
  return (typeof obj === 'number' && obj === 0) ||
    (obj instanceof Dataset && obj.values.some((v) => v === 0))
    ? false
    : true;
};
