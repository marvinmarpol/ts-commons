import {
    diffInDays,
    diffInMs,
    endOfDay,
    endOfMonth,
    fromISO,
    isValidDate,
    isWithinRange,
    nowIso,
    nowMs,
    parseDate,
    startOfDay,
    toISO,
    truncateDate,
} from './date.utils';

describe('Date Utils', () => {
  describe('parseDate', () => {
    describe('when parsing valid date inputs', () => {
      it('should parse ISO string', () => {
        const result = parseDate('2026-02-11T10:30:00.000Z');

        expect(result).toBeInstanceOf(Date);
        expect(result?.toISOString()).toBe('2026-02-11T10:30:00.000Z');
      });

      it('should parse timestamp number', () => {
        const timestamp = 1739272200000; // 2026-02-11
        const result = parseDate(timestamp);

        expect(result).toBeInstanceOf(Date);
        expect(result?.getTime()).toBe(timestamp);
      });

      it('should parse Date object', () => {
        const date = new Date('2026-02-11');
        const result = parseDate(date);

        expect(result).toBeInstanceOf(Date);
        expect(result?.getTime()).toBe(date.getTime());
      });

      it('should parse date string in various formats', () => {
        const result = parseDate('2026-02-11');

        expect(result).toBeInstanceOf(Date);
        expect(result?.getFullYear()).toBe(2026);
      });
    });

    describe('when parsing invalid inputs', () => {
      it('should return null for invalid string', () => {
        const result = parseDate('invalid-date');

        expect(result).toBeNull();
      });

      it('should return null for invalid format', () => {
        const result = parseDate('not a date');

        expect(result).toBeNull();
      });
    });
  });

  describe('isValidDate', () => {
    describe('when checking date validity', () => {
      it('should return true for valid Date object', () => {
        const date = new Date('2026-02-11');

        expect(isValidDate(date)).toBe(true);
      });

      it('should return false for invalid Date object', () => {
        const date = new Date('invalid');

        expect(isValidDate(date)).toBe(false);
      });

      it('should return false for non-Date objects', () => {
        expect(isValidDate('2026-02-11')).toBe(false);
        expect(isValidDate(123456789)).toBe(false);
        expect(isValidDate(null)).toBe(false);
        expect(isValidDate(undefined)).toBe(false);
        expect(isValidDate({})).toBe(false);
      });
    });
  });

  describe('toISO', () => {
    describe('when converting Date to ISO string', () => {
      it('should return ISO 8601 format', () => {
        const date = new Date('2026-02-11T10:30:00.000Z');
        const result = toISO(date);

        expect(result).toBe('2026-02-11T10:30:00.000Z');
      });

      it('should preserve timezone information', () => {
        const date = new Date('2026-02-11T15:45:30.123Z');
        const result = toISO(date);

        expect(result).toContain('2026-02-11');
        expect(result).toContain('T');
        expect(result).toContain('Z');
      });
    });
  });

  describe('fromISO', () => {
    describe('when parsing ISO string', () => {
      it('should create Date from ISO string', () => {
        const isoString = '2026-02-11T10:30:00.000Z';
        const result = fromISO(isoString);

        expect(result).toBeInstanceOf(Date);
        expect(result.toISOString()).toBe(isoString);
      });

      it('should handle ISO string with milliseconds', () => {
        const isoString = '2026-02-11T10:30:00.123Z';
        const result = fromISO(isoString);

        expect(result.getMilliseconds()).toBe(123);
      });
    });
  });

  describe('startOfDay', () => {
    describe('when getting start of day', () => {
      it('should set time to 00:00:00.000', () => {
        const date = new Date('2026-02-11T15:30:45.123Z');
        const result = startOfDay(date);

        expect(result.getHours()).toBe(0);
        expect(result.getMinutes()).toBe(0);
        expect(result.getSeconds()).toBe(0);
        expect(result.getMilliseconds()).toBe(0);
      });

      it('should preserve the date', () => {
        const date = new Date('2026-02-11T15:30:45.123Z');
        const result = startOfDay(date);

        expect(result.getDate()).toBe(date.getDate());
        expect(result.getMonth()).toBe(date.getMonth());
        expect(result.getFullYear()).toBe(date.getFullYear());
      });

      it('should not mutate original date', () => {
        const date = new Date('2026-02-11T15:30:45.123Z');
        const original = date.getTime();

        startOfDay(date);

        expect(date.getTime()).toBe(original);
      });
    });
  });

  describe('endOfDay', () => {
    describe('when getting end of day', () => {
      it('should set time to 23:59:59.999', () => {
        const date = new Date('2026-02-11T10:30:45.123Z');
        const result = endOfDay(date);

        expect(result.getHours()).toBe(23);
        expect(result.getMinutes()).toBe(59);
        expect(result.getSeconds()).toBe(59);
        expect(result.getMilliseconds()).toBe(999);
      });

      it('should preserve the date', () => {
        const date = new Date('2026-02-11T10:30:45.123Z');
        const result = endOfDay(date);

        expect(result.getDate()).toBe(date.getDate());
        expect(result.getMonth()).toBe(date.getMonth());
        expect(result.getFullYear()).toBe(date.getFullYear());
      });

      it('should not mutate original date', () => {
        const date = new Date('2026-02-11T10:30:45.123Z');
        const original = date.getTime();

        endOfDay(date);

        expect(date.getTime()).toBe(original);
      });
    });
  });

  describe('truncateDate', () => {
    describe('when truncating to minute', () => {
      it('should set seconds and milliseconds to 0', () => {
        const date = new Date('2026-02-11T10:30:45.123Z');
        const result = truncateDate(date, 'minute');

        expect(result.getSeconds()).toBe(0);
        expect(result.getMilliseconds()).toBe(0);
        expect(result.getMinutes()).toBe(date.getMinutes());
        expect(result.getHours()).toBe(date.getHours());
      });
    });

    describe('when truncating to hour', () => {
      it('should set minutes, seconds, and milliseconds to 0', () => {
        const date = new Date('2026-02-11T10:30:45.123Z');
        const result = truncateDate(date, 'hour');

        expect(result.getMinutes()).toBe(0);
        expect(result.getSeconds()).toBe(0);
        expect(result.getMilliseconds()).toBe(0);
        expect(result.getHours()).toBe(date.getHours());
      });
    });

    describe('when truncating to day', () => {
      it('should set time to 00:00:00.000', () => {
        const date = new Date('2026-02-11T10:30:45.123Z');
        const result = truncateDate(date, 'day');

        expect(result.getHours()).toBe(0);
        expect(result.getMinutes()).toBe(0);
        expect(result.getSeconds()).toBe(0);
        expect(result.getMilliseconds()).toBe(0);
      });
    });

    describe('when truncating to month', () => {
      it('should set day to 1 and time to 00:00:00.000', () => {
        const date = new Date('2026-02-15T10:30:45.123Z');
        const result = truncateDate(date, 'month');

        expect(result.getDate()).toBe(1);
        expect(result.getHours()).toBe(0);
        expect(result.getMinutes()).toBe(0);
        expect(result.getSeconds()).toBe(0);
        expect(result.getMilliseconds()).toBe(0);
      });
    });
  });

  describe('diffInMs', () => {
    describe('when calculating millisecond difference', () => {
      it('should return positive difference for later date', () => {
        const date1 = new Date('2026-02-11T10:00:00.000Z');
        const date2 = new Date('2026-02-11T10:00:01.000Z');

        const result = diffInMs(date2, date1);

        expect(result).toBe(1000);
      });

      it('should return negative difference for earlier date', () => {
        const date1 = new Date('2026-02-11T10:00:00.000Z');
        const date2 = new Date('2026-02-11T10:00:01.000Z');

        const result = diffInMs(date1, date2);

        expect(result).toBe(-1000);
      });

      it('should return 0 for same dates', () => {
        const date = new Date('2026-02-11T10:00:00.000Z');

        const result = diffInMs(date, date);

        expect(result).toBe(0);
      });
    });
  });

  describe('diffInDays', () => {
    describe('when calculating day difference', () => {
      it('should return positive days for later date', () => {
        const date1 = new Date('2026-02-11');
        const date2 = new Date('2026-02-14');

        const result = diffInDays(date2, date1);

        expect(result).toBe(3);
      });

      it('should return negative days for earlier date', () => {
        const date1 = new Date('2026-02-11');
        const date2 = new Date('2026-02-14');

        const result = diffInDays(date1, date2);

        expect(result).toBe(-3);
      });

      it('should return 0 for same day', () => {
        const date = new Date('2026-02-11');

        const result = diffInDays(date, date);

        expect(result).toBe(0);
      });

      it('should floor partial days', () => {
        const date1 = new Date('2026-02-11T10:00:00.000Z');
        const date2 = new Date('2026-02-12T08:00:00.000Z');

        const result = diffInDays(date2, date1);

        expect(result).toBe(0); // Less than 24 hours
      });
    });
  });

  describe('isWithinRange', () => {
    describe('when checking if date is within range', () => {
      it('should return true for date within range', () => {
        const date = new Date('2026-02-11');
        const start = new Date('2026-02-10');
        const end = new Date('2026-02-12');

        expect(isWithinRange(date, start, end)).toBe(true);
      });

      it('should return true for date equal to start', () => {
        const date = new Date('2026-02-11');
        const start = new Date('2026-02-11');
        const end = new Date('2026-02-12');

        expect(isWithinRange(date, start, end)).toBe(true);
      });

      it('should return true for date equal to end', () => {
        const date = new Date('2026-02-12');
        const start = new Date('2026-02-11');
        const end = new Date('2026-02-12');

        expect(isWithinRange(date, start, end)).toBe(true);
      });

      it('should return false for date before range', () => {
        const date = new Date('2026-02-09');
        const start = new Date('2026-02-10');
        const end = new Date('2026-02-12');

        expect(isWithinRange(date, start, end)).toBe(false);
      });

      it('should return false for date after range', () => {
        const date = new Date('2026-02-13');
        const start = new Date('2026-02-10');
        const end = new Date('2026-02-12');

        expect(isWithinRange(date, start, end)).toBe(false);
      });
    });
  });

  describe('nowMs', () => {
    describe('when getting current timestamp', () => {
      it('should return current timestamp in milliseconds', () => {
        const before = Date.now();
        const result = nowMs();
        const after = Date.now();

        expect(result).toBeGreaterThanOrEqual(before);
        expect(result).toBeLessThanOrEqual(after);
      });

      it('should return a number', () => {
        const result = nowMs();

        expect(typeof result).toBe('number');
      });
    });
  });

  describe('nowIso', () => {
    describe('when getting current ISO timestamp', () => {
      it('should return ISO 8601 format string', () => {
        const result = nowIso();

        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });

      it('should be parseable as Date', () => {
        const result = nowIso();
        const date = new Date(result);

        expect(isValidDate(date)).toBe(true);
      });
    });
  });

  describe('endOfMonth', () => {
    describe('when getting end of month', () => {
      it('should return last day of February in non-leap year', () => {
        const date = new Date('2026-02-15T10:30:45.123Z');
        const result = endOfMonth(date);

        expect(result.getFullYear()).toBe(2026);
        expect(result.getMonth()).toBe(1);
        expect(result.getDate()).toBe(28);
      });

      it('should return last day of February in leap year', () => {
        const date = new Date('2024-02-15T10:30:45.123Z');
        const result = endOfMonth(date);

        expect(result.getFullYear()).toBe(2024);
        expect(result.getMonth()).toBe(1);
        expect(result.getDate()).toBe(29);
      });

      it('should return last day of month with 31 days', () => {
        const date = new Date('2026-01-15T10:30:45.123Z');
        const result = endOfMonth(date);

        expect(result.getFullYear()).toBe(2026);
        expect(result.getMonth()).toBe(0);
        expect(result.getDate()).toBe(31);
      });

      it('should return last day of month with 30 days', () => {
        const date = new Date('2026-04-15T10:30:45.123Z');
        const result = endOfMonth(date);

        expect(result.getFullYear()).toBe(2026);
        expect(result.getMonth()).toBe(3);
        expect(result.getDate()).toBe(30);
      });

      it('should return last day of December', () => {
        const date = new Date('2026-12-15T10:30:45.123Z');
        const result = endOfMonth(date);

        expect(result.getFullYear()).toBe(2026);
        expect(result.getMonth()).toBe(11);
        expect(result.getDate()).toBe(31);
      });

      it('should set time to 00:00:00.000', () => {
        const date = new Date('2026-02-15T10:30:45.123Z');
        const result = endOfMonth(date);

        expect(result.getHours()).toBe(0);
        expect(result.getMinutes()).toBe(0);
        expect(result.getSeconds()).toBe(0);
        expect(result.getMilliseconds()).toBe(0);
      });

      it('should work when given first day of month', () => {
        const date = new Date('2026-03-01T10:30:45.123Z');
        const result = endOfMonth(date);

        expect(result.getFullYear()).toBe(2026);
        expect(result.getMonth()).toBe(2);
        expect(result.getDate()).toBe(31);
      });

      it('should work when given last day of month', () => {
        const date = new Date('2026-03-31T10:30:45.123Z');
        const result = endOfMonth(date);

        expect(result.getFullYear()).toBe(2026);
        expect(result.getMonth()).toBe(2);
        expect(result.getDate()).toBe(31);
      });

      it('should not mutate original date', () => {
        const date = new Date('2026-02-15T10:30:45.123Z');
        const original = date.getTime();

        endOfMonth(date);

        expect(date.getTime()).toBe(original);
      });

      it('should handle all months correctly', () => {
        const months = [
          { month: 1, days: 31 }, // January
          { month: 2, days: 28 }, // February (non-leap)
          { month: 3, days: 31 }, // March
          { month: 4, days: 30 }, // April
          { month: 5, days: 31 }, // May
          { month: 6, days: 30 }, // June
          { month: 7, days: 31 }, // July
          { month: 8, days: 31 }, // August
          { month: 9, days: 30 }, // September
          { month: 10, days: 31 }, // October
          { month: 11, days: 30 }, // November
          { month: 12, days: 31 }, // December
        ];

        months.forEach(({ month, days }) => {
          const date = new Date(`2026-${month.toString().padStart(2, '0')}-15`);
          const result = endOfMonth(date);

          expect(result.getDate()).toBe(days);
          expect(result.getMonth()).toBe(month - 1);
        });
      });
    });
  });
});
