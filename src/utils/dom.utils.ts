import { Transform } from '../models/transform';

// dom
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const expandArea = (area: any, addW: number, addH: number): void => {
  const oriWidth = parseFloat(area.attr('width')) | 0;
  const oriHeight = parseFloat(area.attr('height')) | 0;
  const newWidth = oriWidth + addW;
  const newHeight = oriHeight + addH;
  area.attr('width', newWidth);
  area.attr('height', newHeight);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const moveArea = (area: any, shiftX: number, shiftY: number): void => {
  const trans = new Transform(area.attr('transform'));
  area.attr(
    'transform',
    `translate(${trans.translateX + shiftX}, ${trans.translateY + shiftY})`
  );
};
