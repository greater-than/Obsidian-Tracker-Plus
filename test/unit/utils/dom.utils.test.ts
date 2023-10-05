import { expandArea, moveArea } from '../../../src/utils/dom.utils';

describe('DOM Utils', () => {
  describe('expandArea', () => {
    it('should do something', () => {
      expandArea({ attr: jest.fn() }, 10, 10);
    });
  });

  describe('moveArea', () => {
    it('should do something', () => {
      moveArea({ attr: jest.fn() }, 10, 10);
    });
  });
});
