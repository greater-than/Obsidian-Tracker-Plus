import { ValueType } from '../../../src/models/enums';
import { parseFloat } from '../../../src/utils/number.utils';

describe('Number Utils', () => {
  describe('parseFloat', () => {
    it('should do something', () => {
      // TODO It parses numbers, but strings throw an error
      expect(parseFloat(123)).toEqual({ type: ValueType.Number, value: 123 });
    });
  });
});
