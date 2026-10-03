import { WEEK_COUNT, YEAR } from './weeks';

export type Stay = {
  id: string;
  location: string;
  startWeek: number;
  endWeek: number; // inclusive
  note?: string;
};

export type Plan = { year: number; stays: Stay[] };

const KEY = `dnp-plan-${YEAR}`;

export function overlaps(a: { startWeek: number; endWeek: number }, b: { startWeek: number; endWeek: number }) {
  return a.startWeek <= b.endWeek && b.startWeek <= a.endWeek;
}

// Keeps only well-formed, non-overlapping stays so a bad file can't corrupt the timeline.
export function sanitize(data: unknown): Stay[] {
  const raw = Array.isArray(data) ? data : (data as Plan | null)?.stays;
  if (!Array.isArray(raw)) return [];
  const out: Stay[] = [];
  for (const s of raw) {
    if (!s || typeof s !== 'object') continue;
    const location = typeof s.location === 'string' ? s.location.trim() : '';
    const { startWeek, endWeek } = s;
    if (!location || !Number.isInteger(startWeek) || !Number.isInteger(endWeek)) continue;
    if (startWeek < 0 || endWeek >= WEEK_COUNT || startWeek > endWeek) continue;
    const stay: Stay = {
      id: typeof s.id === 'string' && s.id ? s.id : crypto.randomUUID(),
      location,
      startWeek,
      endWeek,
    };
    if (typeof s.note === 'string' && s.note.trim()) stay.note = s.note.trim();
    if (out.some((o) => overlaps(o, stay) || o.id === stay.id)) continue;
    out.push(stay);
  }
  return out.sort((a, b) => a.startWeek - b.startWeek);
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
    const plan: Plan = { year: YEAR, stays };
    localStorage.setItem(KEY, JSON.stringify(plan));
  } catch {
    // storage unavailable (private mode / quota) — keep working in memory
  }
}

export function colorFor(location: string): string {
  let h = 0;
  for (const ch of location.trim().toLowerCase()) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return `hsl(${h % 360} 55% 42%)`;
}
