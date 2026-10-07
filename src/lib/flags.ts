// Countries: the list offered in the editor, how a stay's country is stored, and how it is shown.
//
// A stay stores its country as a lower-case ISO code ("th") when it is a listed country, as a region id
// ("south-america") for the few broader areas, and otherwise as whatever text was typed. Names are produced
// from the browser's own locale data, so they follow the current language.
import { getLocale, type Locale } from './i18n';

export type CountryOption = {
  value: string; // what gets stored on a stay
  name: string; // shown, in the current language
  sub: string; // the name in the other language
  code: string | null; // ISO code for the flag; null where there is none
};

type Entry = { value: string; code: string | null; zh: string; en: string; ja: string; keywords: string[] };

// Other spellings people type. Keys are lower-case; values are entry values.
const ALIASES: Record<string, string> = {
  歐盟: 'europe',
  eu: 'europe',
  韓國: 'kr',
  korea: 'kr',
  澳大利亞: 'au',
  新西蘭: 'nz',
  usa: 'us',
  america: 'us',
  uk: 'gb',
  england: 'gb',
  britain: 'gb',
  大陸: 'cn',
  臺灣: 'tw',
  阿聯: 'ae',
  阿聯酋: 'ae',
  杜拜: 'ae',
  uae: 'ae',
  俄國: 'ru',
  holland: 'nl',
  czechia: 'cz',
  turkey: 'tr',
  vietnam: 'vn',
  laos: 'la',
  峇里島: 'id',
  bali: 'id',
};

// Shorter everyday names than the official ones the locale data gives.
const ZH_OVERRIDES: Record<string, string> = { HK: '香港', MO: '澳門' };
const EN_OVERRIDES: Record<string, string> = { HK: 'Hong Kong', MO: 'Macau' };
const JA_OVERRIDES: Record<string, string> = { HK: '香港', MO: 'マカオ' };

// Codes the locale data knows that are not places you can plan a stay in: military outposts, pseudo-locales
// and blocs (Europe is offered as a region below instead).
const NOT_COUNTRIES = new Set(['AC', 'CP', 'CQ', 'DG', 'EA', 'EU', 'EZ', 'IC', 'QO', 'TA', 'UN', 'XA', 'XB', 'ZZ']);

// Broader areas, for stays that are not pinned to one country.
const REGIONS: Entry[] = [
  { value: 'europe', code: 'eu', zh: '歐洲', en: 'Europe', ja: 'ヨーロッパ', keywords: [] },
  { value: 'asia', code: null, zh: '亞洲', en: 'Asia', ja: 'アジア', keywords: [] },
  { value: 'southeast-asia', code: null, zh: '東南亞', en: 'Southeast Asia', ja: '東南アジア', keywords: [] },
  { value: 'middle-east', code: null, zh: '中東', en: 'Middle East', ja: '中東', keywords: [] },
  { value: 'north-america', code: null, zh: '北美洲', en: 'North America', ja: '北アメリカ', keywords: [] },
  { value: 'central-america', code: null, zh: '中美洲', en: 'Central America', ja: '中央アメリカ', keywords: [] },
  { value: 'south-america', code: null, zh: '南美洲', en: 'South America', ja: '南アメリカ', keywords: [] },
  { value: 'africa', code: null, zh: '非洲', en: 'Africa', ja: 'アフリカ', keywords: [] },
  { value: 'oceania', code: null, zh: '大洋洲', en: 'Oceania', ja: 'オセアニア', keywords: [] },
];

// Shown at the top of the unfiltered list, ahead of the alphabetical full list.
const COMMON = ['tw', 'jp', 'kr', 'th', 'vn', 'my', 'id', 'sg', 'au', 'us', 'pt', 'es'];

// The locale data still names retired codes (DD East Germany, VD North Vietnam, BU Burma…), often with the
// same name as their successor. Canonicalising a locale replaces those, so a code that changes is not current.
function isCurrentCode(upper: string): boolean {
  try {
    return new Intl.Locale(`und-${upper}`).region === upper;
  } catch {
    return false;
  }
}

type Data = { entries: Entry[]; byValue: Map<string, Entry>; byName: Map<string, Entry> };
let data: Data | null = null;

function build(): Data {
  const entries: Entry[] = [];
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  try {
    const names = (locale: string) => new Intl.DisplayNames([locale], { type: 'region', fallback: 'none' });
    const zhTW = names('zh-Hant-TW');
    const zhCN = names('zh-Hans');
    const english = names('en');
    const japanese = names('ja');
    for (const a of A) {
      for (const b of A) {
        const upper = a + b;
        const zh = zhTW.of(upper);
        const en = english.of(upper);
        const ja = japanese.of(upper) ?? '';
        if (!zh || !en || NOT_COUNTRIES.has(upper) || !isCurrentCode(upper)) continue;
        const code = upper.toLowerCase();
        entries.push({
          value: code,
          code,
          zh: ZH_OVERRIDES[upper] ?? zh,
          en: EN_OVERRIDES[upper] ?? en,
          ja: JA_OVERRIDES[upper] ?? (ja || en),
          // The official names stay searchable where a shorter one is shown, as does the Simplified name.
          keywords: [zh, en, ja, zhCN.of(upper) ?? ''].map((k) => k.toLowerCase()),
        });
      }
    }
  } catch {
    // Intl.DisplayNames unavailable: only the regions remain, and the field still accepts free text
  }
  entries.push(...REGIONS);

  const byValue = new Map(entries.map((e) => [e.value, e]));
  const byName = new Map<string, Entry>();
  for (const e of entries) {
    for (const key of [e.zh, e.en, ...e.keywords]) {
      if (key && !byName.has(key.toLowerCase())) byName.set(key.toLowerCase(), e);
    }
  }
  for (const [alias, value] of Object.entries(ALIASES)) {
    const entry = byValue.get(value);
    if (!entry) continue;
    byName.set(alias, entry);
    entry.keywords.push(alias);
  }
  return { entries, byValue, byName };
}

const get = () => (data ??= build());

// The entry a stored value or a typed name refers to, if any.
function find(country: string): Entry | undefined {
  const key = country.trim().toLowerCase();
  const { byValue, byName } = get();
  return byValue.get(key) ?? byName.get(key);
}

const nameIn = (e: Entry, locale: Locale) => e[locale];

// What to store for a typed or picked country: its code or region id when recognised, else the text itself.
export function normalizeCountry(country: string): string {
  return find(country)?.value ?? country.trim();
}

// What to show for a stored country, in the given language (the current one by default).
export function countryLabel(country: string, locale: Locale = getLocale()): string {
  const entry = find(country);
  return entry ? nameIn(entry, locale) : country;
}

export function flagCode(country: string): string | null {
  return find(country)?.code ?? null;
}

export function isListedCountry(country: string): boolean {
  return Boolean(find(country));
}

// Options for the country picker. An empty query lists everything: countries already in the plan, then a few
// common ones, then the rest in name order; otherwise matches on the name in either language, the code or an
// alias, best matches first.
export function searchCountries(query: string, recent: string[]): CountryOption[] {
  const locale = getLocale();
  const { entries, byValue } = get();
  // The secondary name: English under a Chinese or Japanese name, Chinese under an English one.
  const other: Locale = locale === 'en' ? 'zh' : 'en';
  const option = (e: Entry): CountryOption => ({ value: e.value, name: nameIn(e, locale), sub: nameIn(e, other), code: e.code });

  const q = query.trim().toLowerCase();
  if (!q) {
    const first = [...new Set([...recent.map(normalizeCountry), ...COMMON])].flatMap((v) => byValue.get(v) ?? []);
    const regions = entries.filter((e) => REGIONS.includes(e) && !first.includes(e));
    const rest = entries
      .filter((e) => !first.includes(e) && !REGIONS.includes(e))
      .sort((x, y) => nameIn(x, locale).localeCompare(nameIn(y, locale), locale === 'zh' ? 'zh-Hant-TW' : locale));
    return [...first, ...rest, ...regions].map(option);
  }
  const rank = (e: Entry) => {
    const terms = [e.zh.toLowerCase(), e.en.toLowerCase(), e.ja.toLowerCase(), e.value, ...e.keywords];
    if (terms.some((term) => term === q)) return 0;
    if (terms.some((term) => term.startsWith(q))) return 1;
    if (terms.some((term) => term.includes(q))) return 2;
    return -1;
  };
  return entries
    .map((e) => ({ e, r: rank(e) }))
    .filter((x) => x.r >= 0)
    .sort((x, y) => x.r - y.r)
    .map((x) => option(x.e));
}
