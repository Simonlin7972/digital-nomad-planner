import { TOTAL_DAYS, WEEK_COUNT, YEAR, dayOfIso, isoOfDay, type DayRange } from './weeks';

export type Stay = DayRange & {
  id: string;
  location: string;
  note?: string;
};

const KEY = `dnp-plan-${YEAR}`;

export function overlaps(a: DayRange, b: DayRange) {
  return a.startDay <= b.endDay && b.startDay <= a.endDay;
}

// Stays are stored with ISO dates so exported files stay readable.
export function serialize(stays: Stay[]) {
  return {
    year: YEAR,
    stays: stays.map((s) => ({
      id: s.id,
      location: s.location,
      start: isoOfDay(s.startDay),
      end: isoOfDay(s.endDay),
      ...(s.note ? { note: s.note } : {}),
    })),
  };
}

function rangeOf(s: Record<string, unknown>): DayRange | null {
  const startDay = dayOfIso(s.start);
  const endDay = dayOfIso(s.end);
  if (startDay !== null && endDay !== null) return { startDay, endDay };
  // Files from the week-based version stored whole-week indexes.
  const { startWeek, endWeek } = s;
  if (Number.isInteger(startWeek) && Number.isInteger(endWeek)) {
    const a = startWeek as number;
    const b = endWeek as number;
    if (a >= 0 && b < WEEK_COUNT) return { startDay: a * 7, endDay: b * 7 + 6 };
  }
  return null;
}

// Keeps only well-formed, non-overlapping stays so a bad file can't corrupt the timeline.
export function sanitize(data: unknown): Stay[] {
  const raw = Array.isArray(data) ? data : (data as { stays?: unknown } | null)?.stays;
  if (!Array.isArray(raw)) return [];
  const out: Stay[] = [];
  for (const s of raw) {
    if (!s || typeof s !== 'object') continue;
    const location = typeof s.location === 'string' ? s.location.trim() : '';
    const range = rangeOf(s);
    if (!location || !range || range.startDay > range.endDay || range.endDay >= TOTAL_DAYS) continue;
    const stay: Stay = {
      id: typeof s.id === 'string' && s.id ? s.id : crypto.randomUUID(),
      location,
      ...range,
    };
    if (typeof s.note === 'string' && s.note.trim()) stay.note = s.note.trim();
    if (out.some((o) => overlaps(o, stay) || o.id === stay.id)) continue;
    out.push(stay);
  }
  return out.sort((a, b) => a.startDay - b.startDay);
}

export function load(): Stay[] {
  try {
    const text = localStorage.getItem(KEY);
    return text ? sanitize(JSON.parse(text)) : [];
  } catch {
    return [];
  }
}

export function save(stays: Stay[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(serialize(stays)));
  } catch {
    // storage unavailable (private mode / quota) — keep working in memory
  }
}

export function colorFor(location: string): string {
  let h = 0;
  for (const ch of location.trim().toLowerCase()) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  // Golden-angle spread keeps similar names from landing on near-identical hues.
  return `hsl(${Math.round((h * 137.508) % 360)} 55% 42%)`;
}
