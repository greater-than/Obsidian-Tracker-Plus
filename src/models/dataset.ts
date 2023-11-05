import Moment = moment.Moment;
import { DataPoint } from './data-point.model';
import { ValueType } from './enums';
import { Query } from './query';
import { RenderInfo } from './render-info';

export class Dataset implements IterableIterator<DataPoint> {
  constructor(parent: DatasetCollection, query: Query) {
    this._parent = parent;
    this._query = query;

    this._name = 'untitled';
    this._values = [];
    this._id = -1;
    this._yMin = null;
    this._yMax = null;
    this._startDate = null;
    this._endDate = null;
    this._numTargets = 0;
    this._isClone = false;
    this.valueType = query?.valueType;

    for (let ind = 0; ind < parent.dates.length; ind++) {
      this._values.push(null);
    }
  }

  // Array of DataPoints
  private _name: string;
  private _query: Query;
  private _values: number[];
  private _parent: DatasetCollection;
  private _id: number;
  private _yMin: number;
  private _yMax: number;
  private _startDate: Moment;
  private _endDate: Moment;
  private _numTargets: number;
  private _isClone: boolean;

  // IterableIterator
  private _currentIndex = 0;

  valueType: ValueType;

  public clone() {
    if (!this._isClone) {
      const tmpDataset = new Dataset(this._parent, null);
      tmpDataset._name = 'tmp';
      tmpDataset._values = [...this._values];
      tmpDataset._yMin = this._yMin;
      tmpDataset._yMax = this._yMax;
      tmpDataset._startDate = this._startDate.clone();
      tmpDataset._endDate = this._endDate.clone();
      tmpDataset._numTargets = this._numTargets;
      tmpDataset._isClone = true;
      tmpDataset.valueType = this.valueType;
      return tmpDataset;
    }
    return this; // already tmp dataset
  }

  // #region Properties
  public get name() {
    return this._name;
  }

  public set name(name: string) {
    this._name = name;
  }

  public get id() {
    return this._id;
  }

  public set id(id: number) {
    this._id = id;
  }

  public get targetCount() {
    return this._numTargets;
  }

  public get yMin() {
    return this._yMin;
  }

  public get yMax() {
    return this._yMax;
  }

  public get startDate() {
    return this._startDate;
  }

  public get endDate() {
    return this._endDate;
  }

  public get query(): Query {
    return this._query;
  }

  public get values() {
    return this._values;
  }

  // #endregion

  public incrementTargetCount(num: number) {
    this._numTargets = this._numTargets + num;
  }

  public getValue(date: Moment, dayShift: number = 0) {
    const ind = this._parent.getIndexOfDate(date) + Math.floor(dayShift);
    if (ind >= 0 && ind < this._values.length) {
      return this._values[ind];
    }
    return null;
  }

  public setValue(date: Moment, value: number) {
    const ind = this._parent.getIndexOfDate(date);
    // console.log(ind);
    if (ind >= 0 && ind < this._values.length) {
      // Set value
      this._values[ind] = value;

      // Update yMin and yMax
      if (this._yMin === null || value < this._yMin) {
        this._yMin = value;
      }
      if (this._yMax === null || value > this._yMax) {
        this._yMax = value;
      }

      // Update startDate and endDate
      if (this._startDate === null || date < this._startDate) {
        this._startDate = date.clone();
      }
      if (this._endDate === null || date > this._endDate) {
        this._endDate = date.clone();
      }
    }
  }

  public recalculateYMinMax() {
    this._yMin = Math.min(...this._values);
    this._yMax = Math.max(...this._values);
  }

  public shiftYValues(shiftAmount: number, threshold: number) {
    let anyShifted = false;
    for (let ind = 0; ind < this._values.length; ind++) {
      if (this._values[ind] !== null) {
        if (threshold === null) {
          this._values[ind] = this._values[ind] + shiftAmount;
          anyShifted = true;
        } else {
          if (this._values[ind] >= threshold) {
            this._values[ind] = this._values[ind] + shiftAmount;
            anyShifted = true;
          }
        }
      }
    }
    if (anyShifted) {
      this._yMin = this._yMin + shiftAmount;
      this._yMax = this._yMax + shiftAmount;
    }
  }

  public setYPenalty(penalty: number) {
    for (let ind = 0; ind < this._values.length; ind++) {
      if (this._values[ind] === null) {
        this._values[ind] = penalty;
        if (penalty < this._yMin) {
          this._yMin = penalty;
        }
        if (penalty > this._yMax) {
          this._yMax = penalty;
        }
      }
    }
  }

  public accumulateValues() {
    let accumValue = 0;
    for (let ind = 0; ind < this._values.length; ind++) {
      if (this._values[ind] !== null) {
        accumValue += this._values[ind];
      }
      this._values[ind] = accumValue;
      if (accumValue < this._yMin) {
        this._yMin = accumValue;
      }
      if (accumValue > this._yMax) {
        this._yMax = accumValue;
      }
    }
  }

  public get nonNullValueCount() {
    let countNotNull = 0;
    for (let ind = 0; ind < this._values.length; ind++) {
      if (this._values[ind] !== null) {
        countNotNull++;
      }
    }
    return countNotNull;
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
      return { done: true, value: null };
    }
  }

  [Symbol.iterator](): IterableIterator<DataPoint> {
    return this;
  }
}
export class DatasetCollection implements IterableIterator<Dataset> {
  constructor(startDate: Moment, endDate: Moment) {
    this._dates = [];
    this._datasets = [];

    const cData = startDate.creationData();
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
  }

  // Iterable of Dataset
  private _dates: Moment[];
  private _datasets: Dataset[];

  // IterableIterator
  private _currentIndex = 0;

  public get dates() {
    return this._dates;
  }

  public get names() {
    const names = [];
    for (const dataset of this._datasets) {
      names.push(dataset.name);
    }
    return names;
  }

  public createDataset(query: Query, renderInfo: RenderInfo) {
    const dataset = new Dataset(this, query);
    dataset.id = query.id;
    if (renderInfo) {
      dataset.name = renderInfo.datasetName[query.id];
    }

    this._datasets.push(dataset);

    return dataset;
  }

  public getIndexOfDate(date: Moment) {
    const cData = date.creationData();
    const dateFormat = cData.format.toString();
    for (let ind = 0; ind < this._dates.length; ind++) {
      if (this._dates[ind].format(dateFormat) === date.format(dateFormat)) {
        return ind;
      }
    }
    return -1;
  }

  public getDatasetByQuery(query: Query) {
    for (const dataset of this._datasets) {
      if (dataset.query.equalTo(query)) {
        return dataset;
      }
    }
    return null;
  }

  public getDatasetById(id: number) {
    for (const dataset of this._datasets) {
      if (dataset.id === id) {
        return dataset;
      }
    }

    return null;
  }

  public getXDatasetIds() {
    const ids: Array<number> = [];
    for (const dataset of this._datasets) {
      if (dataset.query.usedAsXDataset) {
        const id = dataset.query.id;
        if (!ids.includes(id) && id !== -1) {
          ids.push(id);
        }
      }
    }
    return ids;
  }

  next(): IteratorResult<Dataset> {
    if (this._currentIndex < this._datasets.length) {
      return {
        done: false,
        value: this._datasets[this._currentIndex++],
      };
    } else {
      this._currentIndex = 0;
      return {
        done: true,
        value: null,
      };
    }
  }

  [Symbol.iterator](): IterableIterator<Dataset> {
    return this;
  }
}
