import { Transformer } from '../models/transformer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const expandArea = (area: any, addW: number, addH: number): void => {
  area.attr('width', (parseFloat(area.attr('width')) | 0) + addW);
  area.attr('height', (parseFloat(area.attr('height')) | 0) + addH);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const moveArea = (area: any, shiftX: number, shiftY: number): void => {
  const transformed = new Transformer(area.attr('transform'));
  area.attr(
    'transform',
    `translate(${transformed.x + shiftX}, ${transformed.y + shiftY})`
  );
};
