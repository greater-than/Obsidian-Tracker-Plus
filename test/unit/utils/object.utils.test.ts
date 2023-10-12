import { FrontMatterCache } from 'obsidian';
import {
  clone,
  getDeepValue,
  isNullOrUndefined,
} from '../../../src/utils/object.utils';

describe('Object Utils', () => {
  describe('clone', () => {
    it('should clone an object so that the original is immutable', () => {
      const objToClone = { key: '<value>' };
      const result = clone(objToClone);
      expect(result).toStrictEqual(objToClone);
      result.key = '<updatedValue>';
      expect(result).not.toStrictEqual(objToClone);
    });
  });

  describe('isNullOrUndefined', () => {
    it('should return true', () => {
      expect(isNullOrUndefined(null)).toEqual(true);
      expect(isNullOrUndefined(undefined)).toEqual(true);
    });
    it('should return false', () => {
      expect(isNullOrUndefined({ key: 'value' })).toEqual(false);
    });
  });

  describe('getDeepValue', () => {
    it('should return null if an empty object is provided', () => {
      const obj = {};
      const result = getDeepValue(obj, 'key');
      expect(result).toEqual(null);
    });
    it('should return the correct value from a non-nested object', () => {
      const obj: FrontMatterCache = { string: 'value' };
      const keyToFind = 'string';
      expect(getDeepValue(obj, keyToFind)).toEqual('value');
    });
    it('should return the correct values from a nested object', () => {
      const obj: FrontMatterCache = { someKey: { string: 'value' } };
      let keyToFind = 'someKey.string';
      expect(getDeepValue(obj, keyToFind)).toEqual('value');

      obj.someKey = {
        anotherKey: {
          invalid: undefined,
          string: 'value',
          boolean: true,
          stringArray: ['1', '2', '3'],
          numberArray: [1, 2, 3],
          number: 42,
        },
      };
      keyToFind = 'someKey.anotherKey.string';
      expect(getDeepValue(obj, keyToFind)).toEqual('value');

      keyToFind = 'someKey.anotherKey.boolean';
      expect(getDeepValue(obj, keyToFind)).toEqual('true');

      keyToFind = 'someKey.anotherKey.stringArray';
      expect(getDeepValue(obj, keyToFind)).toEqual(['1', '2', '3']);

      keyToFind = 'someKey.anotherKey.numberArray';
      expect(getDeepValue(obj, keyToFind)).toEqual([1, 2, 3]);

      keyToFind = 'someKey.anotherKey.number';
      expect(getDeepValue(obj, keyToFind)).toEqual('42');

      keyToFind = 'someKey.anotherKey.invalid';
      expect(getDeepValue(obj, keyToFind)).toEqual(null);
    });
  });
});
