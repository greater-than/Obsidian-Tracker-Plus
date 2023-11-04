import Moment = moment.Moment;

export class DataPoint {
  date: Moment;
  value: number;

  constructor(date: Moment, value: number) {
    this.date = date;
    this.value = value;
  }
}
