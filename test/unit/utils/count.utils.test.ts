import { getSentenceCount, getWordCount } from '../../../src/utils/count.utils';

// cSpell:disable
const sentence =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed \
   do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

const paragraph =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed \
   do eiusmod tempor incididunt ut labore et dolore magna aliqua. \
   Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris \
   nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in \
   reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla \
   pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa \
   qui officia deserunt mollit anim id est laborum.';
// cSpell:enable

describe('Count Utils', () => {
  describe('getSentenceCount', () => {
    it('Should find zero sentences in an empty string', () => {
      const result = getSentenceCount('');
      expect(result).toEqual(0);
    });
    it('should return 1 sentence in this string', () => {
      const result = getSentenceCount(sentence);
      expect(result).toEqual(1);
    });
    it('should return 4 sentences in this string', () => {
      const result = getSentenceCount(paragraph);
      expect(result).toEqual(4);
    });
  });

  describe('getWordCount', () => {
    it('should find zero words in an empty string', () => {
      const result = getWordCount('');
      expect(result).toEqual(0);
    });
    it('should find 19 words in this string', () => {
      const result = getWordCount(sentence);
      expect(result).toEqual(19);
    });
    it('should find 69 words in this string', () => {
      const result = getWordCount(paragraph);

      expect(result).toEqual(69);
    });
  });
});
