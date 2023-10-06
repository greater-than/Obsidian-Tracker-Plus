import { SearchType, ValueType } from '../../../src/models/enums';
import { Query } from '../../../src/models/query';

export const getMockQuery = () => {
  return new Query(12345, SearchType.Tag, 'frontmatter');
};

// @ts-expect-error incomplete mock
export const mockQuery: Query = {
  ...getMockQuery(),
  equalTo: jest.fn(),
  getAccessor: jest.fn(),
  setSeparator: jest.fn(),
  getSeparator: jest.fn(),
  incrementTargets: jest.fn(),
  usedAsXDataset: false,
  valueType: ValueType.Number,
  numTargets: 0,
  separator: '<separator>',
  parentTarget: '<parentTarget>',
};
