import { SearchType, ValueType } from './enums';

export class Query {
  private type: SearchType | null;
  private target: string;
  private parentTarget: string | null;
  private separator: string; // multiple value separator
  private id: number;
  private accessor: number;
  private accessor1: number;
  private accessor2: number;
  private numTargets: number;

  valueType: ValueType;
  usedAsXDataset: boolean;

  constructor(id: number, searchType: SearchType, searchTarget: string) {
    this.type = searchType;
    this.target = searchTarget;
    this.separator = ''; // separator to separate multiple values
    this.id = id;
    this.accessor = -1;
    this.accessor1 = -1;
    this.accessor2 = -1;
    this.valueType = ValueType.Number;
    this.usedAsXDataset = false;
    this.numTargets = 0;

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

                this.accessor = accessor;
                this.accessor1 = accessor1;
                if (Number.isNumber(accessor2)) {
                  this.accessor2 = accessor2;
                }
                this.parentTarget = searchTarget.replace(regex, '');
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
            this.accessor = accessor;
            this.parentTarget = searchTarget.replace(regex, '');
          }
          break;
        }
      }
    }
  }

  public equalTo(other: Query): boolean {
    if (this.type === other.type && this.target === other.target) {
      return true;
    }
    return false;
  }

  public getType() {
    return this.type;
  }

  public getTarget() {
    return this.target;
  }

  public getParentTarget() {
    return this.parentTarget;
  }

  public getId() {
    return this.id;
  }

  public getAccessor(index = 0) {
    switch (index) {
      case 0:
        return this.accessor;
      case 1:
        return this.accessor1;
      case 2:
        return this.accessor2;
    }

    return null;
  }

  public setSeparator(sep: string) {
    this.separator = sep;
  }

  public getSeparator(isForFrontmatterTags: boolean = false) {
    if (this.separator === '') {
      if (isForFrontmatterTags) {
        return ',';
      }
      return '/';
    }
    return this.separator;
  }

  public addNumTargets(num: number = 1) {
    this.numTargets = this.numTargets + num;
  }

  public getNumTargets() {
    return this.numTargets;
  }
}
