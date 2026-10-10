import { flagCode } from './flags';
import type { HolidaySet } from './holidays';
import { daysText, getLocale, t } from './i18n';
import { colorOf, countryOf, placeFull, placeName, type Stay } from './storage';
import { compose, SIZE as AVATAR_SIZE, type Avatar } from './avatar';
import { getProfile } from './profile';
import { checkSchengen, residenceDays } from './stayRules';
import { MONTHS, SLOTS, TOTAL_DAYS, WEEKS, YEAR, daysOf, monthName, monthRange, rangeLabel, slotsOf, weeksLabel } from './weeks';

const FONT = '"975HazyGo", -apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif';
const TAGLINE_FONT = '16px "Pixelify Sans", monospace';
const SCALE = 2;
const PAD = 40;
const SLOT_W = 20;
const TITLE_H = 84; // title, then the one-line summary under it
const MONTH_H = 28;
const LANE_H = 22; // one per holiday set that is switched on
const TRACK_H = 100;
const BAR_H = 22; // country strips under the stays
const ROW_H = 28;
const COLS = 3;

const TEXT = '#222222';
const MUTED = '#6a6a6a';
const LINE = '#ebebeb';
const LINE_STRONG = '#dddddd';
const SUBTLE = '#f7f7f7';
const DANGER = '#c13515';

// Phosphor's bold ticket icon, on its 256-unit grid.
const TICKET_PATH =
  'M232,108a12,12,0,0,0,12-12V64a20,20,0,0,0-20-20H32A20,20,0,0,0,12,64V96a12,12,0,0,0,12,12,20,20,0,0,1,0,40,12,12,0,0,0-12,12v32a20,20,0,0,0,20,20H224a20,20,0,0,0,20-20V160a12,12,0,0,0-12-12,20,20,0,0,1,0-40ZM36,170.34a44,44,0,0,0,0-84.68V68H88V188H36Zm184,0V188H112V68H220V85.66a44,44,0,0,0,0,84.68Z';

export type PngOptions = { holidaySets?: HolidaySet[] };
export type PngLayout = 'landscape' | 'portrait';

function ellipsize(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

function drawTicket(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 256, size / 256);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(TICKET_PATH));
  ctx.restore();
}

// The flag SVGs are already wired up by the flag-icons stylesheet; borrow the URL it resolved for each code.
function loadFlags(codes: string[]): Promise<Map<string, HTMLImageElement>> {
  const probe = document.createElement('span');
  probe.style.display = 'none';
  document.body.append(probe);
  const urls = codes.map((code) => {
    probe.className = `fi fi-${code}`;
    // Small flags are inlined as data: URIs, which contain brackets of their own, so take everything inside url("…").
    return [code, /^url\("(.*)"\)$/.exec(getComputedStyle(probe).backgroundImage)?.[1]] as const;
  });
  probe.remove();
  return Promise.all(
    urls.map(
      ([code, url]) =>
        new Promise<[string, HTMLImageElement | null]>((resolve) => {
          if (!url) return resolve([code, null]);
          const img = new Image();
          img.onload = () => resolve([code, img]);
          img.onerror = () => resolve([code, null]);
          img.src = url;
        }),
    ),
  ).then((pairs) => new Map(pairs.filter((p): p is [string, HTMLImageElement] => p[1] !== null)));
}

// One strip per country under the stays; back-to-back stays in the same country share one (as on the timeline).
function countryBars(sorted: Stay[]) {
  const bars: { country: string; color: string; s: number; e: number }[] = [];
  for (const stay of sorted) {
    if (!stay.country) continue;
    const { s, e } = slotsOf(stay);
    const last = bars[bars.length - 1];
    if (last && last.country === stay.country && last.e === s) last.e = e;
    else bars.push({ country: stay.country, color: colorOf(stay), s, e });
  }
  return bars;
}

// The saved character, if any, as squares of `size` px per pixel (whole numbers keep the edges sharp).
function drawAvatar(ctx: CanvasRenderingContext2D, avatar: Avatar, x: number, y: number, size: number) {
  compose(avatar).forEach((row, py) =>
    row.forEach((colour, px) => {
      if (!colour) return;
      ctx.fillStyle = colour;
      ctx.fillRect(x + px * size, y + py * size, size, size);
    }),
  );
}

// The line under the title: time planned, places, and the day-count rules when they apply.
function summaryLine(stays: Stay[]): { text: string; warn: boolean } {
  const planned = stays.reduce((n, s) => n + daysOf(s), 0);
  const countries = new Set(stays.filter((s) => s.country).map((s) => s.country)).size;
  const cities = new Set(stays.filter((s) => s.city).map((s) => `${s.country}/${s.city}`)).size;
  const profile = getProfile();
  const parts = [
    // The nickname from the profile, if any, leads the line: "Simon 的遊牧計畫".
    ...(profile.nickname ? [t('png.owner', { name: profile.nickname })] : []),
    t('summary.time', { planned: weeksLabel(planned), free: weeksLabel(TOTAL_DAYS - planned) }),
    t('summary.places', { countries, cities }),
  ];
  const schengen = checkSchengen(stays);
  if (schengen.days > 0) parts.push(t('rules.schengen', { peak: schengen.peak }));
  const tw = residenceDays(stays, profile.taxResidence);
  if (tw > 0) parts.push(t('rules.residence', { country: countryOf({ country: profile.taxResidence, city: '' }), days: daysText(tw), year: YEAR }));
  return { text: parts.join(t('sep')), warn: schengen.firstOver !== null };
}

// Draws the whole year at a fixed width, so the image doesn't depend on the window size or scroll position.
export async function renderPng(stays: Stay[], { holidaySets = [] }: PngOptions = {}): Promise<Blob> {
  const sorted = [...stays].sort((a, b) => a.startDay - b.startDay);
  const bars = countryBars(sorted);
  const summary = summaryLine(sorted);
  const title = t('app.title');
  const tagline = t('app.tagline');

  // Canvas text falls back silently if the web font hasn't been fetched yet, so load every glyph we'll draw first.
  const text = [
    title,
    summary.text,
    '0123456789/–()（）…',
    t('unit.weeks', { n: '' }),
    daysText(2),
    MONTHS.map((m) => monthName(m.month)).join(''),
    sorted.map((s) => `${placeFull(s)}${s.note ?? ''}`).join(''),
    bars.map((b) => countryOf({ country: b.country, city: '' })).join(''),
    holidaySets.flatMap((set) => set.holidays.map((h) => h.short)).join(''),
  ].join('');
  const [flags] = await Promise.all([
    loadFlags([...new Set(bars.map((b) => flagCode(b.country)).filter((c): c is string => Boolean(c)))]),
    Promise.all([
      ...[`10px ${FONT}`, `600 13px ${FONT}`].map((font) => document.fonts.load(font, text)),
      document.fonts.load(TAGLINE_FONT, tagline),
    ]).catch(() => undefined),
  ]);

  const trackW = SLOTS * SLOT_W;
  const width = trackW + PAD * 2;
  const monthsY = PAD + TITLE_H;
  const lanesY = monthsY + MONTH_H;
  const trackY = lanesY + holidaySets.length * LANE_H;
  const barsY = trackY + TRACK_H + 6;
  const listY = barsY + BAR_H + 36;
  const rows = Math.ceil(sorted.length / COLS);
  const height = (rows ? listY + rows * ROW_H : barsY + BAR_H) + PAD;

  const canvas = document.createElement('canvas');
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Title, tagline and the summary line; the character, if one is saved, at the right end of them
  const avatar = getProfile().avatar;
  const avatarW = AVATAR_SIZE * 2;
  if (avatar) drawAvatar(ctx, avatar, PAD + trackW - avatarW, PAD - 12, 2);
  const headW = avatar ? trackW - avatarW - 16 : trackW;
  ctx.fillStyle = TEXT;
  ctx.font = `600 28px ${FONT}`;
  ctx.fillText(title, PAD, PAD + 28);
  const titleW = ctx.measureText(title).width;
  ctx.fillStyle = MUTED;
  ctx.font = TAGLINE_FONT;
  ctx.fillText(tagline, PAD + titleW + 14, PAD + 28);
  ctx.font = `14px ${FONT}`;
  ctx.fillStyle = summary.warn ? DANGER : MUTED;
  ctx.fillText(ellipsize(ctx, summary.text, headW), PAD, PAD + 58);

  // Track background, week lines and dates
  const gridBottom = trackY + TRACK_H;
  ctx.fillStyle = SUBTLE;
  ctx.fillRect(PAD, trackY, trackW, TRACK_H);
  ctx.lineWidth = 1;
  ctx.font = `10px ${FONT}`;
  for (const w of WEEKS) {
    const x = PAD + w.index * 2 * SLOT_W;
    const monthStart = MONTHS.some((m) => m.startIndex === w.index);
    ctx.strokeStyle = monthStart ? LINE_STRONG : LINE;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x + 0.5, monthStart ? monthsY : trackY);
    ctx.lineTo(x + 0.5, gridBottom);
    ctx.stroke();
    ctx.strokeStyle = LINE_STRONG;
    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    ctx.moveTo(x + SLOT_W + 0.5, trackY);
    ctx.lineTo(x + SLOT_W + 0.5, gridBottom);
    ctx.stroke();
    ctx.fillStyle = MUTED;
    ctx.fillText(String(w.start.getDate()), x + 4, trackY + 15);
  }
  ctx.setLineDash([]);

  ctx.font = `600 13px ${FONT}`;
  ctx.fillStyle = TEXT;
  for (const m of MONTHS) ctx.fillText(monthName(m.month), PAD + m.startIndex * 2 * SLOT_W + 6, monthsY + 14);

  // Holiday lanes: a coloured bar at the real dates with its short name under it, as on the timeline
  const dayX = (day: number) => PAD + (day / TOTAL_DAYS) * trackW;
  holidaySets.forEach((set, i) => {
    const y = lanesY + i * LANE_H;
    for (const h of set.holidays) {
      const x = dayX(h.startDay);
      ctx.fillStyle = set.color;
      ctx.beginPath();
      ctx.roundRect(x, y + 2, Math.max(4, dayX(h.endDay + 1) - x), 5, 3);
      ctx.fill();
      ctx.font = `600 10px ${FONT}`;
      ctx.fillText(h.short, x, y + 18);
    }
  });

  // Stays, with a ticket mark in the corner when a flight is booked
  for (const stay of sorted) {
    const { s, e } = slotsOf(stay);
    const x = PAD + s * SLOT_W + 1;
    const w = (e - s) * SLOT_W - 2;
    const y = trackY + 24;
    const h = TRACK_H - 34;
    ctx.fillStyle = colorOf(stay);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    if (w < 30) continue;
    ctx.save();
    ctx.clip();
    const ticketRoom = stay.ticket && w >= 60 ? 22 : 0;
    if (ticketRoom) drawTicket(ctx, x + w - 22, y + 8, 14, 'rgb(255 255 255 / 0.9)');
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 14px ${FONT}`;
    ctx.fillText(ellipsize(ctx, placeName(stay), w - 20 - ticketRoom), x + 12, y + h / 2 - 2);
    ctx.globalAlpha = 0.9;
    ctx.font = `11px ${FONT}`;
    const sub = `${weeksLabel(daysOf(stay))}${stay.note ? `${t('sep')}${stay.note.replace(/\s+/g, ' ')}` : ''}`;
    ctx.fillText(ellipsize(ctx, sub, w - 20), x + 12, y + h / 2 + 14);
    ctx.restore();
  }

  // Country strips: the stay's colour at 30%, flag and country name
  for (const bar of bars) {
    const x = PAD + bar.s * SLOT_W + 1;
    const w = (bar.e - bar.s) * SLOT_W - 2;
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = bar.color;
    ctx.beginPath();
    ctx.roundRect(x, barsY, w, BAR_H, 6);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, barsY, w, BAR_H);
    ctx.clip();
    let cx = x + 6;
    const code = flagCode(bar.country);
    const flag = code ? flags.get(code) : undefined;
    if (flag) {
      ctx.drawImage(flag, cx, barsY + 5, 16, 12);
      cx += 22;
    }
    ctx.fillStyle = TEXT;
    ctx.font = `600 11px ${FONT}`;
    ctx.fillText(ellipsize(ctx, countryOf({ country: bar.country, city: '' }), x + w - cx - 6), cx, barsY + 15);
    ctx.restore();
  }

  // Stay list, filled column by column
  const colW = trackW / COLS;
  sorted.forEach((stay, i) => {
    const x = PAD + Math.floor(i / rows) * colW;
    const y = listY + (i % rows) * ROW_H;
    const right = x + colW - 24;
    ctx.fillStyle = colorOf(stay);
    ctx.beginPath();
    ctx.roundRect(x, y + 5, 10, 10, 5);
    ctx.fill();
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(rangeLabel(stay), x + 20, y + 15);
    let cx = x + (getLocale() === 'en' ? 170 : 130); // English dates ("Dec 28 – Jan 12") run wider
    ctx.font = `600 13px ${FONT}`;
    ctx.fillStyle = TEXT;
    const name = ellipsize(ctx, placeFull(stay), 180);
    ctx.fillText(name, cx, y + 15);
    cx += ctx.measureText(name).width + 10;
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = MUTED;
    const meta = `${weeksLabel(daysOf(stay))}${t('sep')}${daysText(daysOf(stay))}`;
    ctx.fillText(meta, cx, y + 15);
    cx += ctx.measureText(meta).width + 10;
    if (stay.ticket) {
      drawTicket(ctx, cx, y + 3, 14, TEXT);
      cx += 22;
    }
    const note = stay.note?.replace(/\s+/g, ' ');
    if (note && right - cx > 40) ctx.fillText(ellipsize(ctx, note, right - cx), cx, y + 15);
  });

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed'))), 'image/png'),
  );
}

// The phone-shaped version (9:16, for stories): title, the summary wrapped over lines, the year as twelve month
// rows, then the stays one per row. A long plan is cut short with "N more" rather than shrunk.
const P_W = 540;
const P_H = 960;
const P_MONTH_H = 26;
const P_ROW_H = 46;

function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const lines: string[] = [];
  // Break at the separator between parts first, then by characters when a part alone is too long.
  let line = '';
  for (const part of text.split(t('sep'))) {
    const next = line ? `${line}${t('sep')}${part}` : part;
    if (ctx.measureText(next).width <= max) line = next;
    else {
      if (line) lines.push(line);
      line = part;
      while (ctx.measureText(line).width > max) {
        let cut = line.length;
        while (cut > 1 && ctx.measureText(line.slice(0, cut)).width > max) cut--;
        lines.push(line.slice(0, cut));
        line = line.slice(cut);
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function renderPortraitPng(stays: Stay[]): Promise<Blob> {
  const sorted = [...stays].sort((a, b) => a.startDay - b.startDay);
  const summary = summaryLine(sorted);
  const title = t('app.title');
  const tagline = t('app.tagline');
  const codes = [...new Set(sorted.map((s) => flagCode(s.country)).filter((c): c is string => Boolean(c)))];
  const text = [
    title,
    summary.text,
    '0123456789/–()（）…+',
    t('unit.weeks', { n: '' }),
    daysText(2),
    t('share.more', { n: 0 }),
    MONTHS.map((m) => monthName(m.month)).join(''),
    sorted.map((s) => placeFull(s)).join(''),
  ].join('');
  const [flags] = await Promise.all([
    loadFlags(codes),
    Promise.all([
      ...[`12px ${FONT}`, `600 14px ${FONT}`].map((font) => document.fonts.load(font, text)),
      document.fonts.load(TAGLINE_FONT, tagline),
    ]).catch(() => undefined),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = P_W * SCALE;
  canvas.height = P_H * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, P_W, P_H);
  const inner = P_W - PAD * 2;

  // Title, tagline, summary; the character, if one is saved, beside the title and tagline
  const avatar = getProfile().avatar;
  const avatarW = AVATAR_SIZE * 3;
  if (avatar) drawAvatar(ctx, avatar, P_W - PAD - avatarW, PAD - 16, 3);
  let y = PAD + 30;
  ctx.fillStyle = TEXT;
  ctx.font = `600 30px ${FONT}`;
  ctx.fillText(ellipsize(ctx, title, avatar ? inner - avatarW - 12 : inner), PAD, y);
  y += 30;
  ctx.fillStyle = MUTED;
  ctx.font = TAGLINE_FONT;
  ctx.fillText(tagline, PAD, y);
  y += 34;
  ctx.font = `14px ${FONT}`;
  ctx.fillStyle = summary.warn ? DANGER : MUTED;
  for (const line of wrap(ctx, summary.text, inner).slice(0, 3)) {
    ctx.fillText(line, PAD, y);
    y += 22;
  }

  // Twelve month rows: each a bar of that month's days, coloured where a stay falls
  y += 16;
  const labelW = 52;
  const barW = inner - labelW;
  for (const m of MONTHS) {
    const range = monthRange(m.month);
    const days = range.endDay - range.startDay + 1;
    ctx.font = `600 12px ${FONT}`;
    ctx.fillStyle = TEXT;
    ctx.fillText(monthName(m.month), PAD, y + 13);
    ctx.fillStyle = SUBTLE;
    ctx.beginPath();
    ctx.roundRect(PAD + labelW, y + 2, barW, 14, 4);
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(PAD + labelW, y + 2, barW, 14, 4);
    ctx.clip();
    for (const stay of sorted) {
      const from = Math.max(stay.startDay, range.startDay);
      const to = Math.min(stay.endDay, range.endDay);
      if (from > to) continue;
      const x = PAD + labelW + ((from - range.startDay) / days) * barW;
      const w = ((to - from + 1) / days) * barW;
      ctx.fillStyle = colorOf(stay);
      ctx.fillRect(x + 0.5, y + 2, Math.max(1, w - 1), 14);
    }
    ctx.restore();
    y += P_MONTH_H;
  }

  // Stays: dot, flag, place, length on the right; dates under the place
  y += 20;
  ctx.strokeStyle = LINE;
  ctx.beginPath();
  ctx.moveTo(PAD, y - 8);
  ctx.lineTo(P_W - PAD, y - 8);
  ctx.stroke();
  const fits = Math.floor((P_H - PAD - y) / P_ROW_H);
  const shown = sorted.length > fits ? sorted.slice(0, Math.max(0, fits - 1)) : sorted;
  for (const stay of shown) {
    ctx.fillStyle = colorOf(stay);
    ctx.beginPath();
    ctx.roundRect(PAD, y + 8, 10, 10, 5);
    ctx.fill();
    let x = PAD + 20;
    const code = flagCode(stay.country);
    const flag = code ? flags.get(code) : undefined;
    if (flag) {
      ctx.drawImage(flag, x, y + 6, 18, 13.5);
      x += 26;
    }
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = MUTED;
    const length = `${weeksLabel(daysOf(stay))}${t('paren', { x: daysText(daysOf(stay)) })}`;
    const lengthW = ctx.measureText(length).width;
    ctx.fillText(length, P_W - PAD - lengthW, y + 18);
    ctx.font = `600 15px ${FONT}`;
    ctx.fillStyle = TEXT;
    ctx.fillText(ellipsize(ctx, placeFull(stay), P_W - PAD - lengthW - 16 - x), x, y + 18);
    ctx.font = `12px ${FONT}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(rangeLabel(stay), PAD + 20, y + 36);
    y += P_ROW_H;
  }
  if (shown.length < sorted.length) {
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = MUTED;
    ctx.fillText(t('share.more', { n: sorted.length - shown.length }), PAD + 20, y + 18);
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed'))), 'image/png'),
  );
}
