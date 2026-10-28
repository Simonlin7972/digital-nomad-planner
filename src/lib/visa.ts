// Entry rules for the destinations in the plan, for the passport given on the settings page: how long a visit can
// be without a visa, or what has to be arranged first. The data is the passport index dataset
// (src/data/visa.json, rebuilt by scripts/build-visa-data.mjs), loaded as its own chunk once a passport is set.
// Nothing is shown without a passport. It is a reminder only; the rules change and the official sources decide.
import { getProfile } from './profile';
import { getEdges, type Stay } from './storage';
import { isSchengen } from './stayRules';
import { t } from './i18n';

export type VisaKind = 'days' | 'free' | 'arrival' | 'eta' | 'evisa' | 'required' | 'banned' | 'permit';
export type Visa = { kind: VisaKind; days?: number };

type Data = { updated: string; source: string; to: string[]; passports: Record<string, string> };
let data: Data | null = null;
let table: Map<string, Map<string, string>> | null = null;
let loading = false;
const listeners = new Set<() => void>();

// Starts loading the data, once; subscribers hear when it has arrived.
export function loadVisaData() {
  if (data || loading) return;
  loading = true;
  import('../data/visa.json')
    .then((m) => {
      data = m.default as Data;
      table = new Map();
      listeners.forEach((notify) => notify());
    })
    .catch(() => {
      loading = false; // offline before the chunk was cached: try again next time
    });
}
export function subscribeVisa(notify: () => void) {
  listeners.add(notify);
  return () => listeners.delete(notify);
}
export const visaReady = () => data !== null;
export const visaUpdated = () => data?.updated ?? '';

// Where the dataset can't say what applies: entry that needs a document other than a visa.
const OVERRIDES: Record<string, Record<string, Visa>> = {
  tw: { cn: { kind: 'permit' } }, // the Mainland Travel Permit for Taiwan Residents (台胞證)
};

const KINDS: Record<string, VisaKind> = { f: 'free', a: 'arrival', t: 'eta', e: 'evisa', r: 'required', x: 'banned' };

function row(passport: string): Map<string, string> | null {
  if (!data || !table) return null;
  let r = table.get(passport);
  if (!r) {
    const line = data.passports[passport];
    if (!line) return null;
    const cells = line.split(',');
    r = new Map(data.to.map((to, i) => [to, cells[i]]));
    table.set(passport, r);
  }
  return r;
}

// What entering `country` takes on the profile's passport. Null with no passport set, before the data has loaded,
// for the passport's own country, or for a place the data doesn't list (a region, or a country typed by hand).
export function visaFor(country: string, passport = getProfile().passport): Visa | null {
  if (!passport || !country || passport === country) return null;
  const override = OVERRIDES[passport]?.[country];
  if (override) return override;
  const code = row(passport)?.get(country);
  if (!code) return null;
  return /^\d+$/.test(code) ? { kind: 'days', days: Number(code) } : { kind: KINDS[code] };
}

// The visa line's text: "Visa-free for 90 days", "Needs an e-visa before you go".
export function visaText(visa: Visa, country: string): string {
  const text = visa.kind === 'days' ? t('visa.days', { n: visa.days! }) : t(`visa.${visa.kind}`);
  // Schengen's 90 days are shared across the area, which the summary counts (stayRules).
  return visa.kind === 'days' && isSchengen(country) ? `${text}${t('visa.schengen')}` : text;
}

// Whether the visit needs something done before leaving.
export const needsArranging = (visa: Visa) => ['eta', 'evisa', 'required', 'permit', 'banned'].includes(visa.kind);

export type Overstay = { allowed: number; length: number };

// Stays that run past the visa-free days: back-to-back stays in one country count as one visit (no exit between
// them), including a neighbouring year's stay that runs on into this one. Schengen is left to its own 90/180 count.
export function visaOverstays(stays: Stay[]): Map<string, Overstay> {
  const out = new Map<string, Overstay>();
  if (!getProfile().passport || !data) return out;
  const sorted = [...stays, ...getEdges().ghosts].sort((a, b) => a.startDay - b.startDay);
  let run: Stay[] = [];
  const close = () => {
    if (!run.length) return;
    const country = run[0].country;
    const visa = visaFor(country);
    const length = Math.max(...run.map((s) => s.endDay)) - run[0].startDay + 1;
    if (visa?.kind === 'days' && !isSchengen(country) && length > visa.days!) {
      for (const s of run) out.set(s.id, { allowed: visa.days!, length });
    }
    run = [];
  };
  for (const s of sorted) {
    const last = run[run.length - 1];
    if (last && (s.country !== last.country || s.startDay > Math.max(...run.map((r) => r.endDay)) + 1)) close();
    run.push(s);
  }
  close();
  return out;
}
