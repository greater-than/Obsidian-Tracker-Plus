import { Dataset } from '../../../src/models/dataset';
import { mockQuery } from '../_mocks/query.mocks';

describe('Dataset', () => {
  it('Should be true', () => {
    expect(true);
  });

  describe('accumulateValues', () => {
    const dataset = new Dataset(null, mockQuery);
    it('Should update the values, yMin, and yMax properties', () => {
      dataset.accumulateValues();
      expect(dataset.values);
    });
  });
});
