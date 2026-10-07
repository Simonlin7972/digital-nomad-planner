// Renders hype-16x9.html to frames with headless Chrome over the DevTools protocol (no dependencies), then
// muxes them with the soundtrack from audio.mjs into an MP4.
//
//   node docs/reel/render.mjs                 # full reel -> docs/hype-16x9.mp4
//   node docs/reel/render.mjs --stills 1,3.4  # just those times -> stills/*.jpg, for checking
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const FPS = 30;
const DURATION = 60;
const args = process.argv.slice(2);
const stillsArg = args.includes('--stills') ? args[args.indexOf('--stills') + 1] : null;
const OUT = resolve(ROOT, 'docs/hype-16x9.mp4');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// A static server for the repo, so the page can load icons.js and node_modules/flag-icons.
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
  const path = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!path.startsWith(ROOT) || !existsSync(path)) return res.writeHead(404).end();
  res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }).end(readFileSync(path));
}).listen(0);
const PORT = server.address().port;

const profile = join(tmpdir(), 'reel-chrome-' + process.pid);
const chrome = spawn(CHROME, [
  '--headless=new', '--remote-debugging-port=9333', `--user-data-dir=${profile}`, '--hide-scrollbars',
  '--force-device-scale-factor=1', '--window-size=1920,1080', '--disable-gpu-vsync', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let targets;
for (let i = 0; i < 150 && !targets?.some((t) => t.type === 'page'); i++) {
  try { targets = await (await fetch('http://127.0.0.1:9333/json/list')).json(); } catch { await sleep(200); }
}
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0;
const pending = new Map();
const events = [];
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } else events.push(msg);
});
const send = (method, params = {}) => new Promise((res, rej) => {
  const n = ++id;
  pending.set(n, (m) => (m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result)));
  ws.send(JSON.stringify({ id: n, method, params }));
});
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
};

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/docs/reel/hype-16x9.html?render` });
while (!events.some((e) => e.method === 'Page.loadEventFired')) await sleep(50);
await evaluate('window.ready');
await sleep(500);

async function frame(t, file) {
  await evaluate(`seek(${t}); new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))`);
  const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 95, clip: { x: 0, y: 0, width: 1920, height: 1080, scale: 1 } });
  writeFileSync(file, Buffer.from(data, 'base64'));
}

try {
  if (stillsArg) {
    const dir = join(HERE, 'stills');
    mkdirSync(dir, { recursive: true });
    for (const t of stillsArg.split(',').map(Number)) await frame(t, join(dir, `t${t.toFixed(2).padStart(5, '0')}.jpg`));
    console.log('stills in', dir);
  } else {
    const dir = join(tmpdir(), 'reel-frames');
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const total = FPS * DURATION;
    for (let i = 0; i < total; i++) {
      await frame(i / FPS, join(dir, `f${String(i).padStart(5, '0')}.jpg`));
      if (i % 150 === 0) console.log(`frame ${i}/${total}`);
    }
    const wav = join(HERE, 'soundtrack.wav');
    execFileSync('node', [join(HERE, 'audio.mjs'), wav], { stdio: 'inherit' });
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(dir, 'f%05d.jpg'), '-i', wav,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', '48000', '-c:a', 'aac', '-b:a', '256k',
      '-movflags', '+faststart', '-shortest', OUT], { stdio: 'inherit' });
    console.log('wrote', OUT);
  }
} finally {
  ws.close();
  const exited = new Promise((r) => chrome.once('exit', r));
  chrome.kill();
  await exited;
  server.close();
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
