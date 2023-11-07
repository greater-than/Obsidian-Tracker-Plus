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
 * TODO What is this doing?
 * @param {string} imageTag
 * @returns {string}
 */
export const replaceImgTagByAlt = (imageTag: string): string => {
  if (imageTag === null) return null;
  const pattern =
    '<img[^>]*?alt\\s*=\\s*[""\']?(?<emoji>[^\'"" >]+?)[ \'""][^>]*?>';
  const regex = new RegExp(pattern, 'g');
  return imageTag.replace(regex, (...args) => {
    const groups = args[args.length - 1];
    return groups && groups.emoji ? groups.emoji.trim() : '';
  });
};

/**
 * @summary: Removes: leading and trailing spaces, double spaces, and new lines with a leading space
 * @description: Thanks to @torantine. Code snippet from: https://gist.github.com/torantine/af639cba3c32762576d64c34effaf614
 * @param {string} text
 * @returns {string}
 */
export const cleanText = (text: string): string => {
  return text
    .replace(/(^\\s\*)|(\\s\*$)/gi, '') // remove the start and end spaces of the given string
    .replace(/\[ \]{2,}/gi, ' ') //        reduce multiple spaces to a single space
    .replace(/\\n /, '\\n'); //            exclude a new line with a leading space
};

/**
 * Converts truthy/falsy values to a boolean
 * @param {string} value
 * @returns {boolean | null}
 */
export const toBool = (value: string | number): boolean | null => {
  const val = value.toString().trim().toLowerCase();
  if (['true', '1', 'on', 'yes'].includes(val)) return true;
  if (['false', '0', 'off', 'no'].includes(val)) return false;
  return null;
};

/**
 * @summary Capitalizes the first word in each sentence
 * @param {string} value
 * @returns {string}
 */
export const toSentenceCase = (value: string): string => {
  const sentences = value.split('.');
  let all = '';
  sentences.forEach((sentence) => {
    let space = '';
    const spaceCount = sentence.replace(/^(\s*).*$/, '$1').length;
    sentence = sentence.replace(/^\s+/, '');
    sentence = `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}`;
    for (let j = 0; j < spaceCount; j++) space = space + ' ';
    all = `${all}${space}${sentence}.`;
  });

  return all.substring(0, all.length - 1);
};
