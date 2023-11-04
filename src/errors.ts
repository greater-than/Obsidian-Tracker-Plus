import { toSentenceCase } from './utils/string.utils';

export enum Reason {
  IS_NOT_NUMBER = 'accepts only numbers',
  IS_INVALID = 'is invalid',
  IS_EMPTY = 'cannot be empty',
  IS_NEGATIVE = 'cannot be negative',
  IS_GREATER_THAN = 'cannot be greater than',
  IS_LESS_THAN = 'cannot less than',
  IS_DEPRECATED = 'has been deprecated',
  IS_UNKNOWN = 'is unknown',
  NOT_FOUND_IN_YAML = 'not found in YAML',
  NO_START = 'no start',
  NO_END = 'no end',
  NOT_DATASET_ARG = 'only accepts a Dataset argument',
  TOO_MANY_ARGS = 'has too many arguments',
  TOO_MANY_VALUES = 'has too many values',
  NOT_MONOTONICALLY_INCREASING = 'should be monotonically increasing',
  NOT_MONOTONICALLY_DECREASING = 'should be monotonically decreasing',
  DATASET_NOT_FOUND = 'could not find a dataset',
  NO_MORE_THAN_TWO_VALUES = 'accepts one or two values for left and right y-axes',
  FILES_OUT_OF_RANGE = 'files are out of the date range',
  FILES_NOT_IN_FORMAT = 'files are not in the right format',
}

export class TrackerError extends Error {
  constructor(message: string) {
    super(toSentenceCase(message));
  }
}

export class DeprecatedVariableError extends TrackerError {
  constructor(name: string) {
    super(
      `Template variable '${name}' is deprecated, use function '${name}()' instead`
    );
  }
}

export class OperandError extends TrackerError {
  constructor(message: string = `Operand ${Reason.IS_INVALID}`) {
    super(message || `Operand ${Reason.IS_INVALID}`);
  }
}

export class ValueError extends TrackerError {
  constructor(name: string) {
    super(`Value for '${name}' ${Reason.IS_INVALID}`);
  }
}

export class InputMismatchError extends TrackerError {
  constructor(name: string, reason: Reason = Reason.TOO_MANY_VALUES) {
    super(`Parameter '${name}' ${reason}`);
  }
}

export class YamlParseError extends TrackerError {
  constructor(message = `Could not parse YAML`) {
    super(message || `Could not parse YAML`);
  }
}

export class OperationError extends TrackerError {
  constructor(operator: string, reason: Reason = Reason.IS_UNKNOWN) {
    super(`Operation for '${operator}' ${reason}`);
  }
}

export class SearchTargetError extends TrackerError {
  constructor(searchTarget: string[], reason: Reason = Reason.IS_EMPTY) {
    super(`Search target '${searchTarget}' ${reason}`);
  }
}

export class EmptySearchTargetError extends TrackerError {
  constructor(message = `searchTarget ${Reason.IS_EMPTY}`) {
    super(message || `searchTarget ${Reason.IS_EMPTY}`);
  }
}

export class DivisionByZeroError extends TrackerError {
  constructor(message = `Division by zero in expression`) {
    super(message ? message : 'Division by zero in expression');
  }
}

export class FunctionError extends TrackerError {
  constructor(name: string, reason: Reason = Reason.IS_DEPRECATED) {
    super(`Function '${name}' ${reason}`);
  }
}

export class RangeError extends TrackerError {
  constructor(left: string, reason: Reason, right: string) {
    super(`Range '${left}' ${reason} '${right}'`);
  }
}

export class DateRangeError extends TrackerError {
  constructor(message = `Date range ${Reason.IS_INVALID}`) {
    super(message || `Date range ${Reason.IS_INVALID}`);
  }
}

export class ArrayError extends TrackerError {
  constructor(name: string, reason: Reason = Reason.IS_EMPTY) {
    super(`Array '${name}' ${reason}`);
  }
}

export class ArgumentError extends TrackerError {
  constructor(name: string, reason: Reason = Reason.IS_INVALID) {
    super(`Argument '${name}' ${reason}`);
  }
}

export class YAxisArgumentError extends TrackerError {
  constructor(name: string, reason: Reason = Reason.NO_MORE_THAN_TWO_VALUES) {
    super(`Argument '${name}' ${reason}`);
  }
}

export class ParameterError extends TrackerError {
  constructor(name: string, reason: Reason | string = Reason.IS_INVALID) {
    super(`Parameter '${name}' ${reason}`);
  }
}

export class KeyError extends TrackerError {
  constructor(key: string, reason: Reason | string = Reason.IS_INVALID) {
    super(`Key '${key}' ${reason}`);
  }
}

export class StreakError extends TrackerError {
  constructor(reason: Reason) {
    super(`${reason} to the current streak found`);
  }
}

export class BrokenStreakError extends TrackerError {
  constructor(reason: Reason) {
    super(`${reason} to a break in the current streak found`);
  }
}

export class XDataError extends TrackerError {
  constructor(reason: Reason) {
    super(`No valid x-value dates found in notes: ${reason}`);
  }
}
