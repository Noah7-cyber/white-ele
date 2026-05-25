/**
 * Returns a standard Date object representing the current instant.
 */
export function getNigeriaDate(date: Date = new Date()): Date {
  return new Date(date.getTime());
}

/**
 * Formats a Date object into a YYYY-MM-DD string using Nigeria/Lagos time zone.
 */
export function formatDateKey(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date value');
  }

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };

  const formatter = new Intl.DateTimeFormat('en-GB', options);
  const parts = formatter.formatToParts(date);

  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const d = parts.find(p => p.type === 'day')?.value;

  return `${y}-${m}-${d}`;
}

/**
 * Returns a Date object for the start of the day in Nigeria (00:00:00+01:00)
 */
export function getNigeriaStartOfDay(date: Date = new Date()): Date {
  const s = formatDateKey(date);
  return new Date(`${s}T00:00:00+01:00`);
}

/**
 * Returns a Date object for the end of the day in Nigeria (23:59:59.999+01:00)
 */
export function getNigeriaEndOfDay(date: Date = new Date()): Date {
  const s = formatDateKey(date);
  return new Date(`${s}T23:59:59.999+01:00`);
}

/**
 * Monday 00:00 through Sunday 23:59:59.999 (Africa/Lagos calendar) for the week containing `ref`.
 */
export function getNigeriaWeekRangeContaining(ref: Date = new Date()): { start: Date; end: Date } {
  const s = formatDateKey(ref);
  const parts = s.split("-").map(Number);
  const y = parts[0]!;
  const mo = parts[1]!;
  const d = parts[2]!;
  const civil = new Date(Date.UTC(y, mo - 1, d));
  const w = civil.getUTCDay();
  const daysFromMonday = w === 0 ? 6 : w - 1;
  const mondayMs = Date.UTC(y, mo - 1, d - daysFromMonday);
  const sundayMs = Date.UTC(y, mo - 1, d - daysFromMonday + 6);
  const monday = new Date(mondayMs);
  const sunday = new Date(sundayMs);
  return {
    start: getNigeriaStartOfDay(monday),
    end: getNigeriaEndOfDay(sunday),
  };
}

/**
 * Returns the day name (Monday, Tuesday, etc.) for a date in Nigeria time.
 */
export function getNigeriaDayName(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Africa/Lagos',
    weekday: 'long'
  };
  return new Intl.DateTimeFormat('en-GB', options).format(date);
}

/**
 * Normalizes time string to HH:MM:SS format
 */
export function normalizeTime(time: string): string {
  const [hh, mm, ss] = time.split(':');
  return `${hh?.padStart(2, '0')}:${mm?.padStart(2, '0')}:${(ss || '00').padStart(2, '0')}`;
}

/**
 * Returns current time in Nigeria (Africa/Lagos) in HH:MM:SS format
 */
export function getCurrentTime(): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Africa/Lagos',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };

  const formatter = new Intl.DateTimeFormat('en-GB', options);
  const parts = formatter.formatToParts(new Date());

  const hh = parts.find(p => p.type === 'hour')?.value;
  const mm = parts.find(p => p.type === 'minute')?.value;
  const ss = parts.find(p => p.type === 'second')?.value;

  return `${hh}:${mm}:${ss}`;
}

/**
 * Calculates the number of working days (Mon-Fri) between two dates.
 */
export function countWorkingDays(
  startDateInput: Date | string,
  endDateInput: Date | string,
): number {
  const start = new Date(startDateInput);
  const end = new Date(endDateInput);
  const today = new Date();

  // Normalize to midnight
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const effectiveEnd = end > today ? today : end;

  if (start > effectiveEnd) return 0;

  let count = 0;
  const curDate = new Date(start);

  while (curDate <= effectiveEnd) {
    const day = curDate.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }

  return count;
}

export function calculateHours(timeIn?: string, timeOut?: string): number {
  if (!timeIn || !timeOut) return 0;

  const toMin = (t: string) => {
    const parts = t.split(':');
    if (parts.length < 2) return 0;
    return (Number(parts[0]) || 0) * 60 + (Number(parts[1]) || 0);
  };

  const minIn = toMin(timeIn);
  const minOut = toMin(timeOut);

  const diff = minOut - minIn;
  return diff > 0 ? diff / 60 : 0;
}

/**
 * Calculates hours and clips them to school hours.
 */
export function calculateClippedHours(timeIn: string, timeOut: string, schoolIn: string, schoolOut: string): number {
  if (!timeIn || !timeOut) return 0;

  const toMin = (t: string) => {
    const parts = t.split(':');
    if (parts.length < 2) return 0;
    return (Number(parts[0]) || 0) * 60 + (Number(parts[1]) || 0);
  };

  const minIn = toMin(timeIn);
  const minOut = toMin(timeOut);
  const minSchoolIn = toMin(schoolIn);
  const minSchoolOut = toMin(schoolOut);

  // Effective start is the later of sign-in time and resumption time
  const effectiveIn = Math.max(minIn, minSchoolIn);
  // Effective end is the earlier of sign-out time and closing time
  const effectiveOut = Math.min(minOut, minSchoolOut);

  const diff = effectiveOut - effectiveIn;
  return diff > 0 ? diff / 60 : 0;
}

/**
 * Relative percent change between two values (e.g. rates or cumulative counts).
 * Matches analytics convention: if previous is 0 and current > 0, returns 100; if both 0, returns 0.
 */
export function computeRelativeGrowthPercent(current: number, previous: number): number {
  return previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0);
}
