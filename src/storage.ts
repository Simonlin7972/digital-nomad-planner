import { TOTAL_DAYS, WEEK_COUNT, YEAR, dayOfIso, isoOfDay, type DayRange } from './weeks';

export type Stay = DayRange & {
  id: string;
  country: string; // either may be empty, but not both
  city: string;
  color?: ColorKey;
  companions?: string; // who the trip is with, free text
  note?: string;
};

const KEY = `dnp-plan-${YEAR}`;

export function overlaps(a: DayRange, b: DayRange) {
  return a.startDay <= b.endDay && b.startDay <= a.endDay;
}

// Exchanges two stays' places in the sequence. Each keeps its length; anything between them slides by the
// length difference, so the overall span is unchanged and nothing overlaps.
export function swapStays(stays: Stay[], idA: string, idB: string): Stay[] {
  let a = stays.find((s) => s.id === idA);
  let b = stays.find((s) => s.id === idB);
  if (!a || !b || a === b) return stays;
  if (a.startDay > b.startDay) [a, b] = [b, a];
  const first = a;
  const second = b;
  const lenA = first.endDay - first.startDay + 1;
  const lenB = second.endDay - second.startDay + 1;
  const shift = lenB - lenA;
  return stays.map((s) => {
    if (s.id === first.id) return { ...s, startDay: second.endDay - lenA + 1, endDay: second.endDay };
    if (s.id === second.id) return { ...s, startDay: first.startDay, endDay: first.startDay + lenB - 1 };
    if (s.startDay > first.endDay && s.endDay < second.startDay) {
      return { ...s, startDay: s.startDay + shift, endDay: s.endDay + shift };
    }
    return s;
  });
}

// Stays are stored with ISO dates so exported files stay readable.
export function serialize(stays: Stay[]) {
  return {
    year: YEAR,
    stays: stays.map((s) => ({
      id: s.id,
      country: s.country,
      city: s.city,
      start: isoOfDay(s.startDay),
      end: isoOfDay(s.endDay),
      ...(s.color ? { color: s.color } : {}),
      ...(s.companions ? { companions: s.companions } : {}),
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
    const country = typeof s.country === 'string' ? s.country.trim() : '';
    // Files from before the country/city split had a single `location`.
    const city = (typeof s.city === 'string' ? s.city : typeof s.location === 'string' ? s.location : '').trim();
    const range = rangeOf(s);
    if ((!country && !city) || !range || range.startDay > range.endDay || range.endDay >= TOTAL_DAYS) continue;
    const stay: Stay = {
      id: typeof s.id === 'string' && s.id ? s.id : crypto.randomUUID(),
      country,
      city,
      ...range,
    };
    if (isColorKey(s.color)) stay.color = s.color;
    if (typeof s.companions === 'string' && s.companions.trim()) stay.companions = s.companions.trim();
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

export const PALETTE = [
  { key: 'red', name: '紅', hex: '#cf4b45' },
  { key: 'orange', name: '橘', hex: '#d97a1e' },
  { key: 'yellow', name: '黃', hex: '#a8841f' },
  { key: 'green', name: '綠', hex: '#4a9d5b' },
  { key: 'teal', name: '青', hex: '#2a9d8f' },
  { key: 'blue', name: '藍', hex: '#3b82c4' },
  { key: 'purple', name: '紫', hex: '#7c5cc4' },
  { key: 'pink', name: '粉', hex: '#c2548f' },
] as const;

export type ColorKey = (typeof PALETTE)[number]['key'];

const isColorKey = (v: unknown): v is ColorKey => PALETTE.some((c) => c.key === v);

function hashColor(name: string): ColorKey {
  let h = 0;
  for (const ch of name.trim().toLowerCase()) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return PALETTE[h % PALETTE.length].key;
}

type Place = Pick<Stay, 'country' | 'city'>;

// Short label for tight spaces (the city, or the country when no city is set).
export const placeName = (p: Place) => p.city || p.country;
export const placeFull = (p: Place) => [p.country, p.city].filter(Boolean).join('・');

export const colorKeyOf = (stay: Place & Pick<Stay, 'color'>): ColorKey => stay.color ?? hashColor(placeFull(stay));

export const colorOf = (stay: Place & Pick<Stay, 'color'>): string =>
  PALETTE.find((c) => c.key === colorKeyOf(stay))!.hex;

// Suggested colour for a place: reuse what the same place already has, otherwise pick one from its name.
export function defaultColor(place: Place, stays: Stay[]): ColorKey {
  const same = stays.find((s) => s.country === place.country && s.city === place.city);
  return same ? colorKeyOf(same) : hashColor(placeFull(place));
}
