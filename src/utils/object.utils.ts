export const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const isNullOrUndefined = <T>(value: T): boolean =>
  value === null || value === undefined;
