import { getLocale, t } from './i18n';

// The years that can be planned. Each has its own plan in storage; the chosen one is remembered per browser.
export const YEARS = [2026, 2027, 2028] as const;
const YEAR_KEY = 'dnp-year';

function loadYear(): number {
  try {
    const saved = Number(localStorage.getItem(YEAR_KEY));
    if ((YEARS as readonly number[]).includes(saved)) return saved;
  } catch {
    // storage unavailable: use the default
  }
  return 2027;
}

export type Week = {
  index: number;
  start: Date; // Monday
  month: number; // 0–11, month the week is shown under
};

export type MonthSpan = { month: number; startIndex: number; span: number };
export type DayRange = { startDay: number; endDay: number }; // inclusive, days since DAY0

function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

function buildWeeks(YEAR: number): Week[] {
  const jan1 = new Date(YEAR, 0, 1);
  const dec31 = new Date(YEAR, 11, 31);
  const sinceMonday = (jan1.getDay() + 6) % 7;
  const first = addDays(jan1, -sinceMonday);
  const weeks: Week[] = [];
  for (let i = 0; ; i++) {
    const start = addDays(first, i * 7);
    if (start > dec31) break;
    // The first week may start in the previous December; show it under January.
    const month = start.getFullYear() < YEAR ? 0 : start.getMonth();
    weeks.push({ index: i, start, month });
  }
  return weeks;
}

function buildMonths(weeks: Week[]): MonthSpan[] {
  return weeks.reduce<MonthSpan[]>((acc, w) => {
    const last = acc[acc.length - 1];
    if (last && last.month === w.month) last.span++;
    else acc.push({ month: w.month, startIndex: w.index, span: 1 });
    return acc;
  }, []);
}

// The date model for the year being planned. These are live bindings: setYear rebuilds them, and importers see
// the new values. Anything that keeps state derived from them (the whole App) is remounted on a change; see
// useYear.
export let YEAR = loadYear();
export let WEEKS = buildWeeks(YEAR);
export let WEEK_COUNT = WEEKS.length;
export let DAY0 = WEEKS[0].start;
export let TOTAL_DAYS = WEEK_COUNT * 7;
// The timeline is laid out in half-week slots; stays keep exact dates and snap to slots for display.
export let SLOTS = WEEK_COUNT * 2;
export let MONTHS = buildMonths(WEEKS);

const listeners = new Set<() => void>();
let direction: -1 | 0 | 1 = 0; // which way the last change went: 1 to a later year, -1 to an earlier one

// Switches the year being planned: remembers it, rebuilds the date model and tells subscribers. The plan for the
// year being left is already saved.
export function setYear(year: number) {
  if (year === YEAR || !(YEARS as readonly number[]).includes(year)) return;
  direction = year > YEAR ? 1 : -1;
  YEAR = year;
  WEEKS = buildWeeks(year);
  WEEK_COUNT = WEEKS.length;
  DAY0 = WEEKS[0].start;
  TOTAL_DAYS = WEEK_COUNT * 7;
  SLOTS = WEEK_COUNT * 2;
  MONTHS = buildMonths(WEEKS);
  try {
    localStorage.setItem(YEAR_KEY, String(year));
  } catch {
    // the choice just won't be remembered
  }
  listeners.forEach((notify) => notify());
}

export function subscribeYear(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}
export const getYear = () => YEAR;
export const yearDirection = () => direction;

const pad = (n: number) => String(n).padStart(2, '0');
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const EN_MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const EN_WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ZH_WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

// All date text goes through these, so it follows the current language: "1/4" or "Jan 4".
const fmt = (d: Date) => (getLocale() === 'en' ? `${EN_MONTHS[d.getMonth()]} ${d.getDate()}` : `${d.getMonth() + 1}/${d.getDate()}`);

// Monday-first weekday names; `index` 0 is Monday.
export const weekdayName = (index: number) => (getLocale() === 'en' ? EN_WEEKDAYS : ZH_WEEKDAYS)[index];
// Column headers for calendars: 一 … 日, or Mo … Su.
export const weekdayHeaders = () => (getLocale() === 'en' ? EN_WEEKDAYS.map((d) => d.slice(0, 2)) : ZH_WEEKDAYS);

// "2 月" / "Feb": the short label on the timeline and in headings.
export const monthName = (month: number) => (getLocale() === 'en' ? EN_MONTHS[month] : `${month + 1} 月`);
// "2027 年 2 月" / "February 2027": the title of a calendar page.
export const monthTitle = (year: number, month: number) =>
  getLocale() === 'en' ? `${EN_MONTHS_LONG[month]} ${year}` : `${year} 年 ${month + 1} 月`;
// "2027/7/5（一）" / "Jul 5, 2027 (Mon)": one date written out in full.
export function fullDate(d: Date): string {
  const weekday = weekdayName((d.getDay() + 6) % 7);
  return getLocale() === 'en'
    ? `${EN_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} (${weekday})`
    : `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}（${weekday}）`;
}

export function isoOfDay(day: number): string {
  const d = addDays(DAY0, day);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dayOfIso(iso: unknown): number | null {
  const m = typeof iso === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso) : null;
  if (!m) return null;
  // UTC arithmetic so DST shifts can't move a date by a day.
  const t0 = Date.UTC(DAY0.getFullYear(), DAY0.getMonth(), DAY0.getDate());
  const day = Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - t0) / 86_400_000);
  return day >= 0 && day < TOTAL_DAYS ? day : null;
}

// Slot boundary k sits at Monday (even k) or Friday (odd k) of its week.
export function dayOfBoundary(k: number): number {
  return Math.floor(k / 2) * 7 + (k % 2 ? 4 : 0);
}

// Display span [s, e) in slots: each end snaps to the nearest half-week boundary, at least one slot wide.
export function slotsOf(r: DayRange): { s: number; e: number } {
  let s = Math.round(r.startDay / 3.5);
  let e = Math.round((r.endDay + 1) / 3.5);
  if (e <= s) {
    s = Math.min(s, SLOTS - 1);
    e = s + 1;
  }
  return { s, e };
}

export function rangeLabel(r: DayRange): string {
  return `${fmt(addDays(DAY0, r.startDay))} – ${fmt(addDays(DAY0, r.endDay))}`;
}

const fmtLong = (day: number) => `${fmt(addDays(DAY0, day))}${getLocale() === 'en' ? ' ' : ''}(${weekdayName(day % 7)})`;

// Like rangeLabel, with weekdays; a single day isn't repeated.
export function longRangeLabel(r: DayRange): string {
  return r.startDay === r.endDay ? fmtLong(r.startDay) : `${fmtLong(r.startDay)} – ${fmtLong(r.endDay)}`;
}

export const dateOfDay = (day: number) => addDays(DAY0, day);

const dayOfDate = (d: Date) =>
  Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(DAY0.getFullYear(), DAY0.getMonth(), DAY0.getDate())) / 86_400_000);

// First and last day of a calendar month (0–11) of YEAR.
export function monthRange(month: number): DayRange {
  return { startDay: dayOfDate(new Date(YEAR, month, 1)), endDay: dayOfDate(new Date(YEAR, month + 1, 0)) };
}

export function todayIndex(now = new Date()): number | null {
  const day = dayOfDate(now);
  return day >= 0 && day < TOTAL_DAYS ? day : null;
}

export const daysOf = (r: DayRange) => r.endDay - r.startDay + 1;

export function weeksLabel(days: number): string {
  return t('unit.weeks', { n: days <= 0 ? 0 : Math.max(0.5, Math.round(days / 3.5) / 2) });
}

export function currentWeekIndex(now = new Date()): number | null {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const i = WEEKS.findIndex((w) => today >= w.start && today < addDays(w.start, 7));
  return i === -1 ? null : i;
}
