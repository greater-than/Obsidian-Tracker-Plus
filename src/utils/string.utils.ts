/**
 * @summary Returns the a row from a MarkDown table without the leading/trailing character
 * @param {string} row
 * @param {string} char
 * @returns {string}
 */
export const parseMarkdownTableRow = (
  row: string,
  char: string = '|'
): string => {
  const arr = Array.from(row);
  const first = arr.findIndex((c) => c !== char);
  const last = arr.reverse().findIndex((c) => c !== char);
  return first === -1 && last === -1
    ? row
    : row.substring(first, row.length - last);
};

/**
 *
 * @param {string} imageTag
 * @returns {string}
 */
export const replaceImgTagByAlt = (imageTag: string): string => {
  if (imageTag === null) return null;
  const strRegex =
    '<img[^>]*?alt\\s*=\\s*[""\']?(?<emoji>[^\'"" >]+?)[ \'""][^>]*?>';
  // console.log(strRegex);
  const regex = new RegExp(strRegex, 'g');
  const output = imageTag.replace(regex, (...args) => {
    const groups = args[args.length - 1];
    return groups && groups.emoji ? groups.emoji.trim() : '';
  });
  return output;
};

/**
 * @summary: Removes: leading and trailing spaces, double spaces, and new lines with a leading space
 * @description: Thanks to @torantine. Code snippet from: https://gist.github.com/torantine/af639cba3c32762576d64c34effaf614
 * @param {string} text
 * @returns {string}
 */
export const cleanText = (text: string): string => {
  text = text.replace(/(^\\s\*)|(\\s\*$)/gi, ''); // remove the start and end spaces of the given string
  text = text.replace(/\[ \]{2,}/gi, ' '); // reduce multiple spaces to a single space
  text = text.replace(/\\n /, '\\n'); // exclude a new line with a leading space
  return text;
};
