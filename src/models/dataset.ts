import { DataPoint } from './data-point.model';
import { ValueType } from './enums';
import { Query } from './query';
import { RenderInfo } from './render-info';
import Moment = moment.Moment;

export class Dataset implements IterableIterator<DataPoint> {
  constructor(
    readonly collection: DatasetCollection,
    readonly query: Query
  ) {
    this.id = -1;
    this.name = 'untitled';
    this._values = [];
    this._yMin = null;
    this._yMax = null;
    this._startDate = null;
    this._endDate = null;
    this._targetCount = 0;
    this._isClone = false;
    this.valueType = query?.valueType;
    collection.dates.forEach(() => this._values.push(null));
  }

  private _values: number[];
  private _yMin: number;
  private _yMax: number;
  private _startDate: Moment;
  private _endDate: Moment;
  private _targetCount: number;
  private _isClone: boolean;

  // #region Properties

  id: number;
  name: string;
  valueType: ValueType;

  get targetCount() {
    return this._targetCount;
  }

  get yMin() {
    return this._yMin;
  }

  get yMax() {
    return this._yMax;
  }

  get startDate() {
    return this._startDate;
  }

  get endDate() {
    return this._endDate;
  }

  get values() {
    return this._values;
  }

  get nonNullValueCount() {
    return this.values.filter((value) => value !== null).length;
  }

  // #endregion
  // #region Methods

  clone() {
    if (!this._isClone) {
      const cloned = new Dataset(this.collection, null);
      cloned.name = 'tmp';
      cloned._values = [...this.values];
      cloned._yMin = this.yMin;
      cloned._yMax = this.yMax;
      cloned._startDate = this.startDate.clone();
      cloned._endDate = this.endDate.clone();
      cloned._targetCount = this.targetCount;
      cloned._isClone = true;
      cloned.valueType = this.valueType;
      return cloned;
    }
    return this; // already tmp dataset
  }

  incrementTargetCount = (num: number) =>
    (this._targetCount = this._targetCount + num);

  getValue = (date: Moment, dayShift: number = 0) => {
    const index = this.collection.getIndexOfDate(date) + Math.floor(dayShift);
    return index >= 0 && index < this._values.length
      ? this._values[index]
      : null;
  };

  setValue = (date: Moment, value: number) => {
    const index = this.collection.getIndexOfDate(date);
    if (index >= 0 && index < this._values.length) {
      // Set value
      this._values[index] = value;

      // Update yMin and yMax
      if (this._yMin === null || value < this._yMin) this._yMin = value;
      if (this._yMax === null || value > this._yMax) this._yMax = value;

      // Update start & end date
      if (this._startDate === null || date < this._startDate)
        this._startDate = date.clone();
      if (this._endDate === null || date > this._endDate)
        this._endDate = date.clone();
    }
  };

  recalculateYMinMax = () => {
    this._yMin = Math.min(...this._values);
    this._yMax = Math.max(...this._values);
  };

  /**
   * @summary Shift the values in the dataset and set the y-axis min/max
   * @param shiftAmount The amount to shift the values
   * @param threshold Only shift values larger than this value
   */
  shiftValues = (shiftAmount: number, threshold: number): void => {
    let anyShifted = false;
    for (let ind = 0; ind < this._values.length; ind++) {
      if (this._values[ind] !== null) {
        if (threshold === null) {
          this._values[ind] = this._values[ind] + shiftAmount;
          anyShifted = true;
        } else if (this._values[ind] >= threshold) {
          this._values[ind] = this._values[ind] + shiftAmount;
          anyShifted = true;
        }
      }
    }
    if (anyShifted) {
      this._yMin = this._yMin + shiftAmount;
      this._yMax = this._yMax + shiftAmount;
    }
  };

  setYPenalty = (penalty: number): void =>
    this.values.forEach((value, index) => {
      if (value === null) {
        this.values[index] = penalty;
        if (penalty < this._yMin) this._yMin = penalty;
        if (penalty > this._yMax) this._yMax = penalty;
      }
    });

  accumulateValues = () => {
    let accumValue = 0;
    this.values.forEach((value, index) => {
      if (value !== null) accumValue += value;
      this._values[index] = accumValue;
      if (accumValue < this._yMin) this._yMin = accumValue;
      if (accumValue > this._yMax) this._yMax = accumValue;
    });
  };

  // #endregion
  // #region IterableIterator

  private _currentIndex = 0;
  next(): IteratorResult<DataPoint> {
    if (this._currentIndex < this._values.length) {
      const ind = this._currentIndex++;
      const dataPoint = new DataPoint(
        this.collection.dates[ind],
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

  // #endregion
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

  public add(query: Query, renderInfo: RenderInfo): Dataset {
    const ds = new Dataset(this, query);
    ds.id = query.id;
    if (renderInfo) ds.name = renderInfo.datasetName[ds.id];
    this._datasets.push(ds);
    return ds;
  }

  public getIndexOfDate(date: Moment) {
    const cData = date.creationData();
    const dateFormat = cData.format.toString();
    for (let ind = 0; ind < this._dates.length; ind++) {
      if (this._dates[ind].format(dateFormat) === date.format(dateFormat))
        return ind;
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
        if (!ids.includes(id) && id !== -1) ids.push(id);
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
