// Country names: the list offered in the editor, and the mapping from a (possibly free-text) name to the
// ISO code used by the flag-icons classes. Names come from the browser's own locale data, in Taiwan usage.

export type CountryOption = {
  name: string; // what gets stored on a stay, e.g. "泰國"
  en: string;
  code: string | null; // lower-case ISO code for the flag; null for regions without one
  keywords: string[]; // extra lower-case terms that should find this option
};

// Other spellings people type. Keys are lower-case; they resolve flags for free text and feed the search.
const ALIASES: Record<string, string> = {
  歐盟: 'eu',
  europe: 'eu',
  韓國: 'kr',
  南韓: 'kr',
  korea: 'kr',
  北韓: 'kp',
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
const NAME_OVERRIDES: Record<string, string> = { HK: '香港', MO: '澳門' };

// Codes the locale data knows that are not places you can plan a stay in: retired or duplicate codes,
// military outposts, pseudo-locales, and blocs (Europe is offered as a region below instead).
const NOT_COUNTRIES = new Set(['AC', 'CP', 'CQ', 'DG', 'EA', 'EU', 'EZ', 'FX', 'IC', 'QO', 'SU', 'TA', 'UN', 'XA', 'XB', 'ZZ']);

// Broader areas, for stays that are not pinned to one country.
const REGIONS: CountryOption[] = [
  { name: '歐洲', en: 'Europe', code: 'eu', keywords: ['歐盟', 'eu'] },
  { name: '亞洲', en: 'Asia', code: null, keywords: [] },
  { name: '東南亞', en: 'Southeast Asia', code: null, keywords: [] },
  { name: '中東', en: 'Middle East', code: null, keywords: [] },
  { name: '北美洲', en: 'North America', code: null, keywords: [] },
  { name: '中美洲', en: 'Central America', code: null, keywords: [] },
  { name: '南美洲', en: 'South America', code: null, keywords: [] },
  { name: '非洲', en: 'Africa', code: null, keywords: [] },
  { name: '大洋洲', en: 'Oceania', code: null, keywords: [] },
];

// Shown at the top of the unfiltered list, ahead of the stroke-ordered full list.
const COMMON = ['台灣', '日本', '南韓', '泰國', '越南', '馬來西亞', '印尼', '新加坡', '澳洲', '美國', '葡萄牙', '西班牙'];

// The locale data still names retired codes (DD East Germany, VD North Vietnam, BU Burma…), often with the
// same name as their successor. Canonicalising a locale replaces those, so a code that changes is not current.
function isCurrentCode(upper: string): boolean {
  try {
    return new Intl.Locale(`und-${upper}`).region === upper;
  } catch {
    return false;
  }
}

type Data = { options: CountryOption[]; codeByName: Map<string, string> };
let data: Data | null = null;

function build(): Data {
  const options: CountryOption[] = [];
  const codeByName = new Map<string, string>();
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  try {
    const names = (locale: string) => new Intl.DisplayNames([locale], { type: 'region', fallback: 'none' });
    const zhTW = names('zh-Hant-TW');
    const zhCN = names('zh-Hans');
    const en = names('en');
    for (const a of A) {
      for (const b of A) {
        const upper = a + b;
        const zh = zhTW.of(upper);
        const english = en.of(upper);
        if (!zh || !english || NOT_COUNTRIES.has(upper) || !isCurrentCode(upper)) continue;
        const code = upper.toLowerCase();
        const name = NAME_OVERRIDES[upper] ?? zh;
        const simplified = zhCN.of(upper);
        const keywords = [zh, simplified ?? '', code].map((k) => k.toLowerCase());
        options.push({ name, en: english, code, keywords });
        for (const key of [name, zh, english, simplified ?? '']) {
          if (key && !codeByName.has(key.toLowerCase())) codeByName.set(key.toLowerCase(), code);
        }
      }
    }
  } catch {
    // Intl.DisplayNames unavailable: only regions and aliases remain, and the field still accepts free text
  }
  for (const [alias, code] of Object.entries(ALIASES)) {
    codeByName.set(alias, code);
    options.find((o) => o.code === code)?.keywords.push(alias);
  }
  options.sort((x, y) => x.name.localeCompare(y.name, 'zh-Hant-TW'));
  for (const region of REGIONS) {
    options.push(region);
    if (region.code) codeByName.set(region.name.toLowerCase(), region.code);
  }
  return { options, codeByName };
}

const get = () => (data ??= build());

export function flagCode(country: string): string | null {
  return get().codeByName.get(country.trim().toLowerCase()) ?? null;
}

// The listed (Chinese) name for an ISO code, e.g. "th" -> "泰國".
export function countryNameOf(code: string): string | null {
  return get().options.find((o) => o.code === code && o.keywords.includes(code))?.name ?? null;
}

export function isListedCountry(name: string): boolean {
  return get().options.some((o) => o.name === name.trim());
}

// Options for the country picker. An empty query lists everything: countries already in the plan, then a few
// common ones, then the rest;
// otherwise matches on the Chinese name, English name, code or an alias, best matches first.
export function searchCountries(query: string, recent: string[]): CountryOption[] {
  const { options } = get();
  const q = query.trim().toLowerCase();
  if (!q) {
    const first = [...new Set([...recent, ...COMMON])].flatMap((name) => options.find((o) => o.name === name) ?? []);
    return [...first, ...options.filter((o) => !first.includes(o))];
  }
  const rank = (o: CountryOption) => {
    const terms = [o.name.toLowerCase(), o.en.toLowerCase(), ...o.keywords];
    if (terms.some((t) => t === q)) return 0;
    if (terms.some((t) => t.startsWith(q))) return 1;
    if (terms.some((t) => t.includes(q))) return 2;
    return -1;
  };
  return options
    .map((o) => ({ o, r: rank(o) }))
    .filter((x) => x.r >= 0)
    .sort((x, y) => x.r - y.r)
    .map((x) => x.o);
}
