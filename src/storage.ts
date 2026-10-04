import { TOTAL_DAYS, WEEK_COUNT, YEAR, dayOfIso, isoOfDay, type DayRange } from './weeks';

// Flight booked for getting to a stay. Every field is optional free text; the object existing means "booked".
export type Ticket = { airline?: string; flightNo?: string; departure?: string; bookingRef?: string; price?: string };
export const TICKET_FIELDS = ['airline', 'flightNo', 'departure', 'bookingRef', 'price'] as const;

export function cleanTicket(raw: unknown): Ticket | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const ticket: Ticket = {};
  for (const key of TICKET_FIELDS) {
    const value = (raw as Record<string, unknown>)[key];
    if (typeof value === 'string' && value.trim()) ticket[key] = value.trim().slice(0, 80);
  }
  return ticket;
}

// Human-readable lines for a ticket, for the info card.
export function ticketLines(t: Ticket): string[] {
  const lines = [
    [t.airline, t.flightNo].filter(Boolean).join(' '),
    t.departure && `起飛 ${t.departure.replace('T', ' ').replace(/-/g, '/')}`,
    t.bookingRef && `訂位代號 ${t.bookingRef}`,
    t.price && `票價 ${t.price}`,
  ].filter((l): l is string => Boolean(l));
  return lines.length ? lines : ['尚未填寫細節'];
}

export type Stay = DayRange & {
  id: string;
  country: string; // either may be empty, but not both
  city: string;
  color?: ColorKey;
  companions?: string; // who the trip is with, free text
  ticket?: Ticket;
  note?: string;
};

const KEY = `dnp-plan-${YEAR}`;

export function overlaps(a: DayRange, b: DayRange) {
  return a.startDay <= b.endDay && b.startDay <= a.endDay;
}

// Resizes one stay to `range`, shoving whatever is in the way: neighbours slide in the direction of the move,
// each pushing the next, and gaps soak up the push. Order never changes. Null if a stay would leave the year.
export function pushStays(stays: Stay[], id: string, range: DayRange): Stay[] | null {
  const moved = stays.find((s) => s.id === id);
  if (!moved) return null;
  const next = new Map<string, DayRange>([[id, range]]);
  const others = stays.filter((s) => s.id !== id).sort((a, b) => a.startDay - b.startDay);

  let edge = range.endDay + 1; // first free day to the right
  for (const s of others.filter((o) => o.startDay > moved.startDay)) {
    if (s.startDay >= edge) break;
    const endDay = edge + (s.endDay - s.startDay);
    if (endDay >= TOTAL_DAYS) return null;
    next.set(s.id, { startDay: edge, endDay });
    edge = endDay + 1;
  }

  edge = range.startDay - 1; // last free day to the left
  for (const s of others.filter((o) => o.startDay < moved.startDay).reverse()) {
    if (s.endDay <= edge) break;
    const startDay = edge - (s.endDay - s.startDay);
    if (startDay < 0) return null;
    next.set(s.id, { startDay, endDay: edge });
    edge = startDay - 1;
  }

  return stays.map((s) => (next.has(s.id) ? { ...s, ...next.get(s.id)! } : s));
}

const len = (r: DayRange) => r.endDay - r.startDay + 1;

// Exchanges two neighbouring stays. Each keeps its length and the gap between them, so the span they cover
// together is unchanged.
function swapNeighbours(stays: Stay[], first: Stay, second: Stay): Stay[] {
  return stays.map((s) => {
    if (s.id === first.id) return { ...s, startDay: second.endDay - len(first) + 1, endDay: second.endDay };
    if (s.id === second.id) return { ...s, startDay: first.startDay, endDay: first.startDay + len(second) - 1 };
    return s;
  });
}

// Drags one stay toward `desired`, list-reorder style: once its leading edge passes the middle of a neighbour
// the two trade places, then the next neighbour, and so on. Between neighbours it slides freely.
export function reorderStays(stays: Stay[], id: string, desired: DayRange): Stay[] {
  const orig = stays.find((s) => s.id === id);
  if (!orig || desired.startDay === orig.startDay) return stays;
  const dir = desired.startDay > orig.startDay ? 1 : -1;
  let cur = stays;
  const neighbours = () => {
    const sorted = [...cur].sort((a, b) => a.startDay - b.startDay);
    const i = sorted.findIndex((s) => s.id === id);
    return { me: sorted[i], prev: sorted[i - 1] as Stay | undefined, next: sorted[i + 1] as Stay | undefined };
  };
  for (;;) {
    const { me, prev, next } = neighbours();
    const other = dir > 0 ? next : prev;
    if (!other) break;
    const middle = (other.startDay + other.endDay) / 2;
    if (dir > 0 ? desired.endDay < middle : desired.startDay > middle) break;
    cur = dir > 0 ? swapNeighbours(cur, me, other) : swapNeighbours(cur, other, me);
  }
  const { me, prev, next } = neighbours();
  const lo = prev ? prev.endDay + 1 : 0;
  const hi = (next ? next.startDay : TOTAL_DAYS) - len(me);
  const startDay = Math.min(hi, Math.max(lo, desired.startDay));
  return cur.map((s) => (s.id === id ? { ...s, startDay, endDay: startDay + len(me) - 1 } : s));
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
      ...(s.ticket ? { ticket: s.ticket } : {}),
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
    const ticket = cleanTicket(s.ticket);
    if (ticket) stay.ticket = ticket;
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
