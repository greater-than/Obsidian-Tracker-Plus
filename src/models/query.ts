import { SearchType, ValueType } from './enums';

export class Query {
  constructor(id: number, searchType: SearchType, searchTarget: string) {
    this._type = searchType;
    this._target = searchTarget;
    this._separator = ''; // separator to separate multiple values
    this._id = id;
    this._accessor = -1;
    this._accessor1 = -1;
    this._accessor2 = -1;
    this.valueType = ValueType.Number;
    this.usedAsXDataset = false;
    this._numTargets = 0;

    if (searchType === SearchType.Table) {
      // searchTarget --> {{filePath}}[{{table}}][{{column}}]
      const strRegex =
        '\\[(?<accessor>[0-9]+)\\]\\[(?<accessor1>[0-9]+)\\](\\[(?<accessor2>[0-9]+)\\])?';
      const regex = new RegExp(strRegex, 'gm');
      let match;
      while ((match = regex.exec(searchTarget))) {
        if (typeof match.groups.accessor !== 'undefined') {
          const accessor = parseFloat(match.groups.accessor);
          if (Number.isNumber(accessor)) {
            if (typeof match.groups.accessor1 !== 'undefined') {
              const accessor1 = parseFloat(match.groups.accessor1);
              if (Number.isNumber(accessor1)) {
                let accessor2;
                if (typeof match.groups.accessor2 !== 'undefined') {
                  accessor2 = parseFloat(match.groups.accessor2);
                }

                this._accessor = accessor;
                this._accessor1 = accessor1;
                if (Number.isNumber(accessor2)) {
                  this._accessor2 = accessor2;
                }
                this._parentTarget = searchTarget.replace(regex, '');
              }
              break;
            }
          }
        }
      }
    } else {
      const strRegex = '\\[(?<accessor>[0-9]+)\\]';
      const regex = new RegExp(strRegex, 'gm');
      let match;
      while ((match = regex.exec(searchTarget))) {
        if (typeof match.groups.accessor !== 'undefined') {
          const accessor = parseFloat(match.groups.accessor);
          if (Number.isNumber(accessor)) {
            this._accessor = accessor;
            this._parentTarget = searchTarget.replace(regex, '');
          }
          break;
        }
      }
    }
  }

  private _type: SearchType | null;
  private _target: string;
  private _parentTarget: string | null;
  private _separator: string; // multiple value separator
  private _id: number;
  private _accessor: number;
  private _accessor1: number;
  private _accessor2: number;
  private _numTargets: number;

  valueType: ValueType;
  usedAsXDataset: boolean;

  //#region Properties

  public get type() {
    return this._type;
  }

  public get target() {
    return this._target;
  }

  public get parentTarget() {
    return this._parentTarget;
  }

  public get id() {
    return this._id;
  }

  public get numTargets() {
    return this._numTargets;
  }

  get separator(): string {
    return this._separator;
  }

  set separator(value: string) {
    this._separator = value;
  }

  // #endregion

  public equalTo(other: Query): boolean {
    if (this._type === other._type && this._target === other._target) {
      return true;
    }
    return false;
  }

  public getAccessor(index = 0) {
    switch (index) {
      case 0:
        return this._accessor;
      case 1:
        return this._accessor1;
      case 2:
        return this._accessor2;
    }

    return null;
  }

  public getSeparator(isForFrontmatterTags: boolean = false) {
    return this.separator === ''
      ? isForFrontmatterTags
        ? ','
        : '/'
      : this._separator;
  }

  public incrementTargetCount(num: number = 1) {
    this._numTargets = this._numTargets + num;
  }
}
