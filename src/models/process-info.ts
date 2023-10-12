import { Moment } from 'moment';

export class ProcessInfo {
  fileTotal: number; // total number of files
  fileAvailable: number; // total available count
  fileOutOfDateRange: number;
  fileNotInFormat: number;
  minDate: Moment;
  maxDate: Moment;
  gotAnyValidXValue: boolean;
  gotAnyValidYValue: boolean;

  constructor() {
    this.fileTotal = 0;
    this.fileAvailable = 0;
    this.fileOutOfDateRange = 0;
    this.fileNotInFormat = 0;
    this.minDate = window.moment(''); // invalid date
    this.maxDate = window.moment(''); // invalid date
    this.gotAnyValidXValue = false;
    this.gotAnyValidYValue = false;
  }
}
