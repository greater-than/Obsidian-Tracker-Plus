import { clone, isNullOrUndefined } from '../../../src/utils/object.utils';

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
});
