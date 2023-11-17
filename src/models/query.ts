import { AllAccessorsPattern, FirstAccessorPattern } from '../regex-patterns';
import { SearchType, ValueType } from './enums';

export class Query {
  constructor(
    readonly id: number,
    readonly type: SearchType,
    readonly target: string
  ) {
    this._separator = ''; // separator for multiple values
    this.valueType = ValueType.Number;
    this.usedAsXDataset = false;
    this._numTargets = 0;
    this.accessors = new Array(...[-1, -1, -1]);

    if (type === SearchType.Table) {
      // searchTarget --> {{filePath}}[{{table}}][{{column}}]
      const regex = new RegExp(AllAccessorsPattern, 'gm');
      let match;
      while ((match = regex.exec(target))) {
        if (typeof match.groups.accessor !== 'undefined') {
          const accessor0 = parseFloat(match.groups.accessor);
          if (Number.isNumber(accessor0)) {
            if (typeof match.groups.accessor1 !== 'undefined') {
              const accessor1 = parseFloat(match.groups.accessor1);
              if (Number.isNumber(accessor1)) {
                if (typeof match.groups.accessor2 !== 'undefined') {
                  const accessor2 = parseFloat(match.groups.accessor2);
                  if (Number.isNumber(accessor2)) this.accessors[2] = accessor2;
                }
                this.accessors[0] = accessor0;
                this.accessors[1] = accessor1;
                this._parentTarget = target.replace(regex, '');
              }
              break;
            }
          }
        }
      }
    } else {
      const regex = new RegExp(FirstAccessorPattern, 'gm');
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
  private _numTargets: number;

  //#region Properties

  readonly accessors: number[];

  valueType: ValueType;
  usedAsXDataset: boolean;

  public get parentTarget() {
    return this._parentTarget;
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
  // #region Methods

  public equalTo = (other: Query): boolean =>
    this.type === other.type && this.target === other.target ? true : false;

  public getSeparator = (isForFrontmatterTags: boolean = false) =>
    this.separator === ''
      ? isForFrontmatterTags
        ? ','
        : '/'
      : this._separator;

  public incrementTargetCount = (num: number = 1) =>
    (this._numTargets = this._numTargets + num);

  // #endregion
}
