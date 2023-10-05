import { getDateStringFromInputString } from '../../../src/utils/date-time.utils';

describe('DateTime Utils', () => {
  describe('getDateStringFromInputString', () => {
    it('should do something', () => {
      expect(getDateStringFromInputString('a2023-10-04z', 'a', 'z')).toEqual(
        '2023-10-04'
      );
    });
  });
});
