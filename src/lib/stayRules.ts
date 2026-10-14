// Day-count rules that depend on where you are: the Schengen 90/180 limit and the 183-day residency line.
// Both are worked out from the plans: this year's, plus what the neighbouring years add at the edges (see getEdges).
import { schengenApplies } from './profile';
import { getEdges, type Stay } from './storage';
import { TOTAL_DAYS, YEAR, daysOf, monthRange, type DayRange } from './weeks';

// Full Schengen members as of 2025, by the ISO codes stays are stored under. Microstates with open borders
// (Monaco, San Marino, the Vatican) and broad regions such as "Europe" are not counted.
const SCHENGEN = new Set([
  'at', 'be', 'bg', 'ch', 'cz', 'de', 'dk', 'ee', 'es', 'fi', 'fr', 'gr', 'hr', 'hu', 'is',
  'it', 'li', 'lt', 'lu', 'lv', 'mt', 'nl', 'no', 'pl', 'pt', 'ro', 'se', 'si', 'sk',
]);
export const SCHENGEN_LIMIT = 90;
const SCHENGEN_WINDOW = 180;
export const TW_RESIDENCY_DAYS = 183;

export const isSchengen = (country: string) => SCHENGEN.has(country);

export type Gap = DayRange;

// Unplanned stretches between (and around) the stays, across the timeline less what the neighbouring years'
// stays already cover at either end.
export function gapsOf(stays: Stay[]): Gap[] {
  const { lo, hi } = getEdges();
  const last = Math.min(TOTAL_DAYS - 1, hi);
  const gaps: Gap[] = [];
  let next = lo;
  for (const s of [...stays].sort((a, b) => a.startDay - b.startDay)) {
    if (s.startDay > next) gaps.push({ startDay: next, endDay: s.startDay - 1 });
    next = Math.max(next, s.endDay + 1);
  }
  if (next <= last) gaps.push({ startDay: next, endDay: last });
  return gaps;
}

export type SchengenCheck = {
  days: number; // planned days in Schengen on the timeline
  peak: number; // most days in any 180-day window ending on a Schengen day
  firstOver: number | null; // first day that takes a window past 90
  overBy: Map<string, number>; // stay id → highest window count among its days, for stays that go over
};

// Every day spent in Schengen counts toward the 180 days that end on it. A day is over the limit when that
// window holds more than 90 of them. The window looks back into last year's plan, and the start of next year's
// counts where it reaches onto this timeline; days no plan covers are taken as outside.
export function checkSchengen(stays: Stay[]): SchengenCheck {
  // An EU / EEA / Swiss passport (from the profile) isn't bound by the limit: report nothing, so nothing shows.
  if (!schengenApplies()) return { days: 0, peak: 0, firstOver: null, overBy: new Map() };
  // Index i is day i - SCHENGEN_WINDOW, so the 180 days before the timeline fit in front of it.
  const size = SCHENGEN_WINDOW + TOTAL_DAYS;
  const inside = new Uint8Array(size);
  const owner: (string | null)[] = new Array(size).fill(null);
  const { before, ghosts } = getEdges();
  for (const s of [...before, ...ghosts.filter((g) => g.year > YEAR), ...stays]) {
    if (!isSchengen(s.country)) continue;
    for (let d = Math.max(s.startDay, -SCHENGEN_WINDOW); d <= Math.min(s.endDay, TOTAL_DAYS - 1); d++) {
      inside[d + SCHENGEN_WINDOW] = 1;
      owner[d + SCHENGEN_WINDOW] = s.id;
    }
  }
  const result: SchengenCheck = { days: 0, peak: 0, firstOver: null, overBy: new Map() };
  let window = 0;
  for (let i = 0; i < size; i++) {
    window += inside[i];
    if (i >= SCHENGEN_WINDOW) window -= inside[i - SCHENGEN_WINDOW];
    const d = i - SCHENGEN_WINDOW;
    if (d < 0 || !inside[i]) continue;
    result.days++;
    result.peak = Math.max(result.peak, window);
    if (window > SCHENGEN_LIMIT) {
      result.firstOver ??= d;
      const id = owner[i]!;
      result.overBy.set(id, Math.max(result.overBy.get(id) ?? 0, window));
    }
  }
  return result;
}

// Days planned in a country (the profile's tax residence, Taiwan by default) within the calendar year, which is
// the tax year most 183-day lines are counted over.
export function residenceDays(stays: Stay[], country: string): number {
  if (!country) return 0;
  const year = { startDay: monthRange(0).startDay, endDay: monthRange(11).endDay };
  return stays
    .filter((s) => s.country === country)
    .reduce((n, s) => {
      const startDay = Math.max(s.startDay, year.startDay);
      const endDay = Math.min(s.endDay, year.endDay);
      return endDay >= startDay ? n + daysOf({ startDay, endDay }) : n;
    }, 0);
}
