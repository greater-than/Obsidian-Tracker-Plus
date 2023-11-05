import { DivisionByZeroError, OperationError } from '../errors';
import { Dataset } from '../models/dataset';
import { BinaryOperator } from './enums';
import { isDivisorValid } from './helper';
import { IBinaryOperation } from './types';

export const BinaryOperation: IBinaryOperation = {
  [BinaryOperator.ADD]: (l, r): number | Dataset => {
    if (typeof l === 'number' && typeof r === 'number') return l + r;

    let ds: Dataset = null;
    if (typeof l === 'number' && r instanceof Dataset) {
      ds = r.clone();
      ds.values.forEach(
        (val, i) => (ds.values[i] = val !== null ? l + val : null)
      );
    }
    if (l instanceof Dataset && typeof r === 'number') {
      ds = l.clone();
      ds.values.forEach(
        (val, i) => (ds.values[i] = val !== null ? val + r : null)
      );
    }
    if (l instanceof Dataset && r instanceof Dataset) {
      ds = l.clone();
      ds.values.forEach(
        (val, i) => (ds.values[i] = val !== null ? val + r.values[i] : null)
      );
    }
    if (!ds) throw new OperationError(BinaryOperator.ADD);
    ds.recalculateYMinMax();
    return ds;
  },

  [BinaryOperator.SUBTRACT]: (l, r): number | Dataset => {
    if (typeof l === 'number' && typeof r === 'number') return l - r;

    let ds: Dataset = null;
    if (typeof l === 'number' && r instanceof Dataset) {
      ds = r.clone();
      ds.values.forEach(
        (val, i) => (ds.values[i] = val !== null ? l - val : null)
      );
    } else if (l instanceof Dataset && typeof r === 'number') {
      ds = l.clone();
      ds.values.forEach((val, i) => (ds.values[i] !== null ? val - r : null));
    } else if (l instanceof Dataset && r instanceof Dataset) {
      ds = l.clone();
      ds.values.forEach(
        (val, i) => (ds.values[i] = val !== null ? val - r.values[i] : null)
      );
    }
    if (!ds) throw new OperationError(BinaryOperator.SUBTRACT);
    ds.recalculateYMinMax();
    return ds;
  },

  [BinaryOperator.MULTIPLY]: (l, r): number | Dataset => {
    if (typeof l === 'number' && typeof r === 'number') return l * r;

    let ds: Dataset = null;
    if (typeof l === 'number' && r instanceof Dataset) {
      ds = r.clone();
      ds.values.forEach(
        (val, i) => (ds.values[i] = val !== null ? l * val : null)
      );
    } else if (l instanceof Dataset && typeof r === 'number') {
      ds = l.clone();
      ds.values.forEach(
        (val, i) => (ds.values[i] = val !== null ? val * r : null)
      );
    } else if (l instanceof Dataset && r instanceof Dataset) {
      ds = l.clone();
      ds.values.forEach(
        (val, i) => (ds.values[i] = val !== null ? val * r.values[i] : null)
      );
    }
    if (!ds) throw new OperationError(BinaryOperator.MULTIPLY);
    ds.recalculateYMinMax();
    return ds;
  },

  [BinaryOperator.DIVIDE]: (l, r): number | Dataset => {
    if (!isDivisorValid(r)) throw new DivisionByZeroError();
    if (typeof l === 'number' && typeof r === 'number') return l / r;

    let ds: Dataset = null;
    if (typeof l === 'number' && r instanceof Dataset) {
      ds = r.clone();
      ds.values.forEach(
        (val, i) => (ds.values[i] = val !== null ? l / val : null)
      );
    } else if (l instanceof Dataset && typeof r === 'number') {
      ds = l.clone();
      ds.values.forEach((val, i) => {
        ds.values[i] = val !== null ? val / r : null;
      });
    } else if (l instanceof Dataset && r instanceof Dataset) {
      ds = l.clone();
      ds.values.forEach(
        (val, i) => (ds.values[i] = val !== null ? val / r.values[i] : null)
      );
    }
    if (!ds) throw new OperationError(BinaryOperator.DIVIDE);
    ds.recalculateYMinMax();
    return ds;
  },

  [BinaryOperator.MOD]: (l, r): number | Dataset => {
    if (!isDivisorValid(r)) throw new DivisionByZeroError();
    if (typeof l === 'number' && typeof r === 'number') return l % r;

    let ds: Dataset = null;
    if (typeof l === 'number' && r instanceof Dataset) {
      ds = r.clone();
      ds.values.forEach(
        (val, i) => (ds.values[i] = val !== null ? l % val : null)
      );
    } else if (l instanceof Dataset && typeof r === 'number') {
      ds = l.clone();
      ds.values.forEach(
        (val, i) => (ds.values[i] = val !== null ? val % r : null)
      );
    } else if (l instanceof Dataset && r instanceof Dataset) {
      ds = l.clone();
      ds.values.forEach(
        (val, i) => (ds.values[i] = val !== null ? val % r.values[i] : null)
      );
    }
    if (!ds) throw new OperationError(BinaryOperator.MOD);
    ds.recalculateYMinMax();
    return ds;
  },
};
