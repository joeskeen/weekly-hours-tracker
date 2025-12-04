import { DayOfWeek, daysOfWeek } from './storage.service';

/**
 * Gets the start of the week for a given timestamp, respecting the configured week start day.
 * @param ts - Timestamp in milliseconds
 * @param weekStartsOn - Day of week (0=Sunday, 1=Monday, etc.)
 * @returns Timestamp at midnight of the week start
 */
export function getStartOfWeek(ts: number, weekStartsOn: number): number {
  const d = new Date(ts);
  const day = d.getDay();
  let diff = day - weekStartsOn;
  if (diff < 0) {
    diff += 7;
  }
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Calculates ISO week identifier (YYYY-Www format) for a given timestamp.
 * @param ts - Timestamp in milliseconds
 * @returns ISO week string like "2025-W48"
 */
export function getWeekId(ts: number): string {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}

/**
 * Converts DayOfWeek string to numeric day (0=Sunday, 1=Monday, etc.)
 */
export function dayOfWeekToNumber(day: DayOfWeek): number {
  const map: Record<DayOfWeek, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[day];
}

/**
 * Converts numeric day (0=Sunday, 1=Monday, etc.) to DayOfWeek string
 */
export function numberToDayOfWeek(dayNum: number): DayOfWeek {
  const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayNum];
}
