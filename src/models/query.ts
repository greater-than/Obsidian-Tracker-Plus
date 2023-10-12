import { SearchType, ValueType } from './enums';
import { IQuery } from './types';

export class Query implements IQuery {
  // TODO move code out of constructor
  constructor(
    readonly id: number,
    readonly type: SearchType,
    readonly target: string
  ) {
    this._separator = ''; // separator to separate multiple values
    this._valueType = ValueType.Number;
    this._usedAsXDataset = false;
    this._numTargets = 0;
    this.accessors = [-1, -1, -1];

    if (type === SearchType.Table) {
      // searchTarget --> {{filePath}}[{{table}}][{{column}}]
      const pattern =
        '\\[(?<accessor>[0-9]+)\\]\\[(?<accessor1>[0-9]+)\\](\\[(?<accessor2>[0-9]+)\\])?';
      const regex = new RegExp(pattern, 'gm');
      let match;
      while ((match = regex.exec(target))) {
        if (typeof match.groups.accessor !== 'undefined') {
          const accessor = parseFloat(match.groups.accessor);
          if (Number.isNumber(accessor)) {
            if (typeof match.groups.accessor1 !== 'undefined') {
              const accessor1 = parseFloat(match.groups.accessor1);
              if (Number.isNumber(accessor1)) {
                let accessor2;
                if (typeof match.groups.accessor2 !== 'undefined')
                  accessor2 = parseFloat(match.groups.accessor2);

                this.accessors[0] = accessor;
                this.accessors[1] = accessor1;
                if (Number.isNumber(accessor2)) this.accessors[2] = accessor2;

                this._parentTarget = target.replace(regex, '');
              }
              break;
            }
          }
        }
      }
    } else {
      const pattern = '\\[(?<accessor>[0-9]+)\\]';
      const regex = new RegExp(pattern, 'gm');
      let match;
      while ((match = regex.exec(target))) {
        if (typeof match.groups.accessor !== 'undefined') {
          const accessor = parseFloat(match.groups.accessor);
          if (Number.isNumber(accessor)) {
            this.accessors[0] = accessor;
            this._parentTarget = target.replace(regex, '');
          }
          break;
        }
      }
    }
  }

  private _parentTarget: string | null;
  private _separator: string; // multiple value separator
  readonly accessors: number[];
  private _numTargets: number;

  private _valueType: ValueType;
  private _usedAsXDataset: boolean;

  get usedAsXDataset() {
    return this._usedAsXDataset;
  }

  set usedAsXDataset(val: boolean) {
    this._usedAsXDataset = val;
  }

  get valueType() {
    return this._valueType;
  }

  set valueType(val: ValueType) {
    this._valueType = val;
  }

  get numTargets() {
    return this._numTargets;
  }

  get separator() {
    return this._separator;
  }

  get parentTarget() {
    return this._parentTarget;
  }

  public equalTo(other: IQuery): boolean {
    return this.type === other.type && this.target === other.target
      ? true
      : false;
  }

  public getAccessor(index = 0) {
    switch (index) {
      case 0:
        return this.accessors[0];
      case 1:
        return this.accessors[1];
      case 2:
        return this.accessors[2];
    }
    return null;
  }

  public setSeparator(sep: string) {
    this._separator = sep;
  }

  public getSeparator(isForFrontmatterTags: boolean = false): string {
    return this.separator === ''
      ? isForFrontmatterTags
        ? ','
        : '/'
      : this._separator;
  }

  public incrementTargets(num: number = 1): void {
    this._numTargets = this._numTargets + num;
  }
}
