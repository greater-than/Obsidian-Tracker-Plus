import * as d3 from 'd3';
import jsep from 'jsep';
import { Dataset } from '../models/dataset';
import { RenderInfo } from '../models/render-info';
import { BinaryOperator, UnaryOperator, ValidExpression } from './enums';
import {
  IBinaryOperationMap,
  IDatasetToDatasetMap,
  IDatasetToValueMap,
  IExprResolved,
  IMapUnaryOperationMap,
} from './types';
import Moment = moment.Moment;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const checkDivisor = (divisor: any): boolean => {
  // console.log("checking divisor");
  if (typeof divisor === 'number') {
    if (divisor === 0) return false;
  } else if (divisor instanceof Dataset) {
    if (
      divisor.values.some((v) => {
        return v === 0;
      })
    ) {
      return false;
    }
  }
  return true;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateBinaryOperand = (operand: any) => {
  if (
    typeof operand !== 'number' &&
    !window.moment.isMoment(operand) &&
    !(operand instanceof Dataset)
  )
    throw new Error('Error: Invalid operand');
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validateBinaryOperands = (left: any, right: any): string => {
  if (typeof left === 'string') return left;
  if (typeof right === 'string') return right;

  validateBinaryOperand(left);
  validateBinaryOperand(right);
};

export const DatasetToValue: IDatasetToValueMap = {
  // min value of a dataset
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  min: (dataset, _renderInfo): number => {
    // return number
    return d3.min(dataset.values);
  },
  // the latest date with min value
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  minDate: (dataset, _renderInfo): Moment | string => {
    // return Moment
    const min = d3.min(dataset.values);
    if (Number.isNumber(min)) {
      const arrayDataset = Array.from(dataset);
      for (const dataPoint of arrayDataset.reverse()) {
        if (dataPoint.value !== null && dataPoint.value === min) {
          return dataPoint.date;
        }
      }
    }
    return 'Error: Min Date not found';
  },
  // max value of a dataset
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  max: (dataset, _renderInfo): number => {
    // return number
    return d3.max(dataset.values);
  },
  // the latest date with max value
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxDate: (dataset, _renderInfo): Moment | string => {
    // return Moment
    const max = d3.max(dataset.values);
    if (Number.isNumber(max)) {
      const arrayDataset = Array.from(dataset);
      for (const dataPoint of arrayDataset.reverse()) {
        if (dataPoint.value !== null && dataPoint.value === max) {
          return dataPoint.date;
        }
      }
    }
    return 'Error: Max Date not found';
  },
  // start date of a dataset
  // if datasetId not found, return overall startDate
  startDate: (dataset, renderInfo): Moment => {
    // return Moment
    if (dataset) {
      const startDate = dataset.startDate;
      if (startDate && startDate.isValid()) {
        return startDate;
      }
    }
    return renderInfo.startDate;
  },
  // end date of a dataset
  // if datasetId not found, return overall endDate
  endDate: (dataset, renderInfo): Moment => {
    // return Moment
    if (dataset) {
      const endDate = dataset.endDate;
      if (endDate && endDate.isValid()) {
        return endDate;
      }
    }
    return renderInfo.endDate;
  },
  // sum of all values in a dataset
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sum: (dataset, _renderInfo): number => {
    // return number
    return d3.sum(dataset.values);
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  count: (_dataset, _renderInfo): string => {
    return "Error: Deprecated function 'count'";
  },
  // number of occurrences of a target in a dataset
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  numTargets: (dataset, _renderInfo): number => {
    // return number
    return dataset.numTargets;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  days: (_dataset, _renderInfo): string => {
    return "Error: Deprecated function 'days'";
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  numDays: (dataset, _renderInfo): number => {
    // return number
    return dataset.values.length;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  numDaysHavingData: (dataset, _renderInfo): number => {
    // return number
    return dataset.nonNullValueCount;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxStreak: (dataset, _renderInfo): number => {
    // return number
    let streak = 0;
    let maxStreak = 0;
    for (const dataPoint of dataset) {
      if (dataPoint.value !== null) {
        streak++;
      } else {
        streak = 0;
      }
      if (streak >= maxStreak) {
        maxStreak = streak;
      }
    }
    return maxStreak;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxStreakStart: (dataset, _renderInfo): Moment => {
    // return Moment
    let streak = 0;
    let maxStreak = 0;
    let streakStart: Moment = null;
    let maxStreakStart: Moment = null;
    if (dataset) {
      for (const dataPoint of dataset) {
        if (dataPoint.value !== null) {
          if (streak === 0) {
            streakStart = dataPoint.date;
          }
          streak++;
        } else {
          streak = 0;
        }
        if (streak >= maxStreak) {
          maxStreak = streak;
          maxStreakStart = streakStart;
        }
      }
    }
    return maxStreakStart;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxStreakEnd: (dataset, _renderInfo): Moment => {
    // return Moment
    let streak = 0;
    let maxStreak = 0;
    let streakEnd: Moment = null;
    let maxStreakEnd: Moment = null;
    if (dataset) {
      const arrayDataset = Array.from(dataset);
      for (let ind = 0; ind < arrayDataset.length; ind++) {
        const point = arrayDataset[ind];
        let nextPoint = null;
        if (ind < arrayDataset.length - 1) {
          nextPoint = arrayDataset[ind + 1];
        }
        if (point.value !== null) {
          streak++;
          if (nextPoint?.value === null) {
            streakEnd = point.date;
          }
        } else {
          streak = 0;
        }
        if (streak >= maxStreak) {
          // console.log(streak);
          // console.log(maxStreak);
          maxStreak = streak;
          maxStreakEnd = streakEnd;
        }
      }
    }
    return maxStreakEnd;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxBreaks: (dataset, _renderInfo): number => {
    // return number
    let breaks = 0;
    let maxBreaks = 0;
    for (const dataPoint of dataset) {
      if (dataPoint.value === null) {
        breaks++;
      } else {
        breaks = 0;
      }
      if (breaks > maxBreaks) {
        maxBreaks = breaks;
      }
    }
    return maxBreaks;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxBreaksStart: (dataset, _renderInfo): Moment => {
    // return Moment
    let breaks = 0;
    let maxBreaks = 0;
    let breaksStart: Moment = null;
    let maxBreaksStart: Moment = null;
    if (dataset) {
      for (const dataPoint of dataset) {
        if (dataPoint.value === null) {
          if (breaks === 0) {
            breaksStart = dataPoint.date;
          }
          breaks++;
        } else {
          breaks = 0;
        }
        if (breaks >= maxBreaks) {
          maxBreaks = breaks;
          maxBreaksStart = breaksStart;
        }
      }
    }
    return maxBreaksStart;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxBreaksEnd: (dataset, _renderInfo): Moment => {
    // return Moment
    let breaks = 0;
    let maxBreaks = 0;
    let breaksEnd: Moment = null;
    let maxBreaksEnd: Moment = null;
    if (dataset) {
      const arrayDataset = Array.from(dataset);
      for (let ind = 0; ind < arrayDataset.length; ind++) {
        const point = arrayDataset[ind];
        let nextPoint = null;
        if (ind < arrayDataset.length - 1) {
          nextPoint = arrayDataset[ind + 1];
        }
        if (point.value === null) {
          breaks++;
          if (nextPoint?.value !== null) {
            breaksEnd = point.date;
          }
        } else {
          breaks = 0;
        }
        if (breaks >= maxBreaks) {
          maxBreaks = breaks;
          maxBreaksEnd = breaksEnd;
        }
      }
    }
    return maxBreaksEnd;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lastStreak: (_dataset, _renderInfo): string =>
    "Error: Deprecated function 'lastStreak'",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentStreak: (dataset, _renderInfo): number => {
    // return number
    let currentStreak = 0;
    if (dataset) {
      const arrayDataset = Array.from(dataset);
      for (let ind = arrayDataset.length - 1; ind >= 0; ind--) {
        const point = arrayDataset[ind];
        if (point.value === null) {
          break;
        } else {
          currentStreak++;
        }
      }
    }
    return currentStreak;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentStreakStart: (dataset, _renderInfo): Moment | string => {
    // return Moment
    let currentStreak = 0;
    let currentStreakStart: Moment = null;
    if (dataset) {
      const arrayDataset = Array.from(dataset);
      for (let ind = arrayDataset.length - 1; ind >= 0; ind--) {
        const point = arrayDataset[ind];
        if (ind < arrayDataset.length - 1) {
          currentStreakStart = arrayDataset[ind + 1].date;
        }
        if (point.value === null) {
          break;
        } else {
          // What is this doing?
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          currentStreak++;
        }
      }
    }

    if (currentStreakStart === null) {
      return 'Error: No start to the current streak found';
    }
    return currentStreakStart;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentStreakEnd: (dataset, _renderInfo): Moment | string => {
    // return Moment
    let currentStreak = 0;
    let currentStreakEnd: Moment = null;
    if (dataset) {
      const arrayDataset = Array.from(dataset);
      for (let ind = arrayDataset.length - 1; ind >= 0; ind--) {
        const point = arrayDataset[ind];
        if (point.value === null) {
          break;
        } else {
          if (currentStreak === 0) {
            currentStreakEnd = point.date;
          }
          currentStreak++;
        }
      }
    }

    if (currentStreakEnd === null) {
      return 'Error: No end to the current streak found';
    }
    return currentStreakEnd;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentBreaks: (dataset, _renderInfo): number => {
    // return number
    let currentBreaks = 0;
    if (dataset) {
      const arrayDataset = Array.from(dataset);
      for (let ind = arrayDataset.length - 1; ind >= 0; ind--) {
        const point = arrayDataset[ind];
        if (point.value === null) {
          currentBreaks++;
        } else {
          break;
        }
      }
    }
    return currentBreaks;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentBreaksStart: (dataset, _renderInfo): Moment | string => {
    // return Moment
    let currentBreaks = 0;
    let currentBreaksStart: Moment = null;
    if (dataset) {
      const arrayDataset = Array.from(dataset);
      for (let ind = arrayDataset.length - 1; ind >= 0; ind--) {
        const point = arrayDataset[ind];
        if (ind < arrayDataset.length - 1) {
          currentBreaksStart = arrayDataset[ind + 1].date;
        }
        if (point.value === null) {
          // What is this doing?
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          currentBreaks++;
        } else {
          break;
        }
      }
    }

    if (currentBreaksStart === null) {
      return 'Error: No start to a break in the current streak found';
    }
    return currentBreaksStart;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentBreaksEnd: (dataset, _renderInfo): Moment | string => {
    // return Moment
    let currentBreaks = 0;
    let currentBreaksEnd: Moment = null;
    if (dataset) {
      const arrayDataset = Array.from(dataset);
      for (let ind = arrayDataset.length - 1; ind >= 0; ind--) {
        const point = arrayDataset[ind];
        if (point.value === null) {
          if (currentBreaks === 0) {
            currentBreaksEnd = point.date;
          }
          currentBreaks++;
        } else {
          break;
        }
      }
    }

    if (currentBreaksEnd === null) {
      return 'Error: No end to a break in the current streak found';
    }
    return currentBreaksEnd;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  average: (dataset, _renderInfo): number | string => {
    // return number
    const countNotNull = dataset.nonNullValueCount;
    if (!checkDivisor(countNotNull)) {
      return 'Error: Division by zero in expression';
    }
    const sum = d3.sum(dataset.values);
    return sum / countNotNull;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  median: (dataset, _renderInfo): number => d3.median(dataset.values),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  variance: (dataset, _renderInfo): number => d3.variance(dataset.values),
};

export const UnaryOperation: IMapUnaryOperationMap = {
  [UnaryOperator.NEGATIVE]: (u): number | Dataset | string => {
    if (typeof u === 'number') return -1 * u;
    if (u instanceof Dataset) {
      const tmpDataset = u.cloneToTmpDataset();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) array[index] = -1 * value;
      });
      tmpDataset.recalculateMinMax();
      return tmpDataset;
    }
    return `Error: Unknown operation for '${UnaryOperation.NEGATIVE}`;
  },
  [UnaryOperator.POSITIVE]: (u): number | Dataset | string => {
    if (typeof u === 'number') return u;
    if (u instanceof Dataset) return u.cloneToTmpDataset();
    return `Error: Unknown operation for '${UnaryOperation.POSITIVE}`;
  },
};

export const BinaryOperation: IBinaryOperationMap = {
  [BinaryOperator.ADD]: (l, r): number | Dataset | string => {
    if (typeof l === 'number' && typeof r === 'number') return l + r;
    if (typeof l === 'number' && r instanceof Dataset) {
      // return Dataset
      const tmpDataset = r.cloneToTmpDataset();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = l + value;
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateMinMax();
      return tmpDataset;
    } else if (l instanceof Dataset && typeof r === 'number') {
      // return Dataset
      const tmpDataset = l.cloneToTmpDataset();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = value + r;
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateMinMax();
      return tmpDataset;
    } else if (l instanceof Dataset && r instanceof Dataset) {
      // return Dataset
      const tmpDataset = l.cloneToTmpDataset();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = value + r.values[index];
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateMinMax();
      return tmpDataset;
    }
    return "Error: unknown operation for '+'";
  },
  [BinaryOperator.SUBTRACT]: (l, r): number | Dataset | string => {
    if (typeof l === 'number' && typeof r === 'number') {
      // return number
      return l - r;
    } else if (typeof l === 'number' && r instanceof Dataset) {
      // return Dataset
      const tmpDataset = r.cloneToTmpDataset();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = l - value;
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateMinMax();
      return tmpDataset;
    } else if (l instanceof Dataset && typeof r === 'number') {
      // return Dataset
      const tmpDataset = l.cloneToTmpDataset();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = value - r;
        } else {
          array[index] = null;
        }
      });
      return tmpDataset;
    } else if (l instanceof Dataset && r instanceof Dataset) {
      // return Dataset
      const tmpDataset = l.cloneToTmpDataset();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = value - r.values[index];
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateMinMax();
      return tmpDataset;
    }
    return "Error: unknown operation for '-'";
  },
  [BinaryOperator.MULTIPLY]: (l, r): number | Dataset | string => {
    if (typeof l === 'number' && typeof r === 'number') return l * r;
    if (typeof l === 'number' && r instanceof Dataset) {
      // return Dataset
      const tmpDataset = r.cloneToTmpDataset();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = l * value;
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateMinMax();
      return tmpDataset;
    } else if (l instanceof Dataset && typeof r === 'number') {
      // return Dataset
      const tmpDataset = l.cloneToTmpDataset();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = value * r;
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateMinMax();
      return tmpDataset;
    } else if (l instanceof Dataset && r instanceof Dataset) {
      // return Dataset
      const tmpDataset = l.cloneToTmpDataset();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = value * r.values[index];
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateMinMax();
      return tmpDataset;
    }
    return "Error: unknown operation for '*'";
  },
  [BinaryOperator.DIVIDE]: (l, r): number | Dataset | string => {
    if (!checkDivisor(r)) return 'Error: divide by zero in expression';

    if (typeof l === 'number' && typeof r === 'number') return l / r;
    if (typeof l === 'number' && r instanceof Dataset) {
      // return Dataset
      const tmpDataset = r.cloneToTmpDataset();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = l / value;
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateMinMax();
      return tmpDataset;
    } else if (l instanceof Dataset && typeof r === 'number') {
      // return Dataset
      const tmpDataset = l.cloneToTmpDataset();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = value / r;
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateMinMax();
      return tmpDataset;
    } else if (l instanceof Dataset && r instanceof Dataset) {
      // return Dataset
      const tmpDataset = l.cloneToTmpDataset();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = value / r.values[index];
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateMinMax();
      return tmpDataset;
    }
    return "Error: unknown operation for '/'";
  },
  [BinaryOperator.MOD]: (l, r): number | Dataset | string => {
    if (!checkDivisor(r)) return 'Error: divide by zero in expression';

    if (typeof l === 'number' && typeof r === 'number') return l % r;
    if (typeof l === 'number' && r instanceof Dataset) {
      // return Dataset
      const tmpDataset = r.cloneToTmpDataset();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = l % value;
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateMinMax();
      return tmpDataset;
    } else if (l instanceof Dataset && typeof r === 'number') {
      // return Dataset
      const tmpDataset = l.cloneToTmpDataset();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = value % r;
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateMinMax();
      return tmpDataset;
    } else if (l instanceof Dataset && r instanceof Dataset) {
      // return Dataset
      const tmpDataset = l.cloneToTmpDataset();
      tmpDataset.values.forEach((value, index, array) => {
        if (array[index] !== null) {
          array[index] = value % r.values[index];
        } else {
          array[index] = null;
        }
      });
      tmpDataset.recalculateMinMax();
      return tmpDataset;
    }
    return "Error: unknown operation for '%'";
  },
};

export const DatasetToDataset: IDatasetToDatasetMap = {
  // min value of a dataset
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  normalize: (dataset, _args, _renderInfo): Dataset | string => {
    // console.log("normalize");
    // console.log(dataset);
    const yMin = dataset.yMin;
    const yMax = dataset.yMax;
    // console.log(`yMin/yMax: ${yMin}/${yMax}`);
    if (yMin !== null && yMax !== null && yMax > yMin) {
      const normalized = dataset.cloneToTmpDataset();
      normalized.values.forEach((value, index, array) => {
        array[index] = (value - yMin) / (yMax - yMin);
      });
      normalized.recalculateMinMax();
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
      const newDataset = dataset.cloneToTmpDataset();
      if (Number.isNumber(missingValue) && !Number.isNaN(missingValue)) {
        newDataset.values.forEach((value, index, array) => {
          if (value === null) {
            array[index] = missingValue as number;
          }
        });
        newDataset.recalculateMinMax();
        return newDataset;
      }
    }
    return "Error: invalid arguments for function 'setMissingValues";
  },
};

export const getDataset = (
  datasetId: number,
  renderInfo: RenderInfo
): Dataset => renderInfo.datasets.getDataset(datasetId);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const evaluateArray = (arr: any, renderInfo: RenderInfo): any =>
  arr.map((expr: jsep.Expression) => evaluate(expr, renderInfo));

export const evaluate = (
  expression: jsep.Expression,
  renderInfo: RenderInfo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
  // console.log(expr);
  switch (expression.type) {
    case ValidExpression.LITERAL:
      return (expression as jsep.Literal).value; // string, number, boolean

    case ValidExpression.IDENTIFIER:
      const identifierExpr = expression as jsep.Identifier;
      const identifierName = identifierExpr.name;
      return identifierName in DatasetToValue ||
        identifierName in DatasetToDataset
        ? `Error: deprecated template variable '${identifierName}', use '${identifierName}()' instead`
        : `Error: unknown function name '${identifierName}'`;

    case ValidExpression.UNARY:
      const unaryExpr = expression as jsep.UnaryExpression;
      const unaryArg = evaluate(unaryExpr.argument, renderInfo);
      if (typeof unaryArg === 'string') return unaryArg;
      return UnaryOperation[unaryExpr.operator](unaryArg);

    case ValidExpression.BINARY:
      const binaryExpr = expression as jsep.BinaryExpression;
      const leftOperand = evaluate(binaryExpr.left, renderInfo);
      const rightOperand = evaluate(binaryExpr.right, renderInfo);

      try {
        validateBinaryOperands(leftOperand, rightOperand);
      } catch (error) {
        return error.message;
      }
      return BinaryOperation[binaryExpr.operator](leftOperand, rightOperand);

    case ValidExpression.CALL:
      const callExpr = expression as jsep.CallExpression;

      const calleeIdentifier = callExpr.callee as jsep.Identifier;
      const fnName = calleeIdentifier.name;
      const args = callExpr.arguments;
      // console.log(fnName);
      // console.log(args);
      const evaluatedArgs = evaluateArray(args, renderInfo);
      if (typeof evaluatedArgs === 'string') return evaluatedArgs;

      // function dataset accept only one arg in number
      if (fnName === 'dataset') {
        if (evaluatedArgs.length === 1) {
          const arg = evaluatedArgs[0];
          if (typeof arg === 'string') return arg;
          if (typeof arg !== 'number') {
            return "Error: function 'dataset' only accepts id in number";
          }
          const dataset = getDataset(arg, renderInfo);
          if (!dataset) {
            return `Error: no dataset found for id '${arg}'`;
          }
          return dataset;
        }
      }

      // fnDataset accept only one arg in number or Dataset
      else if (fnName in DatasetToValue) {
        if (evaluatedArgs.length === 0) {
          // Use first non-X dataset
          let dataset = null;
          for (const ds of renderInfo.datasets) {
            if (!dataset && !ds.query.usedAsXDataset) {
              dataset = ds;
              // if breaks here, the index of Datasets not reset???
            }
          }
          if (!dataset) {
            return `No available dataset found for function ${fnName}`;
          }
          return DatasetToValue[fnName](dataset, renderInfo);
        }
        if (evaluatedArgs.length === 1) {
          const arg = evaluatedArgs[0];
          if (typeof arg === 'string') return arg;
          if (arg instanceof Dataset) {
            return DatasetToValue[fnName](arg, renderInfo);
          } else {
            return `Error: function '${fnName}' only accepts Dataset`;
          }
        }
        return `Error: Too many arguments for function ${fnName}`;
      } else if (fnName in DatasetToDataset) {
        if (evaluatedArgs.length === 1) {
          if (typeof evaluatedArgs[0] === 'string') return evaluatedArgs[0]; // error message
          if (evaluatedArgs[0] instanceof Dataset) {
            const dataset = evaluatedArgs[0];
            return DatasetToDataset[fnName](dataset, null, renderInfo);
          } else {
            return `Error: function ${fnName} only accept Dataset`;
          }
        } else if (evaluatedArgs.length > 1) {
          if (typeof evaluatedArgs[0] === 'string') {
            return evaluatedArgs[0];
          }
          if (evaluatedArgs[0] instanceof Dataset) {
            const dataset = evaluatedArgs[0];
            return DatasetToDataset[fnName](
              dataset,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
              evaluatedArgs.filter((_value: any, index: number, _arr: any) => {
                return index > 0;
              }),
              renderInfo
            );
          } else {
            return `Error: function ${fnName} only accept Dataset`;
          }
        }
        return `Error: Too many arguments for function ${fnName}`;
      }
      return `Error: unknown function name '${fnName}'`;
  }
  return 'Error: unknown expression';
};

// Get a list of resolved result containing source, value, and format
export const resolve = (
  text: string,
  renderInfo: RenderInfo
): Array<IExprResolved> | string => {
  // console.log(text);
  const exprMap: Array<IExprResolved> = [];

  // {{(?<expr>[\w+\-*\/0-9\s()\[\]%.]+)(::(?<format>[\w+\-*\/0-9\s()\[\]%.:]+))?}}
  const pattern =
    '{{(?<expr>[\\w+\\-*\\/0-9\\s()\\[\\]%.,]+)(::(?<format>[\\w+\\-*\\/0-9\\s()\\[\\]%.:]+))?}}';
  const regex = new RegExp(pattern, 'gm');
  let match;
  while ((match = regex.exec(text))) {
    // console.log(match);
    const source = match[0];
    if (exprMap.some((e) => e.source === source)) continue;

    if (typeof match.groups !== 'undefined') {
      if (typeof match.groups.expr !== 'undefined') {
        const expr = match.groups.expr;

        let ast = null;
        try {
          ast = jsep(expr);
          if (!ast) return 'Error: failed to parse expression';
        } catch (err) {
          return 'Error:' + err.message;
        }

        // console.log(ast);
        const value = evaluate(ast, renderInfo);
        if (typeof value === 'string') return value; // error message

        if (typeof value === 'number' || window.moment.isMoment(value)) {
          const format =
            typeof match.groups.format !== 'undefined'
              ? match.groups.format
              : null;
          exprMap.push({ source, value, format });
        }
      }
    }
  }
  return exprMap;
};
