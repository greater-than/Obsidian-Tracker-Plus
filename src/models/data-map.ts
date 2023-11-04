import { IDataMap, IQueryValuePair } from './types';

export class DataMap
  extends Map<string, IQueryValuePair[]>
  implements IDataMap
{
  /**
   * @summary Adds or updates an element with a specified date to the map
   * @param {string} date
   * @param {IQueryValuePair} value
   * @returns {DataMap}
   */
  add = (date: string, value: IQueryValuePair): DataMap => {
    this.has(date) ? this.get(date).push(value) : this.set(date, [value]);
    return this;
  };
}
