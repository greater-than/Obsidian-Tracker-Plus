// String helpers

export const trimByChar = (str: string, char: string): string => {
  const arr = Array.from(str);
  const first = arr.findIndex((c) => c !== char);
  const last = arr.reverse().findIndex((c) => c !== char);
  return first === -1 && last === -1
    ? str
    : str.substring(first, str.length - last);
};

export const replaceImgTagByAlt = (input: string): string => {
  if (input === null) return null;

  const strRegex =
    '<img[^>]*?alt\\s*=\\s*[""\']?(?<emoji>[^\'"" >]+?)[ \'""][^>]*?>';
  // console.log(strRegex);
  const regex = new RegExp(strRegex, 'g');

  const output = input.replace(regex, (...args) => {
    const groups = args[args.length - 1];
    return groups && groups.emoji ? groups.emoji.trim() : '';
  });

  return output;
};
