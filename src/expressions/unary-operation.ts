import { OperandError, OperationError } from '../errors';
import { Dataset } from '../models/dataset';
import { UnaryOperator } from './enums';
import { IUnaryOperation } from './types';
import Moment = moment.Moment;

/**
 * @summary Returns true if operand is one of: number, Moment, or Dataset
 * @param {object | string} operand
 * @returns {boolean}
 */
export const validateBinaryOperand = (
  operand: number | string | Moment | Dataset | object,
  throwIfInvalid: boolean = true
): boolean => {
  const isValid =
    typeof operand !== 'number' &&
    !window.moment.isMoment(operand) &&
    !(operand instanceof Dataset)
      ? false
      : true;
  if (!isValid && throwIfInvalid) throw new OperandError();
  return isValid;
};
/**
 * @summary Returns true if both binary operands are valid
 * @param {string} left
 * @param {string} right
 * @returns {true}
 */

export const validateBinaryOperands = (
  left: object | string,
  right: object | string,
  throwIfInvalid: boolean = true
): boolean =>
  validateBinaryOperand(left, throwIfInvalid) &&
  validateBinaryOperand(right, throwIfInvalid);

export const UnaryOperation: IUnaryOperation = {
  [UnaryOperator.NEGATIVE]: (u): number | Dataset => {
    if (typeof u === 'number') return -1 * u;
    if (u instanceof Dataset) {
      const dataset = u.clone();
      dataset.values.forEach((value, index, array) => {
        if (array[index] !== null) array[index] = -1 * value;
      });
      dataset.recalculateYMinMax();
      return dataset;
    }
    throw new OperationError(UnaryOperator.NEGATIVE);
  },

  [UnaryOperator.POSITIVE]: (u): number | Dataset => {
    if (typeof u === 'number') return u;
    if (u instanceof Dataset) return u.clone();
    throw new OperationError(UnaryOperator.POSITIVE);
  },
};
