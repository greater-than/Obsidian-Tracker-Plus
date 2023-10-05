import { DataPoint } from './data-point';
import { ValueType } from './enums';
import { Query } from './query';
import { RenderInfo } from './render-info';
import Moment = moment.Moment;

export class Dataset implements IterableIterator<DataPoint> {
  constructor(parent: Datasets, query: Query) {
    this._name = 'untitled';
    this._parent = parent;
    this._query = query;
    this._values = [];
    this._id = -1;
    this._yMin = null;
    this._yMax = null;
    this._startDate = null;
    this._endDate = null;
    this._numTargets = 0;
    this._isTmpDataset = false;
    this.valueType = query?.valueType;

    parent?.dates.forEach(() => this._values.push(null));
  }

  private _parent: Datasets;
  private _name: string;
  private _query: Query;
  private _values: number[];
  private _id: number;
  private _yMin: number;
  private _yMax: number;
  private _startDate: Moment;
  private _endDate: Moment;
  private _numTargets: number;
  private _isTmpDataset: boolean;

  valueType: ValueType;

  private _currentIndex = 0; // IterableIterator

  public get name(): string {
    return this._name;
  }

  public set name(name: string) {
    this._name = name;
  }

  public get id(): number {
    return this._id;
  }

  public set id(id: number) {
    this._id = id;
  }

  public get numTargets(): number {
    return this._numTargets;
  }

  public get yMin(): number {
    return this._yMin;
  }

  public get yMax(): number {
    return this._yMax;
  }

  public get startDate(): Moment {
    return this._startDate;
  }

  public get endDate(): Moment {
    return this._endDate;
  }

  public get query(): Query {
    return this._query;
  }

  public get values(): number[] {
    return this._values;
  }

  public get nonNullValueCount(): number {
    return this.values.filter((value) => value !== null).length;
  }

  public addNumTargets(num: number) {
    this._numTargets += num;
  }

  public cloneToTmpDataset() {
    if (!this._isTmpDataset) {
      const tmpDataset = new Dataset(this._parent, null);
      tmpDataset._name = 'tmp';
      tmpDataset._values = [...this._values];
      tmpDataset._yMin = this._yMin;
      tmpDataset._yMax = this._yMax;
      tmpDataset._startDate = this._startDate.clone();
      tmpDataset._endDate = this._endDate.clone();
      tmpDataset._numTargets = this._numTargets;
      tmpDataset._isTmpDataset = true;
      tmpDataset.valueType = this.valueType;
      return tmpDataset;
    }
    return this; // already tmp dataset
  }

  public getValue(date: Moment, dayShift: number = 0): number {
    const index = this._parent.getIndexOfDate(date) + Math.floor(dayShift);
    return index >= 0 && index < this._values.length
      ? this._values[index]
      : null;
  }

  public setValue(date: Moment, value: number): void {
    const index = this._parent.getIndexOfDate(date);
    // console.log(index);

    if (index <= 0 || index >= this.values.length) return;

    // if (ind >= 0 && ind < this._values.length) {
    // Set value
    this._values[index] = value;

    // Update yMin and yMax
    if (this._yMin === null || value < this._yMin) this._yMin = value;
    if (this._yMax === null || value > this._yMax) this._yMax = value;

    // Update startDate and endDate
    if (this._startDate === null || date < this._startDate)
      this._startDate = date.clone();
    if (this._endDate === null || date > this._endDate)
      this._endDate = date.clone();
    // }
  }

  public recalculateMinMax(): void {
    this._yMin = Math.min(...this._values);
    this._yMax = Math.max(...this._values);
  }

  public shiftValues(shiftAmount: number, doLargerThan: number): void {
    this.values.forEach((value) => {
      if (value === null) return;
      if (doLargerThan === null || value >= doLargerThan) {
        value += shiftAmount;
        this._yMin = this._yMin + shiftAmount;
        this._yMax = this._yMax + shiftAmount;
      }
    });

    // for (let ind = 0; ind < this._values.length; ind++) {
    //   if (this._values[ind] !== null) {
    //     if (doLargerThan === null) {
    //       this._values[ind] = this._values[ind] + shiftAmount;
    //       anyShifted = true;
    //     } else {
    //       if (this._values[ind] >= doLargerThan) {
    //         this._values[ind] = this._values[ind] + shiftAmount;
    //         anyShifted = true;
    //       }
    //     }
    //   }
    // }
  }

  public setPenalty(penalty: number): void {
    this.values.forEach((value) => {
      if (value === null) {
        value = penalty;
        if (penalty < this._yMin) this._yMin = penalty;
        if (penalty > this._yMax) this._yMax = penalty;
      }
    });
    // for (let ind = 0; ind < this._values.length; ind++) {
    //   if (this._values[ind] === null) {
    //     this._values[ind] = penalty;
    //     if (penalty < this._yMin) this._yMin = penalty;
    //     if (penalty > this._yMax) this._yMax = penalty;
    //   }
    // }
  }

  public accumulateValues(): void {
    let accumValue = 0;

    this.values?.forEach((value) => {
      if (value !== null) accumValue += value;
      value = accumValue;
      if (value < this._yMin) this._yMin = value;
      if (value > this._yMax) this._yMax = value;
    });

    // for (let ind = 0; ind < this._values.length; ind++) {
    //   if (this._values[ind] !== null) accumValue += this._values[ind];

    //   this._values[ind] = accumValue;
    //   if (accumValue < this._yMin) this._yMin = accumValue;

    //   if (accumValue > this._yMax) this._yMax = accumValue;
    // }
  }

  next(): IteratorResult<DataPoint> {
    if (this._currentIndex < this._values.length) {
      const ind = this._currentIndex++;
      const dataPoint = new DataPoint(
        this._parent.dates[ind],
        this._values[ind]
      );
      return {
        done: false,
        value: dataPoint,
      };
    } else {
      this._currentIndex = 0;
      return {
        done: true,
        value: null,
      };
    }
  }

  [Symbol.iterator](): IterableIterator<DataPoint> {
    return this;
  }
}

export class Datasets implements IterableIterator<Dataset> {
  constructor(startDate: Moment, endDate: Moment) {
    this._dates = [];
    this._datasets = [];

    const cData = startDate.creationData();
    // console.log(cData);
    const dateFormat = cData.format.toString();
    for (
      let curDate = startDate.clone();
      curDate <= endDate;
      curDate.add(1, 'days')
    ) {
      const newDate = window.moment(
        curDate.format(dateFormat),
        dateFormat,
        true
      );
      this._dates.push(newDate);
    }
    // console.log(this.dates);
  }

  private _dates: Moment[];
  private _datasets: Dataset[];

  private _currentIndex = 0; // IterableIterator

  public get dates() {
    return this._dates;
  }

  public get names() {
    return this._datasets.map((ds) => ds.name);
  }

  public createDataset(query: Query, renderInfo: RenderInfo): Dataset {
    const dataset = new Dataset(this, query);
    dataset.id = query.id;
    if (renderInfo) dataset.name = renderInfo.datasetName[query.id];
    this._datasets.push(dataset);
    return dataset;
  }

  public getIndexOfDate(date: Moment): number {
    const cData = date.creationData();
    const dateFormat = cData.format.toString();
    for (let ind = 0; ind < this._dates.length; ind++) {
      if (this._dates[ind].format(dateFormat) === date.format(dateFormat)) {
        return ind;
      }
    }
    return -1;
  }

  public getDatasetByQuery(query: Query): Dataset {
    for (const dataset of this._datasets) {
      if (dataset.query.equalTo(query)) {
        return dataset;
      }
    }
    return null;
  }

  public getDataset(id: number): Dataset {
    return this._datasets.filter((ds) => ds.id === id)[0];
  }

  public getXDatasetIds(): number[] {
    const ids: Array<number> = [];
    for (const dataset of this._datasets) {
      if (dataset.query.usedAsXDataset) {
        const id = dataset.query.id;
        if (!ids.includes(id) && id !== -1) {
          ids.push(id);
        }
      }
    }
    return this._datasets.map((ds) => {
      if (ds.query.usedAsXDataset) {
        const id = ds.query.id;
        if (!ids.includes(id) && id !== -1) {
          return id;
        }
      }
    });
  }

  next(): IteratorResult<Dataset> {
    if (this._currentIndex < this._datasets.length) {
      return {
        done: false,
        value: this._datasets[this._currentIndex++],
      };
    }
    this._currentIndex = 0;
    return { done: true, value: null };
  }

  [Symbol.iterator](): IterableIterator<Dataset> {
    return this;
  }
}
