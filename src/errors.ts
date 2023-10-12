export class TrackerError extends Error {}

export class UnknownOperationError extends TrackerError {
  constructor(operator: string) {
    super(`Unknown operation for '${operator}'`);
  }
}

export class DeprecatedTemplateVariableError extends TrackerError {
  constructor(varName: string) {
    super(
      `Deprecated template variable '${varName}', use '${varName}()' instead`
    );
  }
}

export class InvalidInputError extends TrackerError {
  constructor(inputName: string) {
    super(`Invalid input for '${inputName}'`);
  }
}

export class NoValidInputError extends TrackerError {
  constructor(inputName: string) {
    super(`No valid input for '${inputName}'`);
  }
}

export class TooManyInputsError extends TrackerError {
  constructor(name: string) {
    super(`Parameter '${name}' has too many inputs`);
  }
}

export class YamlParseError extends TrackerError {
  constructor(message = `Could not parse YAML`) {
    super(message ?? `Could not parse YAML`);
  }
}

export class InvalidDateRangeError extends TrackerError {
  constructor(message = `Invalid date range`) {
    super(message ?? `Invalid date range`);
  }
}

export class EmptySearchTargetError extends TrackerError {
  constructor(message = `searchTarget cannot be empty`) {
    super(message ?? `searchTarget cannot be empty`);
  }
}

export class InvalidSearchTargetError extends TrackerError {
  constructor(searchTarget: string[]) {
    super(`Search target '${searchTarget}' is invalid`);
  }
}

export class EmptyArrayError extends TrackerError {
  constructor(name: string) {
    super(`Empty array not allowed for '${name}'`);
  }
}

export class DivisionByZeroError extends TrackerError {
  constructor(message = `Division by zero in expression`) {
    super(message ?? `Division by zero in expression`);
  }
}

export enum Reason {
  ONLY_NUMBERS = 'accepts only numbers',
  INVALID = 'is invalid',
  EMPTY = 'cannot be empty',
  NOT_FOUND_IN_YAML = 'not found in YAML',
  DEPRECATED = 'has been deprecated',
  UNKNOWN = 'is unknown',
}

export class InvalidParameterError extends TrackerError {
  constructor(name: string, reason: Reason = Reason.INVALID) {
    super(`Parameter '${name}' ${reason}`);
  }
}

export class InvalidDatasetKeyError extends TrackerError {
  constructor(key: string) {
    super(`Key '${key}' is not available`);
  }
}
