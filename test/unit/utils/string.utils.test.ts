import {
  cleanText,
  parseMarkdownTableRow,
  replaceImgTagByAlt,
} from '../../../src/utils/string.utils';

describe('String Utils', () => {
  describe('parseMarkdownTableRow', () => {
    it('should return a MarkDown table row without the leading/trailing pipe character', () => {
      expect(parseMarkdownTableRow('|0123|56789|', '|')).toEqual('0123|56789');
    });
  });

  describe('replaceImgTagByAlt', () => {
    it('should return null if no image tag is provided', () => {
      expect(replaceImgTagByAlt(null)).toEqual(null);
    });
    it('should something if an image tag is provided', () => {
      // TODO I'm not sure what this function is doing yet
      expect(
        replaceImgTagByAlt(`<img src='some-image.png' alt='<altText>' />`)
      ).toEqual(`<img src='some-image.png' alt='<altText>' />`);
    });
  });

  describe('cleanText', () => {
    it('should return an empty string if one is provided', () => {
      expect(cleanText('')).toEqual('');
    });
  });
});
