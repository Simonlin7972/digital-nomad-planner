// One-off: downloads a small logo for every airline in src/lib/airlines.ts into public/airlines/<CODE>.png, so the
// airline picker shows logos without asking a third party at runtime. Already downloaded files are kept; run it
// again after adding airlines: `node scripts/fetch-airline-logos.mjs`.
// Source: Kiwi.com's public airline images (64px). The logos are the airlines' trademarks, used only to identify them.
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';

const SOURCE = (code) => `https://images.kiwi.com/airlines/64/${code}.png`;
const OUT = new URL('../public/airlines/', import.meta.url);

const list = await readFile(new URL('../src/lib/airlines.ts', import.meta.url), 'utf8');
const codes = [...list.matchAll(/^\s*\['([A-Z0-9]{2})',/gm)].map((m) => m[1]);

let fetched = 0;
const missing = [];
for (const code of codes) {
  const file = new URL(`${code}.png`, OUT);
  if (existsSync(file)) continue;
  const res = await fetch(SOURCE(code));
  if (!res.ok || !res.headers.get('content-type')?.startsWith('image/')) {
    missing.push(code);
    continue;
  }
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  fetched++;
}
console.log(`${codes.length} airlines: ${fetched} logos downloaded${missing.length ? `, none found for ${missing.join(' ')}` : ''}`);
