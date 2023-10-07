import { Moment } from 'moment';
import { TMoment, getMoment } from '../utils/date-time.utils';

export class ProcessInfo {
  fileTotal: number; // total number of files
  fileAvailable: number; // total available count
  fileOutOfDateRange: number;
  fileNotInFormat: number;
  errorMessage: string;
  minDate: Moment;
  maxDate: Moment;
  gotAnyValidXValue: boolean;
  gotAnyValidYValue: boolean;

  constructor(moment?: TMoment) {
    this.fileTotal = 0;
    this.fileAvailable = 0;
    this.fileOutOfDateRange = 0;
    this.fileNotInFormat = 0;
    this.errorMessage = '';
    this.minDate = getMoment(moment)(''); // invalid date
    this.maxDate = getMoment(moment)(''); // invalid date
    this.gotAnyValidXValue = false;
    this.gotAnyValidYValue = false;
  }
}
