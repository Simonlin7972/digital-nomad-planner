export const YEAR = 2027;

export type Week = {
  index: number;
  start: Date; // Monday
  month: number; // 0–11, month the week is shown under
};

export type MonthSpan = { month: number; startIndex: number; span: number };

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

export const MONTHS: MonthSpan[] = WEEKS.reduce<MonthSpan[]>((acc, w) => {
  const last = acc[acc.length - 1];
  if (last && last.month === w.month) last.span++;
  else acc.push({ month: w.month, startIndex: w.index, span: 1 });
  return acc;
}, []);

const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;

export function weekLabel(index: number): string {
  return fmt(WEEKS[index].start);
}

export function rangeLabel(startWeek: number, endWeek: number): string {
  return `${fmt(WEEKS[startWeek].start)} – ${fmt(addDays(WEEKS[endWeek].start, 6))}`;
}

export function currentWeekIndex(now = new Date()): number | null {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const i = WEEKS.findIndex((w) => today >= w.start && today < addDays(w.start, 7));
  return i === -1 ? null : i;
}
