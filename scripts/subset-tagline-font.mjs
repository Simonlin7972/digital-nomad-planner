// Cuts the Traditional Chinese pixel face (俐方體 11 號, Cubic 11, OFL) down to the characters the Chinese
// tagline uses, so the page ships a few KB instead of the 2.7 MB font. Run it again whenever the zh
// `app.tagline.*` strings change:
//
//   node scripts/subset-tagline-font.mjs path/to/Cubic_11.ttf
//
// The full font is not kept in the repository; download it from https://github.com/ACh-K/Cubic-11 first.
import { readFileSync, writeFileSync } from 'node:fs';
import subsetFont from 'subset-font';

const source = process.argv[2];
if (!source) {
  console.error('usage: node scripts/subset-tagline-font.mjs <Cubic_11.ttf>');
  process.exit(1);
}

// Pull the phrases straight out of the dictionary so the subset can't drift from the text.
const i18n = readFileSync(new URL('../src/lib/i18n.tsx', import.meta.url), 'utf8');
const zh = i18n.slice(i18n.indexOf('const zh = {'), i18n.indexOf('const en'));
const phrases = [...zh.matchAll(/'app\.tagline\.\d': '([^']*)'/g)].map((m) => m[1]);
if (phrases.length !== 3) throw new Error(`expected 3 zh taglines, found ${phrases.length}`);

const text = [...new Set(phrases.join(''))].join('');
const woff2 = await subsetFont(readFileSync(source), text, { targetFormat: 'woff2' });
const out = new URL('../src/assets/cubic11-tagline.woff2', import.meta.url);
writeFileSync(out, woff2);
console.log(`${text.length} glyphs -> ${woff2.length} bytes at ${out.pathname}`);
