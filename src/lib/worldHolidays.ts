// Public holidays for the countries in the plan, from the date-holidays package (https://github.com/commenthol/date-holidays,
// data CC-BY-3.0). It holds every country's rules and is large, so it is a separate chunk, loaded only once the plan
// has a country the hand-written sets in holidays.ts don't cover. Nothing goes over the network but that chunk.
import type HolidaysLib from 'date-holidays';
import { getLocale } from './i18n';
import { YEAR, dayOfIso } from './weeks';
import type { Holiday } from './holidays';

type Ctor = typeof HolidaysLib;
let Lib: Ctor | null = null;
let loading = false;
const listeners = new Set<() => void>();

// Starts loading the library, once; subscribers hear when it has arrived.
export function loadWorldHolidays() {
  if (Lib || loading) return;
  loading = true;
  import('date-holidays')
    .then((m) => {
      Lib = m.default;
      listeners.forEach((notify) => notify());
    })
    .catch(() => {
      // Offline before the chunk was cached: try again the next time it is asked for.
      loading = false;
    });
}

export function subscribeWorldHolidays(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}
export const worldHolidaysReady = () => Lib !== null;

// The library names holidays in English for every country, and in a few languages for some. Use the interface
// language only where it is one of the country's own (Chinese for Taiwan, Japanese for Japan), so a set isn't
// half translated; everything else is English.
function languageFor(native: string[]): string {
  const locale = getLocale();
  if (locale === 'zh' && native.includes('zh')) return 'zh';
  if (locale === 'ja' && (native.includes('ja') || native.includes('jp'))) return 'ja';
  return 'en';
}

const cache = new Map<string, Holiday[]>();

// A country's public holidays on this year's timeline (including the days it borrows from the years either side),
// consecutive days of the same holiday joined into one. Null until the library has loaded; empty for a country it
// doesn't know.
export function worldHolidays(code: string): Holiday[] | null {
  if (!Lib) return null;
  const key = `${YEAR}/${getLocale()}/${code}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const hd = new Lib();
  hd.init(code.toUpperCase());
  const lang = languageFor(hd.getLanguages());
  const days = [YEAR - 1, YEAR, YEAR + 1]
    .flatMap((year) => hd.getHolidays(year, lang))
    .filter((h) => h.type === 'public')
    .flatMap((h) => {
      const day = dayOfIso(h.date.slice(0, 10));
      return day === null ? [] : [{ day, name: h.name }];
    })
    .sort((a, b) => a.day - b.day);
  const out: Holiday[] = [];
  for (const { day, name } of days) {
    const last = out[out.length - 1];
    if (last && last.name === name && last.endDay >= day - 1) last.endDay = Math.max(last.endDay, day);
    else if (!(last && last.startDay <= day && day <= last.endDay)) out.push({ startDay: day, endDay: day, name, short: name });
  }
  cache.set(key, out);
  return out;
}
