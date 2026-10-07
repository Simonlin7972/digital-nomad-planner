import { cityLabel, normalizeCity } from './cities';
import { countryLabel, normalizeCountry } from './flags';
import { t } from './i18n';
import { TOTAL_DAYS, WEEK_COUNT, YEAR, YEARS, dayOfIso, inYear, isoOfDay, type DayRange } from './weeks';

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
export function ticketLines(ticket: Ticket): string[] {
  const lines = [
    [ticket.airline, ticket.flightNo].filter(Boolean).join(' '),
    ticket.departure && t('ticket.departs', { time: ticket.departure.replace('T', ' ').replace(/-/g, '/') }),
    ticket.bookingRef && t('ticket.ref', { ref: ticket.bookingRef }),
    ticket.price && t('ticket.fare', { fare: ticket.price }),
  ].filter((l): l is string => Boolean(l));
  return lines.length ? lines : [t('ticket.none')];
}

export type Stay = DayRange & {
  id: string;
  // Either may be empty, but not both. Listed places are stored in a language-neutral form — an ISO code or
  // region id for the country, the English name for the city — and anything else as the user typed it.
  // Use countryOf / cityOf / placeName / placeFull to show them.
  country: string;
  city: string;
  color?: ColorKey;
  companions?: string; // who the trip is with, free text
  ticket?: Ticket;
  note?: string;
};

// Each year has its own plan; the key follows the year being planned.
const planKey = () => `dnp-plan-${YEAR}`;

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

// Cuts one stay in two at `day`, which becomes the first day of the second part. The first part keeps the id and
// the flight (that is the trip there); the second gets a new id and everything else, like an alt-drag copy.
// Null when `day` doesn't fall strictly inside the stay, so each part has at least one day.
export function splitStay(stays: Stay[], id: string, day: number): Stay[] | null {
  const stay = stays.find((s) => s.id === id);
  if (!stay || day <= stay.startDay || day > stay.endDay) return null;
  const second: Stay = { ...stay, id: crypto.randomUUID(), ticket: undefined, startDay: day, endDay: stay.endDay };
  return [...stays.map((s) => (s.id === id ? { ...s, endDay: day - 1 } : s)), second];
}

// Drops a new stay (an alt-drag copy) and makes room for it, insert-style: nothing before it moves, the original
// included. If it lands inside a stay that began earlier, it goes in right after that stay; whatever it then
// covers, and everything up to the next free gap, shifts later. Only when that would run past the end of the year
// does everything in the way move earlier instead, at the drop point. Null when neither fits.
export function insertStay(stays: Stay[], added: Stay): Stay[] | null {
  const sorted = [...stays].sort((a, b) => a.startDay - b.startDay);
  const len = added.endDay - added.startDay + 1;

  // Later: start after any stay already under the drop point, then shove the rest along.
  const later = (): Stay[] | null => {
    let startDay = added.startDay;
    for (const s of sorted) if (s.startDay < startDay && s.endDay >= startDay) startDay = s.endDay + 1;
    const placed = { ...added, startDay, endDay: startDay + len - 1 };
    if (placed.endDay >= TOTAL_DAYS) return null;
    const next = new Map<string, DayRange>();
    let edge = placed.endDay + 1;
    for (const s of sorted.filter((o) => o.startDay >= startDay)) {
      if (s.startDay >= edge) break;
      const endDay = edge + (s.endDay - s.startDay);
      if (endDay >= TOTAL_DAYS) return null;
      next.set(s.id, { startDay: edge, endDay });
      edge = endDay + 1;
    }
    return [...stays.map((s) => (next.has(s.id) ? { ...s, ...next.get(s.id)! } : s)), placed];
  };

  // Earlier, as a fallback near the end of the year: everything the copy covers moves back to make room.
  const earlier = (): Stay[] | null => {
    const next = new Map<string, DayRange>();
    let edge = added.startDay - 1;
    for (const s of sorted.filter((o) => o.startDay <= added.endDay).reverse()) {
      if (s.endDay <= edge) break;
      const startDay = edge - (s.endDay - s.startDay);
      if (startDay < 0) return null;
      next.set(s.id, { startDay, endDay: edge });
      edge = startDay - 1;
    }
    return [...stays.map((s) => (next.has(s.id) ? { ...s, ...next.get(s.id)! } : s)), added];
  };

  return later() ?? earlier();
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
    // Older files hold names ("泰國", "清邁") rather than codes; normalising accepts both.
    const country = normalizeCountry(typeof s.country === 'string' ? s.country : '');
    // Files from before the country/city split had a single `location`.
    const city = normalizeCity(country, typeof s.city === 'string' ? s.city : typeof s.location === 'string' ? s.location : '');
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
    const text = localStorage.getItem(planKey());
    return text ? sanitize(JSON.parse(text)) : [];
  } catch {
    return [];
  }
}

export function save(stays: Stay[]) {
  try {
    localStorage.setItem(planKey(), JSON.stringify(serialize(stays)));
  } catch {
    // storage unavailable (private mode / quota) — keep working in memory
  }
}

// Another year's plan, read from storage. The current year's lives in App's state; use that instead.
export const loadYearPlan = (year: number): Stay[] => inYear(year, load);

// Stores another year's plan directly. Only import does this: that year isn't on screen, so it has no undo stack.
export const saveYearPlan = (year: number, stays: Stay[]) => inYear(year, () => save(stays));

// The export file: every year that has stays, each in the single-year form. `current` is the year on screen,
// which may hold changes not yet read back from storage.
export function serializeAll(current: Stay[]) {
  const years: Record<string, ReturnType<typeof serialize>> = {};
  for (const year of YEARS) {
    const stays = year === YEAR ? current : loadYearPlan(year);
    if (stays.length) years[year] = inYear(year, () => serialize([...stays].sort((a, b) => a.startDay - b.startDay)));
  }
  return { version: 2, years };
}

// Reads an export back into plans per year, each sanitised against its own year's dates. Takes the multi-year
// form, or a single-year file (any older format), which goes to the year it names — 2027 if it names none,
// since files from before years could be chosen were all 2027.
export function sanitizeAll(data: unknown): Map<number, Stay[]> {
  const out = new Map<number, Stay[]>();
  const add = (year: number, part: unknown) => {
    if (!(YEARS as readonly number[]).includes(year)) return;
    const stays = inYear(year, () => sanitize(part));
    if (stays.length) out.set(year, stays);
  };
  const years = (data as { years?: unknown } | null)?.years;
  if (years && typeof years === 'object' && !Array.isArray(years)) {
    for (const [year, part] of Object.entries(years)) add(Number(year), part);
  } else {
    const named = Number((data as { year?: unknown } | null)?.year);
    add(Number.isInteger(named) ? named : 2027, data);
  }
  return out;
}

// Colour names for display come from the dictionary: t(`color.${key}`). Black comes first: it is the default
// for a new place.
export const PALETTE = [
  { key: 'black', hex: '#222222' },
  { key: 'red', hex: '#cf4b45' },
  { key: 'orange', hex: '#d97a1e' },
  { key: 'yellow', hex: '#a8841f' },
  { key: 'green', hex: '#4a9d5b' },
  { key: 'teal', hex: '#2a9d8f' },
  { key: 'blue', hex: '#3b82c4' },
  { key: 'purple', hex: '#7c5cc4' },
  { key: 'pink', hex: '#c2548f' },
] as const;

export type ColorKey = (typeof PALETTE)[number]['key'];

const isColorKey = (v: unknown): v is ColorKey => PALETTE.some((c) => c.key === v);

// Fallback for stays saved without a colour (older files). A fixed list of the eight original colours, so adding
// colours to the palette never changes how those stays look.
const HASHED: ColorKey[] = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'purple', 'pink'];
function hashColor(name: string): ColorKey {
  let h = 0;
  for (const ch of name.trim().toLowerCase()) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return HASHED[h % HASHED.length];
}

type Place = Pick<Stay, 'country' | 'city'>;

// A stay's country and city as shown to the user, in the current language.
export const countryOf = (p: Place) => countryLabel(p.country);
export const cityOf = (p: Place) => cityLabel(p.country, p.city);
// Short label for tight spaces (the city, or the country when no city is set).
export const placeName = (p: Place) => cityOf(p) || countryOf(p);
export const placeFull = (p: Place) => [countryOf(p), cityOf(p)].filter(Boolean).join(t('sep'));

// The stored values, not the labels, so a stay's fallback colour doesn't change with the language.
const placeKey = (p: Place) => `${p.country}/${p.city}`;

export const colorKeyOf = (stay: Place & Pick<Stay, 'color'>): ColorKey => stay.color ?? hashColor(placeKey(stay));

export const colorOf = (stay: Place & Pick<Stay, 'color'>): string =>
  PALETTE.find((c) => c.key === colorKeyOf(stay))!.hex;

// Suggested colour for a place: reuse what the same place already has, otherwise black.
export function defaultColor(place: Place, stays: Stay[]): ColorKey {
  const same = stays.find((s) => s.country === place.country && s.city === place.city);
  return same ? colorKeyOf(same) : 'black';
}
