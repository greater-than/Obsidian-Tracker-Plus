// This is hacky
// eslint-disable-next-line @typescript-eslint/no-var-requires
const moment = require('moment');

import {
  getDateStringFromInputString,
  stringToDate,
} from '../../../src/utils/date-time.utils';

describe('DateTime Utils', () => {
  describe('getDateStringFromInputString', () => {
    it('should do something', () => {
      expect(getDateStringFromInputString('a2023-10-04z', 'a', 'z')).toEqual(
        '2023-10-04'
      );
    });
  });

  describe('stringToDate', () => {
    it('should return a Moment', () => {
      const m = moment;
      let result = stringToDate('2023-10-04', 'YYYY-MM-DD', m).toISOString();
      expect(result.startsWith('2023-10-04')).toEqual(true);
      result = stringToDate('2023-10-04', 'iso-8601', m).toISOString();
      expect(result.startsWith('2023-10-04')).toEqual(true);
    });
  });

  // describe('extractValueFromDurationString', () => {
  //   it('should do something', () => {
  //     expect(extractValueFromDurationString('a2023-10-04z', 'a', 'z')).toEqual(
  //       '2023-10-04'
  //     );
  //   });
  // });

  // describe('parseDuration', () => {
  //   it('should do something', () => {
  //     expect(parseDuration('a2023-10-04z', 'a', 'z')).toEqual('2023-10-04');
  //   });
  // });

  // describe('getDateByDurationToToday', () => {
  //   it('should do something', () => {
  //     expect(getDateByDurationToToday('a2023-10-04z', 'a', 'z')).toEqual(
  //       '2023-10-04'
  //     );
  //   });
  // });

  // describe('dateToString', () => {
  //   it('should do something', () => {
  //     expect(dateToString('a2023-10-04z', 'a', 'z')).toEqual('2023-10-04');
  //   });
  // });

  // describe('getDateFromUnixTime', () => {
  //   it('should do something', () => {
  //     expect(getDateFromUnixTime('a2023-10-04z', 'a', 'z')).toEqual(
  //       '2023-10-04'
  //     );
  //   });
  // });

  // describe('getDateToday', () => {
  //   it('should do something', () => {
  //     expect(getDateToday('a2023-10-04z', 'a', 'z')).toEqual('2023-10-04');
  //   });
  // });
});
