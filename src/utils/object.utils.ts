export const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const isNullOrUndefined = <T>(value: T): boolean =>
  value === null || value === undefined;

// http://jsfiddle.net/alnitak/hEsys/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getDeepValue = (obj: any, str: string): string | any[] => {
  str = str.replace(/^\./, '');
  const a = str.split('.');
  for (let i = 0, n = a.length; i < n; ++i) {
    const k = a[i];
    if (k in obj) {
      obj = obj[k];
    } else {
      return null;
    }
  }
  if (typeof obj === 'string' || Array.isArray(obj)) {
    return obj;
  } else if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj.toString();
  }
  return null;
};
