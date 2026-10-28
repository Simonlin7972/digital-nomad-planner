// Records the country + city picker demo: a 1080×1350 (Instagram 4:5) MP4 of the real /demo/ page's country and
// city canvas, driven by real mouse and keyboard input, with a drawn cursor and no captions.
//
//   npm run record:picker                      # writes docs/picker-demo-4x5.mp4
//   npm run record:picker -- path/to/out.mp4   # somewhere else
//
// Needs Google Chrome installed (or CHROME=/path/to/chrome) and ffmpeg on the PATH. No dev server: the script makes
// its own production build of the demo page in a temporary folder and serves it. Takes about 5 minutes; the
// script prints each step and the field values after every pick, which should read 泰國/ → 泰國/清邁 → 日本/ →
// 葡萄牙/里斯本 → Narnia/里斯本.
//
// How it stays smooth: headless Chrome renders this page several times slower than a normal browser (opening a
// 260-row list takes about a second). So the take is recorded in slow motion (SLOW=3 by default: the page's
// timers, frame clock and CSS animations run three times slower, and so does the script), the main-thread stalls
// it logs are squeezed out of the timeline, and the encode plays the rest back at normal speed.
//
// To change the take, edit the scenes under "the take"; positions are in the 480×600 stage's CSS pixels.
import { chromium } from 'playwright-core';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT_FILE = path.resolve(process.argv[2] ?? path.join(ROOT, 'docs/picker-demo-4x5.mp4'));
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'picker-demo-'));
const DIST = path.join(TMP, 'dist');
const FRAMES = path.join(TMP, 'frames');
fs.mkdirSync(FRAMES);
const step = (text) => console.log(`· ${text}`);

if (spawnSync('ffmpeg', ['-version']).status !== 0) throw new Error('ffmpeg is not on the PATH');
if (!fs.existsSync(CHROME)) throw new Error(`Chrome not found at ${CHROME}; set CHROME=/path/to/chrome`);

// The stage is laid out at 480×600 CSS px and zoomed 2.25× in CSS into a 1080×1350 viewport: Chrome's screencast
// captures at CSS-pixel size and ignores the device scale factor, so the zoom is what gives full-resolution frames.
// Script coordinates stay in the 480×600 stage space; the helpers below convert.
const W = 480;
const H = 600;
const Z = 2.25;
const VW = W * Z;
const VH = H * Z;
// Slow motion: the page's clock and its CSS animations run K times slower while recording, the script paces itself
// K times slower, and the encode plays it back K times faster. Rendering stalls shrink by K in the result.
const K = Number(process.env.SLOW ?? 3);
const WARP_SCRIPT = `
(() => {
  const K = ${K};
  const st = window.setTimeout.bind(window);
  const si = window.setInterval.bind(window);
  window.setTimeout = (fn, ms = 0, ...a) => st(fn, (Number(ms) || 0) * K, ...a);
  window.setInterval = (fn, ms = 0, ...a) => si(fn, (Number(ms) || 0) * K, ...a);
  const pn = performance.now.bind(performance);
  const p0 = pn();
  performance.now = () => p0 + (pn() - p0) / K;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf((t) => cb(p0 + (t - p0) / K));
  const dn = Date.now;
  const d0 = dn();
  Date.now = () => d0 + (dn() - d0) / K;
})();
`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The fake cursor: headless Chrome draws none. Arrow, hand over clickable things, I-beam over text fields.
const HAND =
  'M224,104v50.93c0,46.2-36.85,84.55-83,85.06A83.71,83.71,0,0,1,80.6,215.4C58.79,192.33,34.15,136,34.15,136a16,16,0,0,1,6.53-22.23c7.66-4,17.1-.84,21.4,6.62l21,36.44a6.09,6.09,0,0,0,6,3.09l.12,0A8.19,8.19,0,0,0,96,151.74V32a16,16,0,0,1,16.77-16c8.61.4,15.23,7.82,15.23,16.43V104a8,8,0,0,0,8.53,8,8.17,8.17,0,0,0,7.47-8.25V88a16,16,0,0,1,16.77-16c8.61.4,15.23,7.82,15.23,16.43V112a8,8,0,0,0,8.53,8,8.17,8.17,0,0,0,7.47-8.25v-7.28c0-8.61,6.62-16,15.23-16.43A16,16,0,0,1,224,104Z';
const CURSOR_SCRIPT = `
(() => {
  const SVG = {
    arrow: { w: 22, h: 26, dx: -2, dy: -1, html: '<svg width="22" height="26" viewBox="0 0 22 26"><path d="M2 1 L2 20 L6.6 15.6 L10 23.4 L13.4 22 L10.1 14.4 L16.4 14.4 Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>' },
    hand: { w: 26, h: 26, dx: -11, dy: -1.5, html: '<svg width="26" height="26" viewBox="0 0 256 256"><path d="${HAND}" fill="#fff" stroke="#111" stroke-width="16" stroke-linejoin="round"/></svg>' },
    text: { w: 12, h: 22, dx: -6, dy: -11, html: '<svg width="12" height="22" viewBox="0 0 12 22"><path d="M2 1.5 H5 Q6 1.5 6 3 V19 Q6 20.5 5 20.5 H2 M10 1.5 H7 Q6 1.5 6 3 M10 20.5 H7 Q6 20.5 6 19" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/><path d="M2 1.5 H5 Q6 1.5 6 3 V19 Q6 20.5 5 20.5 H2 M10 1.5 H7 Q6 1.5 6 3 M10 20.5 H7 Q6 20.5 6 19" fill="none" stroke="#111" stroke-width="1.4" stroke-linecap="round"/></svg>' },
  };
  // From the element, not getComputedStyle: reading styles on every pointer event (Chrome sends synthetic ones when
  // the layout under the pointer changes) forces style passes over a 260-row list and stalls the page.
  const kindOf = (el) => {
    if (!(el instanceof Element)) return 'arrow';
    if (el.closest('input, textarea')) return 'text';
    if (el.closest('.combo-less, .combo-more')) return 'arrow';
    if (el.closest('li[role=option], button, a[href], [role=tab], [role=menuitem]')) return 'hand';
    return 'arrow';
  };
  const install = () => {
    const style = document.createElement('style');
    style.textContent = '#fake-cursor{position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;will-change:transform}' +
      '#fake-cursor .in{transition:transform 90ms ease-out;transform-origin:0 0;transform:scale(${Z})}#fake-cursor.down .in{transform:scale(${Z * 0.86})}' +
      '.fake-ring{position:fixed;z-index:2147483646;pointer-events:none;width:${36 * Z}px;height:${36 * Z}px;margin:-${18 * Z}px 0 0 -${18 * Z}px;border-radius:50%;' +
      'background:rgb(17 17 17 / 0.12);animation:fake-ring 420ms ease-out forwards}' +
      '@keyframes fake-ring{from{transform:scale(0.3);opacity:1}to{transform:scale(1.1);opacity:0}}';
    document.head.appendChild(style);
    const c = document.createElement('div');
    c.id = 'fake-cursor';
    const inner = document.createElement('div');
    inner.className = 'in';
    c.appendChild(inner);
    document.documentElement.appendChild(c); // outside the zoomed body, in viewport pixels
    let kind = '';
    let x = -100, y = -100;
    const place = () => { const s = SVG[kind]; c.style.transform = 'translate(' + (x + s.dx * ${Z}) + 'px,' + (y + s.dy * ${Z}) + 'px)'; };
    const setKind = (k) => { if (k === kind) return; kind = k; inner.innerHTML = SVG[k].html; place(); };
    setKind('arrow');
    document.addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; setKind(kindOf(e.target)); place(); }, true);
    document.addEventListener('mousedown', (e) => {
      c.classList.add('down');
      const r = document.createElement('div');
      r.className = 'fake-ring';
      r.style.left = e.clientX + 'px';
      r.style.top = e.clientY + 'px';
      document.documentElement.appendChild(r);
      setTimeout(() => r.remove(), 500);
    }, true);
    document.addEventListener('mouseup', () => c.classList.remove('down'), true);
    // Typing hides nothing; the cursor stays where it was, as on a real machine.
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install); else install();
})();
`;

// Only the country + city canvas, filling the viewport.
const STAGE_CSS = `
html, body { margin: 0 !important; overflow: hidden !important; background: #f4eee2 !important; }
body { zoom: ${Z}; }
.demo { padding: 0 !important; margin: 0 !important; max-width: none !important; }
.demo-head, .reel figcaption { display: none !important; }
.reel:not(#place) { display: none !important; }
.demo-reels, .reel { display: block !important; gap: 0 !important; }
#place .reel-canvas { width: ${W}px !important; height: ${H}px !important; border: 0 !important; border-radius: 0 !important;
  justify-content: flex-start !important; padding: var(--stage-top, 120px) 20px 0 !important; box-sizing: border-box !important; }
`;


// ---- build and serve the demo page ----
step('building the demo page');
await build({
  root: ROOT,
  configFile: false,
  base: './',
  plugins: [react()],
  logLevel: 'error',
  build: { outDir: DIST, emptyOutDir: true, rollupOptions: { input: { demo: path.join(ROOT, 'demo/index.html') } } },
});
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(DIST, p);
  if (!file.startsWith(DIST) || !fs.existsSync(file)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const PAGE_URL = `http://localhost:${server.address().port}/demo/`;

// ---- browser ----
step('starting Chrome');
const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const context = await browser.newContext({
  viewport: { width: VW, height: VH },
  deviceScaleFactor: 1,
  locale: 'zh-TW',
  colorScheme: 'light',
  reducedMotion: 'no-preference',
});
await context.addInitScript(() => localStorage.setItem('dnp-lang', 'zh'));
await context.addInitScript(CURSOR_SCRIPT);
if (K !== 1) await context.addInitScript(WARP_SCRIPT);
// Long tasks, in wall-clock ms, so the encode can squeeze headless Chrome's main-thread stalls out of the timeline
await context.addInitScript(() => {
  window.__longs = [];
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__longs.push([performance.timeOrigin + e.startTime, e.duration]))).observe({ type: 'longtask', buffered: true });
});
const page = await context.newPage();
await page.goto(PAGE_URL, { waitUntil: 'networkidle' });
const cdp = await context.newCDPSession(page);
await cdp.send('Animation.enable');
await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 / K });
await page.addStyleTag({ content: STAGE_CSS });
await page.evaluate(() => document.fonts.ready);
await sleep(500);

const country = page.locator('#place input[role=combobox]').nth(0);
const city = page.locator('#place input[role=combobox]').nth(1);
const list = page.locator('#place .combo-list:not(.leaving)');
const options = list.locator('[role=option]');

// Centre the card plus an open list (248px, 4px below) in the frame.
const cardH = await page.locator('#place .demo-card').evaluate((el) => el.offsetHeight); // layout px, before the zoom
const top = Math.round((H - (cardH + 4 + 248)) / 2);
await page.evaluate((t) => document.documentElement.style.setProperty('--stage-top', t + 'px'), top);
await sleep(200);

// ---- input helpers ----
// The cursor starts at rest in the frame's bottom-right corner, where it also ends
let mx = W - 40;
let my = H - 30;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
async function moveTo(x, y, ms = 600) {
  ms *= K;
  const sx = mx;
  const sy = my;
  // A slight arc, as a hand moves; paced by the clock, so slow round trips don't stretch the move
  const cx = (sx + x) / 2 + (y - sy) * 0.1;
  const cy = (sy + y) / 2 - (x - sx) * 0.1;
  const start = Date.now();
  for (;;) {
    const t = Math.min(1, (Date.now() - start) / ms);
    const e = ease(t);
    const px = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * cx + e * e * x;
    const py = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * cy + e * e * y;
    await page.mouse.move(px * Z, py * Z);
    if (t >= 1) break;
    await sleep(8);
  }
  mx = x;
  my = y;
}
// An element's box in stage coordinates
const bbox = async (loc) => {
  const b = await loc.boundingBox();
  return { x: b.x / Z, y: b.y / Z, width: b.width / Z, height: b.height / Z };
};
const centre = async (loc, fx = 0.5, fy = 0.5) => {
  const b = await bbox(loc);
  return { x: b.x + b.width * fx, y: b.y + b.height * fy, b };
};
const wheel = (dy) => page.mouse.wheel(0, dy * Z);
async function moveToLoc(loc, ms, fx, fy) {
  const c = await centre(loc, fx, fy);
  await moveTo(c.x, c.y, ms);
  return c;
}
const hold = (ms) => sleep(ms * K);
async function click() {
  await page.mouse.down();
  await hold(90);
  await page.mouse.up();
}
const type = (text, delay = 130) => page.keyboard.type(text, { delay: delay * K });
async function press(key, after = 280) {
  await page.keyboard.press(key);
  await hold(after);
}


// Warm-up, off camera: render every list once and scroll it through, so the web font's unicode-range files and
// the flags are all loaded before the take (otherwise the first open stalls for seconds).
async function warmUp() {
  const before = await page.evaluate(() => performance.getEntriesByType('resource').length);
  for (const field of [country, city]) {
    await field.click();
    await page.waitForSelector('#place .combo-list');
    await page.evaluate(async () => {
      const ul = document.querySelector('#place .combo-list');
      for (let y = 0; y <= ul.scrollHeight; y += 200) { ul.scrollTop = y; await new Promise((r) => setTimeout(r, 30)); }
      ul.scrollTop = 0;
    });
    await page.keyboard.press('Escape');
    await page.mouse.click(5, 5);
  }
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  const after = await page.evaluate(() => performance.getEntriesByType('resource').length);
  await sleep(500);
  return after - before;
}
step(`warm-up (${await warmUp()} font and flag files loaded)`);
step(`recording the take (about ${Math.round((80 * K) / 60 + 1)} minutes in ${K}× slow motion)`);

await page.mouse.move(mx * Z, my * Z);
await sleep(300);

// ---- screencast ----
const frames = [];
let n = 0;
cdp.on('Page.screencastFrame', (f) => {
  const name = `f${String(++n).padStart(5, '0')}.jpg`;
  frames.push({ name, t: f.metadata.timestamp });
  fs.writeFile(path.join(FRAMES, name), Buffer.from(f.data, 'base64'), () => {});
  cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 94, maxWidth: VW, maxHeight: VH, everyNthFrame: 1 });
const t0 = Date.now() / 1000;
await page.mouse.move(mx * Z + 1, my * Z);
const marks = [];
const mark = (label) => marks.push([label, +((Date.now() / 1000 - t0) / K).toFixed(2)]);
const fields = () => page.evaluate(() => [...document.querySelectorAll('#place input[role=combobox]')].map((i) => i.value));

// ---- the take ----
await hold(1000);

mark('1 open country');
// 1. Open the country list: icon turns into a search glass, list grows out of the corner, in sections
await moveToLoc(country, 1000, 0.35, 0.5);
await hold(250);
await click();
await hold(1800);

mark('2 hover rows');
// 2. Hover a few rows
for (let i = 0; i < 4; i++) {
  await moveToLoc(options.nth(i), 320, 0.3, 0.5);
  await hold(260);
}
await hold(400);

mark('3 bottom chevron');
// 3. Into the bottom fade: the chevron grows; rest on it and the list rolls down
let lb = await bbox(list);
await moveTo(lb.x + lb.width * 0.3, lb.y + lb.height - 22, 450);
await hold(700);
const down = page.locator('#place .combo-more span');
await moveToLoc(down, 450);
await hold(2300);
await moveTo(mx - 90, lb.y + lb.height * 0.5, 450);
await hold(700);

mark('4 page press');
// 4. A press on the chevron jumps a page
await moveToLoc(down, 400);
await hold(120);
await click();
await moveTo(mx - 90, lb.y + lb.height * 0.55, 400);
await hold(900);

mark('5 top chevron');
// 5. The top fade: its chevron rolls back up
await moveTo(lb.x + lb.width * 0.3, lb.y + 20, 450);
await hold(700);
const up = page.locator('#place .combo-less span');
await moveToLoc(up, 400);
await hold(1300);
await moveTo(mx - 90, lb.y + lb.height * 0.5, 450);
await hold(600);

mark('6 wheel');
// 6. Wheel with the pointer resting: the highlight stays put; then fling to the end, where the regions are
for (let i = 0; i < 12; i++) {
  await wheel(70);
  await hold(55);
}
await hold(900);
for (let i = 0; i < 14; i++) {
  await wheel(900);
  await hold(40);
}
await hold(1400);
await moveTo(mx + 8, my - 60, 450);
await hold(500);
await moveTo(mx - 4, my + 90, 600);
await hold(1000);

mark('7 type ko');
// 7. Typing: sections go, matches turn bold
await moveTo((await centre(country)).x + 70, (await centre(country)).y, 600);
await hold(300);
await type('ko', 200);
await hold(1600);

mark('8 clear');
// 8. The × clears the field and brings the full list back
await moveToLoc(page.locator('#place .combo-clear'), 450);
await hold(300);
await click();
await hold(1100);

mark('9 chinese');
// 9. Chinese works too
await moveTo(mx - 120, my + 4, 400);
await page.keyboard.insertText('韓');
await hold(1500);
await press('Backspace', 600);

mark('10 typo');
// 10. A typo still finds it; Enter picks; the flag takes the icon's place
await type('tailand', 120);
await hold(1400);
await press('Enter', 1600);
mark('after typo ' + (await fields()).join('/'));

mark('11 city');
// 11. City: only Thai cities, a city icon instead of the same flag again
await moveToLoc(city, 800, 0.35, 0.5);
await hold(200);
await click();
await hold(1300);
for (let i = 0; i < 3; i++) {
  await moveToLoc(options.nth(i), 300, 0.3, 0.5);
  await hold(240);
}
await moveTo((await centre(city)).x + 60, (await centre(city)).y, 600);
await hold(200);
await type('chiang', 140);
await hold(1300);
await press('Enter', 1500);
mark('after chiang ' + (await fields()).join('/'));

mark('12 japan');
// 12. Changing the country to one the city doesn't belong to clears the city
await moveToLoc(country, 800, 0.35, 0.5);
await hold(200);
await click();
await hold(900);
await moveTo(mx + 120, my, 400);
await type('japan', 140);
await hold(1100);
await press('Enter', 2000);
mark('after japan ' + (await fields()).join('/'));

mark('13 world cities');
// 13. Empty the country, then pick a city: the list spans the world, in sections, and the city brings its country
await moveToLoc(page.locator('#place .combo-clear'), 600);
await hold(250);
await click();
await hold(900);
await press('Escape', 600);
await moveToLoc(city, 800, 0.35, 0.5);
await hold(200);
await click();
await hold(1500);
for (let i = 0; i < 3; i++) {
  await moveToLoc(options.nth(i), 300, 0.3, 0.5);
  await hold(240);
}
await moveTo((await centre(city)).x + 60, (await centre(city)).y, 600);
await hold(200);
await type('lisb', 170);
await hold(1300);
await press('Enter', 2200);
mark('after lisb ' + (await fields()).join('/'));

mark('14 free text');
// 14. Something not on the list: one row to use it as typed
await moveToLoc(country, 800, 0.35, 0.5);
await hold(200);
await click();
await hold(800);
await moveTo(mx + 120, my, 400);
await type('Narnia', 140);
await hold(1100);
await moveToLoc(page.locator('#place li.typed'), 500, 0.3, 0.5);
await hold(500);
await click();
await hold(1600);
mark('after narnia ' + (await fields()).join('/'));

mark('15 keyboard');
// 15. Keyboard: arrows move, Esc closes only the list
await moveToLoc(country, 600, 0.35, 0.5);
await hold(150);
await click();
await hold(800);
await moveTo(mx + 150, my - 50, 500);
for (let i = 0; i < 4; i++) await press('ArrowDown', 330);
await press('ArrowUp', 600);
await press('Escape', 1400);

mark('out');
// Out
await moveTo(W - 40, H - 30, 900);
await hold(1500);

const t1 = Date.now() / 1000;
const longs = (await page.evaluate(() => window.__longs)).map(([s, d]) => [s / 1000, d / 1000]);
await cdp.send('Page.stopScreencast');
await sleep(800);
await browser.close();
server.close();
console.log(marks.filter(([l]) => l.startsWith('after')).map(([l]) => '  ' + l.replace('after ', '')).join('\n'));

// ---- assemble and encode ----
// Each frame lasts until the next one. Main-thread stalls (long tasks beyond one frame) are cut out of the timeline,
// since nothing on screen changes while the page is blocked, then everything is divided by the slow-motion factor.
step(`encoding ${frames.length} frames`);
const KEEP = 1 / 60;
const cuts = longs.filter(([, d]) => d > KEEP).map(([s, d]) => [s + KEEP, s + d]);
const squeeze = (t) => t - cuts.reduce((sum, [a, b]) => sum + Math.max(0, Math.min(t, b) - a), 0);
const out = (t) => (squeeze(t) - squeeze(t0)) / K;
const concat = frames.map((f, i) => {
  const next = i + 1 < frames.length ? frames[i + 1].t : t1;
  return `file '${f.name}'\nduration ${Math.max(0.0005, out(next) - out(f.t)).toFixed(5)}`;
});
fs.writeFileSync(path.join(FRAMES, 'list.txt'), concat.join('\n') + `\nfile '${frames[frames.length - 1].name}'\n`);
fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
const ff = spawnSync(
  'ffmpeg',
  ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', 'list.txt',
    '-vf', 'fps=60,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-movflags', '+faststart', OUT_FILE],
  { cwd: FRAMES, stdio: 'inherit' },
);
fs.rmSync(TMP, { recursive: true, force: true });
if (ff.status !== 0) throw new Error('ffmpeg failed');
step(`done: ${path.relative(process.cwd(), OUT_FILE)} (${out(t1).toFixed(1)} s, ${cuts.length} stalls squeezed)`);
