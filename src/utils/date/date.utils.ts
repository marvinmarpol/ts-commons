/**
 * Date utility functions for consistent date handling
 */

const MILLISECONDS_PER_DAY = 86400000;
const START_OF_DAY_HOUR = 0;
const START_OF_DAY_MINUTE = 0;
const START_OF_DAY_SECOND = 0;
const START_OF_DAY_MS = 0;
const END_OF_DAY_HOUR = 23;
const END_OF_DAY_MINUTE = 59;
const END_OF_DAY_SECOND = 59;
const END_OF_DAY_MS = 999;

/**
 * Parse various date inputs into a Date object
 */
export function parseDate(input: string | number | Date): Date | null {
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Check if value is a valid Date object
 */
export function isValidDate(input: unknown): boolean {
  return input instanceof Date && !isNaN(input.getTime());
}

/**
 * Convert Date to ISO string
 */
export function toISO(date: Date): string {
  return date.toISOString();
}

/**
 * Parse ISO string to Date
 */
export function fromISO(value: string): Date {
  return new Date(value);
}

/**
 * Get start of day (00:00:00.000)
 */
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(START_OF_DAY_HOUR, START_OF_DAY_MINUTE, START_OF_DAY_SECOND, START_OF_DAY_MS);
  return d;
}

/**
 * Get end of day (23:59:59.999)
 */
export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(END_OF_DAY_HOUR, END_OF_DAY_MINUTE, END_OF_DAY_SECOND, END_OF_DAY_MS);
  return d;
}

/**
 * Truncate date to specified unit
 */
export function truncateDate(date: Date, unit: 'minute' | 'hour' | 'day' | 'month'): Date {
  const d = new Date(date);
  if (unit === 'month') {
    d.setDate(1);
    d.setHours(START_OF_DAY_HOUR, START_OF_DAY_MINUTE, START_OF_DAY_SECOND, START_OF_DAY_MS);
  }
  if (unit === 'day') {
    d.setHours(START_OF_DAY_HOUR, START_OF_DAY_MINUTE, START_OF_DAY_SECOND, START_OF_DAY_MS);
  }
  if (unit === 'hour') {
    d.setMinutes(START_OF_DAY_MINUTE, START_OF_DAY_SECOND, START_OF_DAY_MS);
  }
  if (unit === 'minute') {
    d.setSeconds(START_OF_DAY_SECOND, START_OF_DAY_MS);
  }
  return d;
}

/**
 * Calculate difference in milliseconds
 */
export function diffInMs(a: Date, b: Date): number {
  return a.getTime() - b.getTime();
}

/**
 * Calculate difference in days
 */
export function diffInDays(a: Date, b: Date): number {
  return Math.floor(diffInMs(a, b) / MILLISECONDS_PER_DAY);
}

/**
 * Check if date is within range (inclusive)
 */
export function isWithinRange(date: Date, start: Date, end: Date): boolean {
  const t = date.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

/**
 * Get current timestamp in milliseconds
 */
export function nowMs(): number {
  return Date.now();
}

/**
 * Get current timestamp as ISO string
 */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Get the last day of the month for a given date
 */
export function endOfMonth(date: Date): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(START_OF_DAY_HOUR, START_OF_DAY_MINUTE, START_OF_DAY_SECOND, START_OF_DAY_MS);
  return d;
}
