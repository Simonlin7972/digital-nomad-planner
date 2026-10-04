// Maps a free-text country name (Chinese or English) to the ISO code used by the flag-icons classes.

const ALIASES: Record<string, string> = {
  歐洲: 'eu',
  歐盟: 'eu',
  europe: 'eu',
  eu: 'eu',
  韓國: 'kr',
  南韓: 'kr',
  北韓: 'kp',
  korea: 'kr',
  澳大利亞: 'au',
  紐西蘭: 'nz',
  新西蘭: 'nz',
  美國: 'us',
  usa: 'us',
  us: 'us',
  america: 'us',
  英國: 'gb',
  uk: 'gb',
  england: 'gb',
  香港: 'hk',
  澳門: 'mo',
  中國: 'cn',
  大陸: 'cn',
  臺灣: 'tw',
  阿聯: 'ae',
  阿聯酋: 'ae',
  杜拜: 'ae',
  uae: 'ae',
  俄國: 'ru',
  荷蘭: 'nl',
  holland: 'nl',
  捷克: 'cz',
  czechia: 'cz',
  土耳其: 'tr',
  turkey: 'tr',
  越南: 'vn',
  vietnam: 'vn',
  寮國: 'la',
  laos: 'la',
  峇里島: 'id',
  bali: 'id',
};

let index: Map<string, string> | null = null;

// Every ISO region the browser knows, by its Traditional Chinese, Simplified Chinese and English name.
function buildIndex(): Map<string, string> {
  const map = new Map<string, string>();
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  try {
    const locales = ['en', 'zh-Hans', 'zh-Hant-TW'].map((l) => new Intl.DisplayNames([l], { type: 'region', fallback: 'none' }));
    for (const a of A) {
      for (const b of A) {
        const code = a + b;
        for (const names of locales) {
          const name = names.of(code);
          // First code wins: retired duplicates such as FX ("Metropolitan France") come after the real one.
          if (name && !map.has(name.toLowerCase())) map.set(name.toLowerCase(), code.toLowerCase());
        }
      }
    }
  } catch {
    // Intl.DisplayNames unavailable: only the aliases below will match
  }
  for (const [name, code] of Object.entries(ALIASES)) map.set(name, code);
  return map;
}

export function flagCode(country: string): string | null {
  index ??= buildIndex();
  return index.get(country.trim().toLowerCase()) ?? null;
}
