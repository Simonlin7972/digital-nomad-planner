export const YEAR = 2027;

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

function buildWeeks(): Week[] {
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

export const WEEKS = buildWeeks();
export const WEEK_COUNT = WEEKS.length;
export const DAY0 = WEEKS[0].start;
export const TOTAL_DAYS = WEEK_COUNT * 7;
// The timeline is laid out in half-week slots; stays keep exact dates and snap to slots for display.
export const SLOTS = WEEK_COUNT * 2;

export const MONTHS: MonthSpan[] = WEEKS.reduce<MonthSpan[]>((acc, w) => {
  const last = acc[acc.length - 1];
  if (last && last.month === w.month) last.span++;
  else acc.push({ month: w.month, startIndex: w.index, span: 1 });
  return acc;
}, []);

const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;

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

export const daysOf = (r: DayRange) => r.endDay - r.startDay + 1;

export function weeksLabel(days: number): string {
  return `${days <= 0 ? 0 : Math.max(0.5, Math.round(days / 3.5) / 2)} 週`;
}

export function currentWeekIndex(now = new Date()): number | null {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const i = WEEKS.findIndex((w) => today >= w.start && today < addDays(w.start, 7));
  return i === -1 ? null : i;
}
