import { daysText, getLocale, t } from './i18n';
import { colorOf, placeFull, placeName, type Stay } from './storage';
import { MONTHS, SLOTS, WEEKS, YEAR, daysOf, monthName, rangeLabel, slotsOf, weeksLabel } from './weeks';

const FONT = '"975HazyGo", -apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", "Microsoft JhengHei", sans-serif';
const TAGLINE_FONT = '16px "Pixelify Sans", monospace';
const SCALE = 2;
const PAD = 40;
const SLOT_W = 20;
const TITLE_H = 56;
const MONTH_H = 28;
const TRACK_H = 100;
const ROW_H = 28;
const COLS = 3;

const TEXT = '#222222';
const MUTED = '#6a6a6a';
const LINE = '#ebebeb';
const LINE_STRONG = '#dddddd';
const SUBTLE = '#f7f7f7';

function ellipsize(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

// Draws the whole year at a fixed width, so the image doesn't depend on the window size or scroll position.
export async function renderPng(stays: Stay[]): Promise<Blob> {
  // Canvas text falls back silently if the web font hasn't been fetched yet, so load every glyph we'll draw first.
  const title = t('app.title');
  const tagline = `${t('app.tagline')} · ${YEAR}`;
  // Every character the image can contain: the title, digits and punctuation, unit words, month names, places.
  const text = `${title}0123456789/–()（）${t('sep')}${t('unit.weeks', { n: '' })}${daysText(2)}${MONTHS.map((m) => monthName(m.month)).join('')}${stays.map((s) => `${placeFull(s)}${s.note ?? ''}`).join('')}`;
  await Promise.all([
    ...[`13px ${FONT}`, `600 13px ${FONT}`].map((font) => document.fonts.load(font, text)),
    document.fonts.load(TAGLINE_FONT, tagline),
  ]).catch(() => undefined);
  const sorted = [...stays].sort((a, b) => a.startDay - b.startDay);
  const trackW = SLOTS * SLOT_W;
  const width = trackW + PAD * 2;
  const monthsY = PAD + TITLE_H;
  const trackY = monthsY + MONTH_H;
  const listY = trackY + TRACK_H + 36;
  const rows = Math.ceil(sorted.length / COLS);
  const height = (rows ? listY + rows * ROW_H : trackY + TRACK_H) + PAD;

  const canvas = document.createElement('canvas');
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = TEXT;
  ctx.font = `600 28px ${FONT}`;
  ctx.fillText(title, PAD, PAD + 28);
  const titleW = ctx.measureText(title).width;
  ctx.fillStyle = MUTED;
  ctx.font = TAGLINE_FONT;
  ctx.fillText(tagline, PAD + titleW + 14, PAD + 28);

  // Track background, week lines and dates
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
    ctx.lineTo(x + 0.5, trackY + TRACK_H);
    ctx.stroke();
    ctx.strokeStyle = LINE_STRONG;
    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    ctx.moveTo(x + SLOT_W + 0.5, trackY);
    ctx.lineTo(x + SLOT_W + 0.5, trackY + TRACK_H);
    ctx.stroke();
    ctx.fillStyle = MUTED;
    ctx.fillText(String(w.start.getDate()), x + 4, trackY + 15);
  }
  ctx.setLineDash([]);

  ctx.font = `600 13px ${FONT}`;
  ctx.fillStyle = TEXT;
  for (const m of MONTHS) ctx.fillText(monthName(m.month), PAD + m.startIndex * 2 * SLOT_W + 6, monthsY + 14);

  // Stays
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
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 14px ${FONT}`;
    ctx.fillText(ellipsize(ctx, placeName(stay), w - 20), x + 12, y + h / 2 - 2);
    ctx.globalAlpha = 0.9;
    ctx.font = `11px ${FONT}`;
    const sub = `${weeksLabel(daysOf(stay))}${stay.note ? `${t('sep')}${stay.note.replace(/\s+/g, ' ')}` : ''}`;
    ctx.fillText(ellipsize(ctx, sub, w - 20), x + 12, y + h / 2 + 14);
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
    cx += ctx.measureText(meta).width + 12;
    const note = stay.note?.replace(/\s+/g, ' ');
    if (note && right - cx > 40) ctx.fillText(ellipsize(ctx, note, right - cx), cx, y + 15);
  });

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed'))), 'image/png'),
  );
}
