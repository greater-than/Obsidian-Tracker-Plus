import Moment = moment.Moment;
import { DataPoint } from './data-point.model';
import { ValueType } from './enums';
import { Query } from './query';
import { RenderInfo } from './render-info';

export class Dataset implements IterableIterator<DataPoint> {
  constructor(parent: DatasetCollection, query: Query) {
    this.name = 'untitled';
    this.query = query;
    this.values = [];
    this.parent = parent;
    this.id = -1;
    this.yMin = null;
    this.yMax = null;
    this.startDate = null;
    this.endDate = null;
    this.numTargets = 0;

    this.isTmpDataset = false;

    this.valueType = query?.valueType;

    for (let ind = 0; ind < parent.getDates().length; ind++) {
      this.values.push(null);
    }
  }

  // Array of DataPoints
  private name: string;
  private query: Query;
  private values: number[];
  private parent: DatasetCollection;
  private id: number;
  private yMin: number;
  private yMax: number;
  private startDate: Moment;
  private endDate: Moment;
  private numTargets: number;

  private isTmpDataset: boolean;

  valueType: ValueType;

  private currentIndex = 0; // IterableIterator

  public clone() {
    if (!this.isTmpDataset) {
      const tmpDataset = new Dataset(this.parent, null);
      tmpDataset.name = 'tmp';
      tmpDataset.values = [...this.values];
      tmpDataset.yMin = this.yMin;
      tmpDataset.yMax = this.yMax;
      tmpDataset.startDate = this.startDate.clone();
      tmpDataset.endDate = this.endDate.clone();
      tmpDataset.numTargets = this.numTargets;
      tmpDataset.isTmpDataset = true;
      tmpDataset.valueType = this.valueType;
      return tmpDataset;
    }
    return this; // already tmp dataset
  }

  public getName() {
    return this.name;
  }

  public setName(name: string) {
    this.name = name;
  }

  public getId() {
    return this.id;
  }

  public setId(id: number) {
    this.id = id;
  }

  public addNumTargets(num: number) {
    this.numTargets = this.numTargets + num;
  }

  public getNumTargets() {
    return this.numTargets;
  }

  public getValue(date: Moment, dayShift: number = 0) {
    const ind = this.parent.getIndexOfDate(date) + Math.floor(dayShift);
    if (ind >= 0 && ind < this.values.length) {
      return this.values[ind];
    }
    return null;
  }

  public setValue(date: Moment, value: number) {
    const ind = this.parent.getIndexOfDate(date);
    // console.log(ind);
    if (ind >= 0 && ind < this.values.length) {
      // Set value
      this.values[ind] = value;

      // Update yMin and yMax
      if (this.yMin === null || value < this.yMin) {
        this.yMin = value;
      }
      if (this.yMax === null || value > this.yMax) {
        this.yMax = value;
      }

      // Update startDate and endDate
      if (this.startDate === null || date < this.startDate) {
        this.startDate = date.clone();
      }
      if (this.endDate === null || date > this.endDate) {
        this.endDate = date.clone();
      }
    }
  }

  public recalculateYMinMax() {
    this.yMin = Math.min(...this.values);
    this.yMax = Math.max(...this.values);
  }

  public getYMin() {
    return this.yMin;
  }

  public getYMax() {
    return this.yMax;
  }

  public getStartDate() {
    return this.startDate;
  }

  public getEndDate() {
    return this.endDate;
  }

  public shift(shiftAmount: number, doLargerThan: number) {
    let anyShifted = false;
    for (let ind = 0; ind < this.values.length; ind++) {
      if (this.values[ind] !== null) {
        if (doLargerThan === null) {
          this.values[ind] = this.values[ind] + shiftAmount;
          anyShifted = true;
        } else {
          if (this.values[ind] >= doLargerThan) {
            this.values[ind] = this.values[ind] + shiftAmount;
            anyShifted = true;
          }
        }
      }
    }
    if (anyShifted) {
      this.yMin = this.yMin + shiftAmount;
      this.yMax = this.yMax + shiftAmount;
    }
  }

  public setPenalty(penalty: number) {
    for (let ind = 0; ind < this.values.length; ind++) {
      if (this.values[ind] === null) {
        this.values[ind] = penalty;
        if (penalty < this.yMin) {
          this.yMin = penalty;
        }
        if (penalty > this.yMax) {
          this.yMax = penalty;
        }
      }
    }
  }

  public getQuery(): Query {
    return this.query;
  }

  public accumulateValues() {
    let accumValue = 0;
    for (let ind = 0; ind < this.values.length; ind++) {
      if (this.values[ind] !== null) {
        accumValue += this.values[ind];
      }
      this.values[ind] = accumValue;
      if (accumValue < this.yMin) {
        this.yMin = accumValue;
      }
      if (accumValue > this.yMax) {
        this.yMax = accumValue;
      }
    }
  }

  public getValues() {
    return this.values;
  }

  public getLength() {
    return this.values.length;
  }

  public getLengthNotNull() {
    let countNotNull = 0;
    for (let ind = 0; ind < this.values.length; ind++) {
      if (this.values[ind] !== null) {
        countNotNull++;
      }
    }
    return countNotNull;
  }

  next(): IteratorResult<DataPoint> {
    if (this.currentIndex < this.values.length) {
      const ind = this.currentIndex++;
      const dataPoint = new DataPoint(
        this.parent.getDates()[ind],
        this.values[ind]
      );
      return {
        done: false,
        value: dataPoint,
      };
    } else {
      this.currentIndex = 0;
      return { done: true, value: null };
    }
  }

  [Symbol.iterator](): IterableIterator<DataPoint> {
    return this;
  }
}
export class DatasetCollection implements IterableIterator<Dataset> {
  constructor(startDate: Moment, endDate: Moment) {
    this.dates = [];
    this.datasets = [];

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
      this.dates.push(newDate);
    }
    // console.log(this.dates);
  }

  // Iterable of Dataset
  private dates: Moment[];
  private datasets: Dataset[];

  private currentIndex = 0; // IterableIterator

  public createDataset(query: Query, renderInfo: RenderInfo) {
    const dataset = new Dataset(this, query);
    dataset.setId(query.getId());
    if (renderInfo) {
      dataset.setName(renderInfo.datasetName[query.getId()]);
    }

    this.datasets.push(dataset);

    return dataset;
  }

  public getIndexOfDate(date: Moment) {
    const cData = date.creationData();
    const dateFormat = cData.format.toString();
    for (let ind = 0; ind < this.dates.length; ind++) {
      if (this.dates[ind].format(dateFormat) === date.format(dateFormat)) {
        return ind;
      }
    }
    return -1;
  }

  public getDatasetByQuery(query: Query) {
    for (const dataset of this.datasets) {
      if (dataset.getQuery().equalTo(query)) {
        return dataset;
      }
    }
    return null;
  }

  public getDatasetById(id: number) {
    for (const dataset of this.datasets) {
      if (dataset.getId() === id) {
        return dataset;
      }
    }

    return null;
  }

  public getXDatasetIds() {
    const ids: Array<number> = [];
    for (const dataset of this.datasets) {
      if (dataset.getQuery().usedAsXDataset) {
        const id = dataset.getQuery().getId();
        if (!ids.includes(id) && id !== -1) {
          ids.push(id);
        }
      }
    }
    return ids;
  }

  public getDates() {
    return this.dates;
  }

  public getNames() {
    const names = [];
    for (const dataset of this.datasets) {
      names.push(dataset.getName());
    }
    return names;
  }

  next(): IteratorResult<Dataset> {
    if (this.currentIndex < this.datasets.length) {
      return {
        done: false,
        value: this.datasets[this.currentIndex++],
      };
    } else {
      this.currentIndex = 0;
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
