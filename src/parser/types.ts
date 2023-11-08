export interface IValueOptions {
  valueCount: number;
  defaultValue: number | string;
  allowInvalidValue?: boolean;
}
export interface INumberValueOptions extends IValueOptions {
  defaultValue: number;
}

export interface IStringValueOptions extends IValueOptions {
  defaultValue: string;
}
