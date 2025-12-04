import { describe, it, expect, beforeEach } from 'vitest';
import { getStartOfWeek, getWeekId, dayOfWeekToNumber } from './week-utils';
import { DayOfWeek } from './storage.service';

describe('week-utils', () => {
  describe('getStartOfWeek', () => {
    let timestamp: number;
    let weekStartsOn: number;
    let result: number;
    const action = () => (result = getStartOfWeek(timestamp, weekStartsOn));

    describe('with weekStartsOn Sunday (0)', () => {
      beforeEach(() => (weekStartsOn = 0));

      describe('when timestamp is Sunday', () => {
        beforeEach(() => (timestamp = new Date('2024-01-07T12:00:00').getTime()));
        beforeEach(action);
        it('should return start of that Sunday', () => {
          const expected = new Date('2024-01-07T00:00:00').getTime();
          expect(result).toBe(expected);
        });
      });

      describe('when timestamp is Monday', () => {
        beforeEach(() => (timestamp = new Date('2024-01-08T12:00:00').getTime()));
        beforeEach(action);
        it('should return previous Sunday', () => {
          const expected = new Date('2024-01-07T00:00:00').getTime();
          expect(result).toBe(expected);
        });
      });

      describe('when timestamp is Saturday', () => {
        beforeEach(() => (timestamp = new Date('2024-01-13T12:00:00').getTime()));
        beforeEach(action);
        it('should return previous Sunday', () => {
          const expected = new Date('2024-01-07T00:00:00').getTime();
          expect(result).toBe(expected);
        });
      });
    });

    describe('with weekStartsOn Monday (1)', () => {
      beforeEach(() => (weekStartsOn = 1));

      describe('when timestamp is Monday', () => {
        beforeEach(() => (timestamp = new Date('2024-01-08T12:00:00').getTime()));
        beforeEach(action);
        it('should return start of that Monday', () => {
          const expected = new Date('2024-01-08T00:00:00').getTime();
          expect(result).toBe(expected);
        });
      });

      describe('when timestamp is Sunday', () => {
        beforeEach(() => (timestamp = new Date('2024-01-07T12:00:00').getTime()));
        beforeEach(action);
        it('should return previous Monday', () => {
          const expected = new Date('2024-01-01T00:00:00').getTime();
          expect(result).toBe(expected);
        });
      });

      describe('when timestamp is Tuesday', () => {
        beforeEach(() => (timestamp = new Date('2024-01-09T12:00:00').getTime()));
        beforeEach(action);
        it('should return previous Monday', () => {
          const expected = new Date('2024-01-08T00:00:00').getTime();
          expect(result).toBe(expected);
        });
      });
    });

    describe('with weekStartsOn Tuesday (2)', () => {
      beforeEach(() => (weekStartsOn = 2));

      describe('when timestamp is Tuesday', () => {
        beforeEach(() => (timestamp = new Date('2024-01-09T12:00:00').getTime()));
        beforeEach(action);
        it('should return start of that Tuesday', () => {
          const expected = new Date('2024-01-09T00:00:00').getTime();
          expect(result).toBe(expected);
        });
      });

      describe('when timestamp is Monday', () => {
        beforeEach(() => (timestamp = new Date('2024-01-08T12:00:00').getTime()));
        beforeEach(action);
        it('should return previous Tuesday', () => {
          const expected = new Date('2024-01-02T00:00:00').getTime();
          expect(result).toBe(expected);
        });
      });
    });

    describe('with weekStartsOn Wednesday (3)', () => {
      beforeEach(() => (weekStartsOn = 3));

      describe('when timestamp is Wednesday', () => {
        beforeEach(() => (timestamp = new Date('2024-01-10T12:00:00').getTime()));
        beforeEach(action);
        it('should return start of that Wednesday', () => {
          const expected = new Date('2024-01-10T00:00:00').getTime();
          expect(result).toBe(expected);
        });
      });
    });

    describe('with weekStartsOn Thursday (4)', () => {
      beforeEach(() => (weekStartsOn = 4));

      describe('when timestamp is Thursday', () => {
        beforeEach(() => (timestamp = new Date('2024-01-11T12:00:00').getTime()));
        beforeEach(action);
        it('should return start of that Thursday', () => {
          const expected = new Date('2024-01-11T00:00:00').getTime();
          expect(result).toBe(expected);
        });
      });
    });

    describe('with weekStartsOn Friday (5)', () => {
      beforeEach(() => (weekStartsOn = 5));

      describe('when timestamp is Friday', () => {
        beforeEach(() => (timestamp = new Date('2024-01-12T12:00:00').getTime()));
        beforeEach(action);
        it('should return start of that Friday', () => {
          const expected = new Date('2024-01-12T00:00:00').getTime();
          expect(result).toBe(expected);
        });
      });

      describe('when timestamp is Thursday', () => {
        beforeEach(() => (timestamp = new Date('2024-01-11T12:00:00').getTime()));
        beforeEach(action);
        it('should return previous Friday', () => {
          const expected = new Date('2024-01-05T00:00:00').getTime();
          expect(result).toBe(expected);
        });
      });
    });

    describe('with weekStartsOn Saturday (6)', () => {
      beforeEach(() => (weekStartsOn = 6));

      describe('when timestamp is Saturday', () => {
        beforeEach(() => (timestamp = new Date('2024-01-13T12:00:00').getTime()));
        beforeEach(action);
        it('should return start of that Saturday', () => {
          const expected = new Date('2024-01-13T00:00:00').getTime();
          expect(result).toBe(expected);
        });
      });

      describe('when timestamp is Friday', () => {
        beforeEach(() => (timestamp = new Date('2024-01-12T12:00:00').getTime()));
        beforeEach(action);
        it('should return previous Saturday', () => {
          const expected = new Date('2024-01-06T00:00:00').getTime();
          expect(result).toBe(expected);
        });
      });
    });

    describe('edge cases', () => {
      beforeEach(() => (weekStartsOn = 0));

      describe('when timestamp is midnight', () => {
        beforeEach(() => (timestamp = new Date('2024-01-07T00:00:00').getTime()));
        beforeEach(action);
        it('should handle midnight correctly', () => {
          const expected = new Date('2024-01-07T00:00:00').getTime();
          expect(result).toBe(expected);
        });
      });

      describe('when timestamp crosses year boundary', () => {
        beforeEach(() => {
          weekStartsOn = 1;
          timestamp = new Date('2023-12-31T12:00:00').getTime(); // Sunday, Dec 31
        });
        beforeEach(action);
        it('should return Monday from previous year', () => {
          const expected = new Date('2023-12-25T00:00:00').getTime();
          expect(result).toBe(expected);
        });
      });

      describe('when timestamp is near end of week', () => {
        beforeEach(() => (timestamp = new Date('2024-01-13T23:59:59').getTime()));
        beforeEach(action);
        it('should still return start of current week', () => {
          const expected = new Date('2024-01-07T00:00:00').getTime();
          expect(result).toBe(expected);
        });
      });
    });
  });

  describe('getWeekId', () => {
    let weekStart: number;
    let result: string;
    const action = () => (result = getWeekId(weekStart));

    describe('for a typical week', () => {
      beforeEach(() => {
        const monday = new Date('2024-01-08T12:00:00').getTime();
        weekStart = getStartOfWeek(monday, 1);
      });
      beforeEach(action);

      it('should return ISO 8601 format YYYY-Www', () => {
        expect(result).toMatch(/^\d{4}-W\d{2}$/);
      });

      it('should return correct week number', () => {
        expect(result).toBe('2024-W02');
      });
    });

    describe('for year transition', () => {
      beforeEach(() => {
        const endOfYear = new Date('2024-12-30T12:00:00').getTime(); // Monday
        weekStart = getStartOfWeek(endOfYear, 1);
      });
      beforeEach(action);

      it('should handle end of year correctly', () => {
        // Dec 30, 2024 is a Monday in ISO week 2025-W01
        expect(result).toBe('2025-W01');
      });
    });

    describe('for beginning of year', () => {
      beforeEach(() => {
        const startOfYear = new Date('2024-01-01T12:00:00').getTime(); // Monday
        weekStart = getStartOfWeek(startOfYear, 1);
      });
      beforeEach(action);

      it('should handle start of year correctly', () => {
        expect(result).toBe('2024-W01');
      });
    });
  });

  describe('dayOfWeekToNumber', () => {
    let day: DayOfWeek;
    let result: number;
    const action = () => (result = dayOfWeekToNumber(day));

    describe('when day is Mon', () => {
      beforeEach(() => (day = 'Mon'));
      beforeEach(action);
      it('should return 1', () => {
        expect(result).toBe(1);
      });
    });

    describe('when day is Tue', () => {
      beforeEach(() => (day = 'Tue'));
      beforeEach(action);
      it('should return 2', () => {
        expect(result).toBe(2);
      });
    });

    describe('when day is Wed', () => {
      beforeEach(() => (day = 'Wed'));
      beforeEach(action);
      it('should return 3', () => {
        expect(result).toBe(3);
      });
    });

    describe('when day is Thu', () => {
      beforeEach(() => (day = 'Thu'));
      beforeEach(action);
      it('should return 4', () => {
        expect(result).toBe(4);
      });
    });

    describe('when day is Fri', () => {
      beforeEach(() => (day = 'Fri'));
      beforeEach(action);
      it('should return 5', () => {
        expect(result).toBe(5);
      });
    });

    describe('when day is Sat', () => {
      beforeEach(() => (day = 'Sat'));
      beforeEach(action);
      it('should return 6', () => {
        expect(result).toBe(6);
      });
    });

    describe('when day is Sun', () => {
      beforeEach(() => (day = 'Sun'));
      beforeEach(action);
      it('should return 0', () => {
        expect(result).toBe(0);
      });
    });
  });
});
