/**
 * Plan dates are local calendar days stored as "YYYY-MM-DD" strings, never as timestamps:
 * a meal planned for Monday must stay on Monday whatever the time zone or clock change.
 */
export type DateKey = string;

const pad = (n: number) => String(n).padStart(2, '0');

export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local midday avoids daylight-saving edges when doing day arithmetic. */
export function fromDateKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y!, m! - 1, d!, 12);
}

export function isDateKey(value: unknown): value is DateKey {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && toDateKey(fromDateKey(value)) === value;
}

export function addDays(key: DateKey, days: number): DateKey {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export const todayKey = (now: Date = new Date()): DateKey => toDateKey(now);

/** Monday of the week containing `key`. */
export function startOfWeek(key: DateKey): DateKey {
  const day = fromDateKey(key).getDay(); // 0 = Sunday
  return addDays(key, -((day + 6) % 7));
}

export function weekDays(start: DateKey): DateKey[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Today", "Tomorrow", "Yesterday" or "Wed 12 Nov". */
export function dayLabel(key: DateKey, today: DateKey = todayKey()): string {
  if (key === today) return 'Today';
  if (key === addDays(today, 1)) return 'Tomorrow';
  if (key === addDays(today, -1)) return 'Yesterday';
  const d = fromDateKey(key);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function shortWeekday(key: DateKey): string {
  return WEEKDAYS[fromDateKey(key).getDay()]!;
}

export function dayOfMonth(key: DateKey): number {
  return fromDateKey(key).getDate();
}

/** "10–16 Nov" or "28 Nov – 4 Dec". */
export function rangeLabel(start: DateKey, end: DateKey): string {
  const a = fromDateKey(start);
  const b = fromDateKey(end);
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()]}`
    : `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]}`;
}
