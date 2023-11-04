import { FrontMatterCache } from 'obsidian';

export const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export type TAllowedType =
  | 'string'
  | 'number'
  | 'bigint'
  | 'boolean'
  | 'object'
  | 'function'
  | 'symbol'
  | 'Object'
  | 'Date'
  | 'Array'
  | 'String'
  | 'Number'
  | 'Boolean'
  | 'undefined'
  | null;

export const DefaultAllowedTypes: TAllowedType[] = [
  'string',
  'number',
  'bigint',
  'boolean',
  'function',
  'Object',
  'Date',
  'Array',
  'String',
  'Number',
  'Boolean',
  'object',
];

export const isTypeOf = <T>(
  value: T,
  allowed: TAllowedType | TAllowedType[] = DefaultAllowedTypes
): boolean => allowed.length !== 0 && allowed.includes(typeof value);

export const isNullOrUndefined = <T>(value: T): boolean =>
  value === null || value === undefined;

/**
 * @summary Returns the first value of a property match in frontmatter
 * @description See: http://jsfiddle.net/alnitak/hEsys/ for the inspiration for this function
 * @param {FrontMatterCache} object
 * @param {string} property A dot-delimited ('.') property path
 * @returns {string | any[]}
 */
export const getDeepValue = (
  object: FrontMatterCache,
  property: string
): number | string | string[] => {
  if (Object.keys(object).length === 0) return null;
  const segments = property
    .replace(/^\./, '') // strip a leading dot
    .split('.');

  let value: boolean | number | string | string[] | unknown = null;
  // for (let i = 0, n = segments.length; i < n; ++i) {}
  segments.forEach((segment) => {
    if (!(segment in object)) return;
    value = object[segment];
  });

  if (typeof value === 'string' || Array.isArray(value)) return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  return null;
};
