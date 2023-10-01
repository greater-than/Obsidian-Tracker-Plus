// String helpers

import * as d3 from 'd3';
import { Size } from '../models/data';

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

  // <img[^>]*?alt\s*=\s*[""']?(?<emoji>[^'"" >]+?)[ '""][^>]*?>
  const strRegex =
    '<img[^>]*?alt\\s*=\\s*[""\']?(?<emoji>[^\'"" >]+?)[ \'""][^>]*?>';
  // console.log(strRegex);
  const regex = new RegExp(strRegex, 'g');

  const output = input.replace(regex, (...args) => {
    const groups = args[args.length - 1];
    if (groups && groups.emoji) {
      return groups.emoji.trim();
    }
    return '';
  });

  return output;
}; // Chart helpers

export const measureTextSize = (
  text: string,
  styleClass: string = '',
  rotate: string = ''
): Size => {
  const container = d3.select('body').append('svg');
  const textBlock = container
    .append('text')
    .text(text)
    .attr('x', -99999)
    .attr('y', -99999);
  if (styleClass) {
    textBlock.attr('class', styleClass);
  }
  if (rotate) {
    textBlock.attr('transform', 'rotate(' + rotate + ')');
  }
  const size = container.node().getBBox();
  container.remove();
  return { width: size.width, height: size.height };
};
