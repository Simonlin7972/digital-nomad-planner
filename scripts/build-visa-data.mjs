// Rebuilds src/data/visa.json from the passport index dataset (https://github.com/imorte/passport-index-data,
// MIT). Run it by hand to refresh the data: node scripts/build-visa-data.mjs [YYYY-MM-DD]
// The date is when the dataset was last updated (see its README); it is shown beside the visa lines.
//
// The output keeps one string per passport, one code per destination in the order of `to`, joined with ",":
// a number is the visa-free days, f visa-free without a stated limit, a visa on arrival, t an electronic travel
// authorisation (ETA / ESTA), e an e-visa, r a visa required, x no admission, and an empty code the passport's own
// country.
import { writeFileSync } from 'node:fs';

const SOURCE_CSV = 'https://raw.githubusercontent.com/imorte/passport-index-data/main/passport-index-matrix-iso2.csv';
const updated = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const CODES = { 'visa free': 'f', 'visa on arrival': 'a', eta: 't', 'e-visa': 'e', 'visa required': 'r', 'no admission': 'x', '-1': '' };

const text = await (await fetch(SOURCE_CSV)).text();
const [head, ...rows] = text.trim().split(/\r?\n/).map((line) => line.split(','));
const to = head.slice(1).map((c) => c.toLowerCase());
const passports = {};
for (const [from, ...cells] of rows) {
  passports[from.toLowerCase()] = cells
    .map((v) => {
      if (/^\d+$/.test(v)) return v;
      if (v in CODES) return CODES[v];
      throw new Error(`Unknown value "${v}" for ${from}`);
    })
    .join(',');
}
writeFileSync(new URL('../src/data/visa.json', import.meta.url), JSON.stringify({ updated, source: 'https://github.com/imorte/passport-index-data', to, passports }));
console.log(`${Object.keys(passports).length} passports × ${to.length} destinations, updated ${updated}`);
