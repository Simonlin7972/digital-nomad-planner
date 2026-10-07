// Synthesises the reel's soundtrack: a 120 BPM track (Am–F–C–G) plus every sound effect, timed to the cues in
// hype-16x9.html. Pure JS, no samples, so it's all original and reproducible.
//
//   node docs/reel/audio.mjs out.wav
import { writeFileSync } from 'node:fs';

const SR = 44100;
const LEN = 60;
const N = SR * LEN;
const out = process.argv[2] || 'soundtrack.wav';

// Buses: music is ducked by the kick (sidechain), sfx isn't; both send to a shared reverb.
const bus = () => ({ L: new Float32Array(N), R: new Float32Array(N) });
const music = bus(), drums = bus(), sfx = bus(), send = bus();
const kicks = [];

// Deterministic noise
let seed = 1234567;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const hz = (m) => 440 * 2 ** ((m - 69) / 12);
const TAU = Math.PI * 2;

// Zero-delay-feedback state-variable filter (stable at any cutoff); returns a stepper giving [low, band, high].
function svf() {
  let ic1 = 0, ic2 = 0;
  return (x, fc, Q = 0.8) => {
    const g = Math.tan(Math.PI * Math.min(fc, 18000) / SR);
    const k = 1 / Q;
    const a1 = 1 / (1 + g * (g + k)), a2 = g * a1, a3 = g * a2;
    const v3 = x - ic2;
    const v1 = a1 * ic1 + a2 * v3;
    const v2 = ic2 + a2 * ic1 + a3 * v3;
    ic1 = 2 * v1 - ic1;
    ic2 = 2 * v2 - ic2;
    return [v2, v1, x - k * v1 - v2];
  };
}

// Renders `dur` seconds of `fn(t, i)` and mixes it in at `t0`.
function place(target, t0, dur, fn, { gain = 1, pan = 0, rev = 0 } = {}) {
  const start = Math.round(t0 * SR);
  const n = Math.round(dur * SR);
  const gl = gain * Math.cos((pan + 1) * Math.PI / 4) * Math.SQRT2;
  const gr = gain * Math.sin((pan + 1) * Math.PI / 4) * Math.SQRT2;
  for (let i = 0; i < n; i++) {
    const j = start + i;
    if (j < 0) continue;
    if (j >= N) break;
    const v = fn(i / SR, i);
    target.L[j] += v * gl;
    target.R[j] += v * gr;
    if (rev) { send.L[j] += v * gl * rev; send.R[j] += v * gr * rev; }
  }
}

// ---------------- instruments ----------------
function kick(t0, g = 1, deep = false) {
  kicks.push(t0);
  let ph = 0;
  place(drums, t0, deep ? 1.1 : 0.42, (t) => {
    const f = (deep ? 38 : 48) + (deep ? 140 : 120) * Math.exp(-t / (deep ? 0.06 : 0.035));
    ph += TAU * f / SR;
    const body = Math.sin(ph) * Math.exp(-t / (deep ? 0.45 : 0.22));
    const click = rnd() * Math.exp(-t / 0.002) * 0.35;
    return Math.tanh((body + click) * 1.6) * 0.9;
  }, { gain: g });
}
function clap(t0, g = 1) {
  const f = svf();
  place(drums, t0, 0.35, (t) => {
    let env = 0;
    for (const o of [0, 0.011, 0.022]) if (t >= o) env = Math.max(env, Math.exp(-(t - o) / 0.007));
    env = Math.max(env, t > 0.022 ? 0.55 * Math.exp(-(t - 0.022) / 0.09) : 0);
    return f(rnd(), 1300, 1.2)[1] * env * 2.2;
  }, { gain: 0.5 * g, rev: 0.35 });
}
function snare(t0, g = 1) {
  const f = svf();
  let ph = 0;
  place(drums, t0, 0.25, (t) => {
    ph += TAU * 185 / SR;
    const tone = Math.sin(ph) * Math.exp(-t / 0.05) * 0.5;
    const noise = f(rnd(), 3200, 0.7)[1] * Math.exp(-t / 0.08) * 1.4;
    return tone + noise;
  }, { gain: 0.42 * g, rev: 0.2 });
}
function hat(t0, g = 1, open = false, pan = 0.25) {
  const f = svf();
  place(drums, t0, open ? 0.3 : 0.06, (t) => f(rnd(), 7200, 0.9)[2] * Math.exp(-t / (open ? 0.11 : 0.018)),
    { gain: 0.16 * g, pan });
}
function crash(t0, g = 1) {
  const f = svf();
  place(drums, t0, 2.2, (t) => f(rnd(), 6000, 0.5)[2] * Math.exp(-t / 0.7), { gain: 0.16 * g, rev: 0.4, pan: -0.15 });
}
function bass(t0, dur, m, g = 1) {
  const f = svf();
  let p1 = 0, p2 = 0;
  place(music, t0, dur + 0.05, (t) => {
    p1 = (p1 + hz(m) / SR) % 1;
    p2 += TAU * hz(m - 12) / SR;
    const saw = 2 * p1 - 1;
    const cut = 220 + 1500 * Math.exp(-t / 0.07);
    const rel = t > dur ? Math.max(0, 1 - (t - dur) / 0.05) : 1;
    const att = Math.min(1, t / 0.004);
    return (f(saw, cut, 1.4)[0] * 0.7 + Math.sin(p2) * 0.55) * att * rel;
  }, { gain: 0.42 * g });
}
function pad(t0, dur, notes, g = 1, bright = 1) {
  // Three detuned saws per note, one independent set per side for width
  for (const [pan, spread] of [[-0.6, 1], [0.6, 1.002]]) {
    const voices = notes.flatMap((m) => [-0.12, 0, 0.11].map((d) => ({ f: hz(m + d) * spread, p: (rnd() + 1) / 2 })));
    const f = svf();
    place(music, t0, dur + 0.6, (t) => {
      let s = 0;
      for (const v of voices) { v.p = (v.p + v.f / SR) % 1; s += 2 * v.p - 1; }
      const att = Math.min(1, t / 0.25);
      const rel = t > dur ? Math.max(0, 1 - (t - dur) / 0.6) : 1;
      return f(s / voices.length, 700 + 1300 * bright, 0.9)[0] * att * rel;
    }, { gain: 0.5 * g, pan, rev: 0.4 });
  }
}
function pluck(t0, m, g = 1, pan = 0) {
  const f = svf();
  let p = 0;
  place(music, t0, 0.35, (t) => {
    p = (p + hz(m) / SR) % 1;
    const sq = p < 0.5 ? 1 : -1;
    return f(sq, 600 + 4200 * Math.exp(-t / 0.05), 1.1)[0] * Math.exp(-t / 0.14);
  }, { gain: 0.13 * g, pan, rev: 0.3 });
}
function riser(t0, dur, g = 1) {
  const f = svf();
  let p = 0;
  place(sfx, t0, dur, (t) => {
    const k = t / dur;
    p += TAU * (200 + 1400 * k * k) / SR;
    const n = f(rnd(), 300 + 7000 * k * k, 2.5)[1];
    return (n * 0.9 + Math.sin(p) * 0.12) * k * k;
  }, { gain: 0.35 * g, rev: 0.3 });
}
function whoosh(t0, dur = 0.35, g = 1, up = true) {
  const f = svf();
  place(sfx, t0, dur, (t) => {
    const k = t / dur;
    const env = Math.sin(Math.PI * k) ** 2;
    const fc = up ? 400 + 5000 * k : 5400 - 5000 * k;
    return f(rnd(), fc, 1.6)[1] * env;
  }, { gain: 0.5 * g, rev: 0.2 });
}
// A whoosh that lands exactly on t
const into = (t, dur = 0.3, g = 1) => whoosh(t - dur, dur, g);
function impact(t0, g = 1) {
  kick(t0, 1.1 * g, true);
  crash(t0, 0.9 * g);
  const f = svf();
  place(sfx, t0, 1.2, (t) => f(rnd(), 180, 0.7)[0] * Math.exp(-t / 0.35) * 3, { gain: 0.5 * g, rev: 0.5 });
}
// Text slam: short thump + snap
function thud(t0, g = 1) {
  let p = 0;
  const f = svf();
  place(sfx, t0, 0.25, (t) => {
    p += TAU * (55 + 90 * Math.exp(-t / 0.02)) / SR;
    return Math.sin(p) * Math.exp(-t / 0.08) + f(rnd(), 2500, 0.8)[1] * Math.exp(-t / 0.015) * 0.6;
  }, { gain: 0.55 * g, rev: 0.15 });
}
function pop(t0, base = 520, g = 1, pan = 0) {
  let p = 0;
  place(sfx, t0, 0.12, (t) => {
    p += TAU * base * (1 + 0.9 * Math.min(1, t / 0.05)) / SR;
    return Math.sin(p) * Math.exp(-t / 0.035) * Math.min(1, t / 0.002);
  }, { gain: 0.32 * g, pan, rev: 0.15 });
}
function click(t0, g = 1) {
  const f = svf();
  let p = 0;
  place(sfx, t0, 0.04, (t) => {
    p += TAU * 2100 / SR;
    return f(rnd(), 5000, 0.8)[2] * Math.exp(-t / 0.002) + Math.sin(p) * Math.exp(-t / 0.006) * 0.4;
  }, { gain: 0.45 * g });
}
function tick(t0, freq = 1800, g = 1) {
  let p = 0;
  place(sfx, t0, 0.03, (t) => { p += TAU * freq / SR; return Math.sin(p) * Math.exp(-t / 0.008); }, { gain: 0.16 * g });
}
function snip(t0) {
  for (const [o, fc] of [[0, 6500], [0.07, 5200]]) {
    const f = svf();
    place(sfx, t0 + o, 0.08, (t) => f(rnd(), fc, 6)[1] * Math.exp(-t / 0.012) * 2.5 + rnd() * Math.exp(-t / 0.0015) * 0.6, { gain: 0.55, rev: 0.15 });
  }
}
function beep(t0, freq = 880, dur = 0.16, g = 1) {
  const f = svf();
  let p = 0;
  place(sfx, t0, dur + 0.02, (t) => {
    p = (p + freq / SR) % 1;
    const env = Math.min(1, t / 0.004) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.02) : 1);
    return f(p < 0.5 ? 1 : -1, 3000, 0.7)[0] * env;
  }, { gain: 0.14 * g, rev: 0.1 });
}
function shutter(t0) {
  click(t0, 1.2);
  const f = svf();
  place(sfx, t0 + 0.01, 0.09, (t) => f(rnd(), 3000, 1)[1] * Math.exp(-t / 0.025) * 2, { gain: 0.4 });
  click(t0 + 0.085, 0.9);
}
function bell(t0, m, g = 1) {
  const f0 = hz(m);
  const parts = [[1, 1, 1.4], [2.0, 0.5, 0.9], [3.01, 0.25, 0.5], [4.2, 0.12, 0.3]];
  const ph = parts.map(() => 0);
  place(sfx, t0, 2.5, (t) => parts.reduce((s, [r, a, d], k) => {
    ph[k] += TAU * f0 * r / SR;
    return s + Math.sin(ph[k]) * a * Math.exp(-t / d);
  }, 0) * Math.min(1, t / 0.003), { gain: 0.2 * g, rev: 0.5 });
}
function lockClick(t0) {
  click(t0, 1.3);
  thud(t0 + 0.05, 0.6);
}

// ---------------- music ----------------
const BEAT = 0.5, STEP = 0.125;
const PROG = [
  { root: 45, chord: [57, 60, 64, 69] }, // Am
  { root: 41, chord: [53, 57, 60, 65] }, // F
  { root: 48, chord: [55, 60, 64, 67] }, // C
  { root: 43, chord: [55, 59, 62, 67] }, // G
];
const ARP = [0, 1, 2, 3, 2, 1, 2, 3];
const muted = (t, gaps) => gaps.some(([a, b]) => t >= a && t < b);

// Full groove between t0 and t1, chords changing every bar (2 s) from t0
function groove(t0, t1, { gaps = [], hats16 = false, prog = PROG, padGain = 0.9, arp = true } = {}) {
  for (let t = t0, step = 0; t < t1 - 1e-6; t += STEP, step++) {
    const bar = Math.floor(step / 16);
    const { root, chord } = prog[bar % prog.length];
    if (muted(t, gaps)) continue;
    if (step % 4 === 0) kick(t);
    if (step % 8 === 4) clap(t);
    if (step % 4 === 2) hat(t, 1, step % 8 === 6, 0.3);
    else if (hats16 || step % 2 === 1) hat(t, 0.55, false, -0.3);
    // Off-beat bass, octave bounce
    if (step % 2 === 1 || step % 16 === 0) bass(t, STEP * 0.9, root + (step % 4 === 3 ? 12 : 0));
    if (arp) pluck(t, chord[ARP[step % 8]] + 12 + (step % 16 >= 8 ? 0 : 12) * (bar % 2), 1, step % 2 ? 0.4 : -0.4);
    if (step % 16 === 0) pad(t, Math.min(2, t1 - t), chord, padGain);
  }
}

// 0–2.5: intro, soft pad and a sparse arp
pad(0, 2.5, PROG[0].chord, 0.6, 0.2);
for (let t = 0, s = 0; t < 2.4; t += 0.25, s++) pluck(t, PROG[0].chord[ARP[s % 8]] + 12, 0.6, s % 2 ? 0.5 : -0.5);
riser(1.4, 1.1, 0.8);

// 2.5–4.5: the drop-out — a boom, a low drone and a clock
impact(2.5, 1.1);
place(music, 2.5, 2.0, (t) => Math.sin(TAU * hz(33) * t) * Math.min(1, t / 0.1) * Math.max(0, 1 - Math.max(0, t - 1.7) / 0.3), { gain: 0.22 });
for (let t = 2.75; t < 4.5; t += 0.25) tick(t, 2400, 0.9);
kick(3.2, 0.9);

// 4.5–7.5: build
for (let t = 4.5; t < 7.4; t += BEAT) kick(t, 0.85);
for (let t = 4.75; t < 7.4; t += BEAT) hat(t, 0.9, false, 0.3);
for (let t = 6.0; t < 6.75; t += 0.25) snare(t, 0.6 + (t - 6) * 0.4);
for (let t = 6.75; t < 7.375; t += 0.125) snare(t, 0.8 + (t - 6.75) * 0.6);
pad(4.5, 3, PROG[0].chord, 0.6, 0.5);
for (let t = 4.5; t < 7.4; t += BEAT) bass(t, 0.2, 45, 0.7);
riser(5.6, 1.9, 1.1);

// 7.5–48.5: main groove (drops out for a breath before "B" and before the share card)
crash(7.5);
groove(7.5, 48.5, { gaps: [[23.625, 24.0], [43.25, 43.5]] });
crash(16.5, 0.6); crash(24, 0.8); crash(29, 0.6); crash(35.5, 0.6); crash(43.5, 0.8);
riser(23.0, 0.65, 0.7);
riser(42.6, 0.65, 0.7);

// 48.5–51: rapid-fire "and more": 16th hats, snare climb
groove(48.5, 51, { hats16: true, prog: [PROG[2], PROG[3]] });
for (let t = 50.0; t < 50.875; t += 0.125) snare(t, 0.5 + (t - 50) * 0.7);
riser(49.9, 1.1, 1);

// 51–54: four punches over a held bass
[51, 51.75, 52.5, 53.25].forEach((t, i) => { impact(t, 0.8); bass(t, 0.7, [45, 41, 48, 43][i], 1.1); pad(t, 0.7, PROG[i].chord, 0.8, 1); });

// 54–56.5: breakdown — pad only, riser into the last drop
pad(54, 1.25, PROG[0].chord, 0.8, 0.3);
pad(55.25, 1.25, PROG[1].chord, 0.8, 0.5);
for (let t = 54, s = 0; t < 56.4; t += 0.25, s++) pluck(t, PROG[s < 5 ? 0 : 1].chord[ARP[s % 8]] + 12, 0.7, s % 2 ? 0.5 : -0.5);
riser(55.3, 1.2, 1.2);
for (let t = 56.0; t < 56.5; t += 0.0625) snare(t, 0.4 + (t - 56) * 1.2);

// 56.5–59: last drop, F then C, and a ringing C to end on
impact(56.5, 1);
groove(56.5, 59, { prog: [PROG[1], PROG[2]] });
kick(59, 1, true);
crash(59, 0.9);
pad(59, 0.4, [48, 55, 60, 64, 67], 1, 0.8);
bass(59, 0.6, 36, 1);

// ---------------- sound effects (times from hype-16x9.html) ----------------
// Text slams
for (const t of [0.05, 0.55, 7.85, 12.5, 16.5, 18.0, 19.5, 20.7, 22, 25.5, 26.65, 27.8, 29, 32.05, 35.5, 39.55, 40.5,
  42.2, 43.9, 46.05, 46.5, 54.3, 54.8, 56.85]) thud(t);
for (const t of [10.5, 11.0, 11.5, 24.1]) { thud(t, 1.3); kick(t, 0.7, true); }
for (let i = 0; i < 6; i++) thud(48.7 + i * 0.3, 1.1);
pop(48.5, 700);
// Cut flashes
for (const t of [7.5, 10.5, 24, 43.5, 54, 56.5]) into(t, 0.3, 0.8);
impact(7.5, 1);
// Hook
pop(1.3, 600); pop(1.32, 900, 0.5);
whoosh(3.4, 0.4, 0.4);
thud(2.5, 1.2);
// 365 counter, flags, the band
for (let i = 0; i < 20; i++) tick(4.5 + 0.9 * (1 - (1 - i / 20) ** 2), 1400 + i * 60, 0.8);
for (let i = 0; i < 36; i++) pop(4.7 + i * 0.028, 500 + ((i * 97) % 7) * 90, 0.35, ((i % 9) - 4) / 5);
whoosh(6.0, 0.35, 0.9);
thud(6.25, 1);
// Title
pop(7.5, 420, 1.2);
for (let i = 0; i < 23; i++) tick(8.45 + i * (0.9 / 23), 3200, 0.7);
[8.2, 8.3, 8.4, 8.5].forEach((t, i) => pop(t, 900 + i * 150, 0.5, i % 2 ? 0.6 : -0.6));
// Timeline blocks wiping in, then the country bars
PLAN_TIMES(12.85, 0.2, 7).forEach((t, i) => pop(t, 380 + i * 60, 0.7));
PLAN_TIMES(14.4, 0.08, 6).forEach((t) => tick(t, 2600, 0.8));
whoosh(15.3, 0.3, 0.5);
// Drag to add
click(16.9); whoosh(16.9, 0.75, 0.35); click(17.65, 0.8); pop(17.7, 330, 1.2);
// Stretch and push
click(19.95); whoosh(19.95, 0.6, 0.45); thud(20.5, 0.6);
// Reorder
click(22.35); whoosh(22.45, 0.6, 0.4); pop(22.8, 300, 0.6); click(23.25, 0.9);
// Cut
tick(24.95, 3000); whoosh(24.95, 0.5, 0.3); snip(25.4); thud(25.45, 0.8);
// ⌥ copy
click(26.9); whoosh(26.95, 0.5, 0.4); pop(27.45, 360, 1); whoosh(27.5, 0.3, 0.4);
// Calendar
click(30.0); whoosh(30.0, 0.5, 0.35); pop(30.55, 420, 0.6);
// Map: the route draws, each pin pops
whoosh(32.3, 2.2, 0.45);
for (let i = 0; i < 6; i++) pop(32.3 + i * 0.36, 520 + i * 70, 0.8, -0.5 + i * 0.2);
// Schengen: counter, overflow alarm
for (let i = 0; i < 32; i++) tick(35.6 + 1.4 * (1 - (1 - i / 32) ** 1.6), 1200 + i * 40, 0.8);
beep(37.0, 330, 0.12, 1.4); beep(37.18, 330, 0.12, 1.4); thud(37.05, 1);
pop(37.1, 300, 0.8);
// Taiwan 183
for (let i = 0; i < 24; i++) tick(38.55 + 0.9 * (1 - (1 - i / 24) ** 2), 1500 + i * 50, 0.8);
bell(39.5, 84, 0.6);
// Seasons: cells, then the smoke alarm
for (let i = 0; i < 12; i++) tick(40.85 + i * 0.035, 2000 + i * 80, 0.6);
for (let t = 41.4; t < 43.2; t += 0.5) beep(t, 660, 0.18, 0.9);
pop(41.5, 360);
// Share: card flies in, the download button snaps
whoosh(43.55, 0.5, 0.8); pop(44.6, 480); shutter(45.2); bell(45.3, 88, 0.4);
// Phone
whoosh(46.1, 0.5, 0.7);
[46.55, 46.7, 46.85].forEach((t, i) => tick(t, 2200 + i * 200));
// Privacy punches
for (const t of [51, 51.75, 52.5, 53.25]) thud(t, 1.2);
// Lock
lockClick(54.1);
// CTA
whoosh(56.4, 0.4, 0.8); pop(57.45, 520, 1.2);
[57.0, 57.1, 57.2, 57.3].forEach((t, i) => pop(t, 1000 + i * 180, 0.4, i % 2 ? 0.6 : -0.6));
click(58.3, 1.2); bell(58.32, 84, 1); bell(58.32, 91, 0.6);

function PLAN_TIMES(t0, gap, n) { return Array.from({ length: n }, (_, i) => t0 + i * gap); }

// ---------------- mix ----------------
// Sidechain: duck the music under each kick
kicks.sort((a, b) => a - b);
let k = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  while (k + 1 < kicks.length && kicks[k + 1] <= t) k++;
  const since = kicks.length && kicks[k] <= t ? t - kicks[k] : 9;
  const duck = 1 - 0.55 * Math.exp(-since / 0.09);
  music.L[i] *= duck;
  music.R[i] *= duck;
}

// Schroeder reverb on the send bus
function reverb(x, offset) {
  const y = new Float32Array(N);
  const combs = [1557, 1617, 1491, 1422, 1277, 1356].map((d) => ({ buf: new Float32Array(d + offset), i: 0, lp: 0 }));
  const alls = [556, 441, 341].map((d) => ({ buf: new Float32Array(d + offset), i: 0 }));
  for (let n = 0; n < N; n++) {
    let s = 0;
    for (const c of combs) {
      const o = c.buf[c.i];
      c.lp = o * 0.7 + c.lp * 0.3;
      c.buf[c.i] = x[n] + c.lp * 0.8;
      c.i = (c.i + 1) % c.buf.length;
      s += o;
    }
    s /= combs.length;
    for (const a of alls) {
      const o = a.buf[a.i];
      const v = s + o * -0.5;
      a.buf[a.i] = s + o * 0.5;
      s = v;
      a.i = (a.i + 1) % a.buf.length;
    }
    y[n] = s;
  }
  return y;
}
const revL = reverb(send.L, 0), revR = reverb(send.R, 23);

const L = new Float32Array(N), R = new Float32Array(N);
for (let i = 0; i < N; i++) {
  L[i] = music.L[i] * 0.85 + drums.L[i] * 0.55 + sfx.L[i] * 1.4 + revL[i] * 0.9;
  R[i] = music.R[i] * 0.85 + drums.R[i] * 0.55 + sfx.R[i] * 1.4 + revR[i] * 0.9;
}
// Soft clip, fade the very end, normalise to -1 dBFS
let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = t > 59.3 ? Math.max(0, 1 - (t - 59.3) / 0.7) : 1;
  L[i] = Math.tanh(L[i] * 1.1) * fade;
  R[i] = Math.tanh(R[i] * 1.1) * fade;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = 0.89 / peak;
const pcm = Buffer.alloc(44 + N * 4);
pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + N * 4, 4); pcm.write('WAVE', 8);
pcm.write('fmt ', 12); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(2, 22);
pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 4, 28); pcm.writeUInt16LE(4, 32); pcm.writeUInt16LE(16, 34);
pcm.write('data', 36); pcm.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm)) * 32767), 44 + i * 4);
  pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm)) * 32767), 46 + i * 4);
}
writeFileSync(out, pcm);
console.log('wrote', out, `(peak before normalise ${peak.toFixed(2)})`);
