import { Fragment, Suspense, lazy, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, PointerEvent as ReactPointerEvent } from 'react';
import { Minus } from '@phosphor-icons/react/dist/csr/Minus';
import { PencilSimple } from '@phosphor-icons/react/dist/csr/PencilSimple';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { renderPng } from './exportPng';
import { Flag } from './Flag';
import MonthView from './MonthView';
import { flightStats, useCoords } from './useCoords';
import { HOLIDAY_SETS, type Holiday, type HolidaySet } from './holidays';
import { PALETTE, colorKeyOf, colorOf, defaultColor, placeFull, placeName, load, overlaps, sanitize, save, serialize, pushStays, reorderStays, type ColorKey, type Stay } from './storage';
import {
  MONTHS,
  SLOTS,
  TOTAL_DAYS,
  WEEKS,
  YEAR,
  currentWeekIndex,
  dayOfBoundary,
  dayOfIso,
  longRangeLabel,
  monthRange,
  daysOf,
  isoOfDay,
  rangeLabel,
  slotsOf,
  weeksLabel,
  type DayRange,
} from './weeks';

type Drag =
  | { kind: 'select'; anchor: number; lo: number; hi: number } // slots, inclusive
  | (DayRange & { kind: 'move'; id: string; grabSlot: number; orig: DayRange; moved: boolean })
  | (DayRange & { kind: 'resize'; id: string; edge: 'l' | 'r'; grabSlot: number; moved: boolean });

type Editing = DayRange & { id: string | null };
type StayDetails = Pick<Stay, 'country' | 'city' | 'companions' | 'note'>;

type History = { past: Stay[][]; present: Stay[]; future: Stay[][] };
const HISTORY_LIMIT = 100;

// The map library is large; load it separately from the planner itself.
const MapView = lazy(() => import('./MapView'));

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

const MOD = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+';

const ZOOM_KEY = 'dnp-zoom';
const ZOOM_MIN = 1;
const ZOOM_MAX = 6;
const ZOOM_STEP = 0.25;

const HOLIDAYS_KEY = 'dnp-holidays';
type HolidayToggles = Record<HolidaySet['key'], boolean>;

function loadHolidayToggles(): HolidayToggles {
  try {
    const saved = JSON.parse(localStorage.getItem(HOLIDAYS_KEY) ?? '{}');
    return { tw: saved?.tw === true, au: saved?.au === true };
  } catch {
    return { tw: false, au: false };
  }
}

const VIEW_KEY = 'dnp-view';
type View = { mode: 'year' | 'month'; month: number };

function loadView(): View {
  try {
    const v = JSON.parse(localStorage.getItem(VIEW_KEY) ?? '{}');
    const month = Number.isInteger(v?.month) && v.month >= 0 && v.month <= 11 ? v.month : 0;
    return { mode: v?.mode === 'month' ? 'month' : 'year', month };
  } catch {
    return { mode: 'year', month: 0 };
  }
}

function loadZoom(): number {
  try {
    const z = Number(localStorage.getItem(ZOOM_KEY));
    return z >= ZOOM_MIN && z <= ZOOM_MAX ? z : ZOOM_MIN;
  } catch {
    return ZOOM_MIN;
  }
}
const slotCol = (s: number, e: number): CSSProperties => ({ gridColumn: `${s + 1} / ${e + 1}` });
const stayCol = (r: DayRange) => {
  const { s, e } = slotsOf(r);
  return slotCol(s, e);
};

export default function App() {
  const [history, setHistory] = useState<History>(() => ({ past: [], present: load(), future: [] }));
  const stays = history.present;
  // Every change to the plan goes through here so it lands on the undo stack.
  const setStays = (update: Stay[] | ((prev: Stay[]) => Stay[])) =>
    setHistory((h) => {
      const next = typeof update === 'function' ? update(h.present) : update;
      if (next === h.present) return h;
      return { past: [...h.past, h.present].slice(-HISTORY_LIMIT), present: next, future: [] };
    });
  const undo = () =>
    setHistory((h) =>
      h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] } : h,
    );
  const redo = () =>
    setHistory((h) =>
      h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) } : h,
    );
  const [drag, setDrag] = useState<Drag | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [zoom, setZoom] = useState(loadZoom);
  const [view, setView] = useState(loadView);
  const [quarter, setQuarter] = useState(0); // 0 = whole year
  const { coords, failed: coordsFailed } = useCoords(stays);
  const [holidayOn, setHolidayOn] = useState(loadHolidayToggles);
  const [stayCard, setStayCard] = useState<{ id: string; x: number; y: number } | null>(null);
  const [holidayCard, setHolidayCard] = useState<{ holiday: Holiday; set: HolidaySet; x: number; y: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Captured before a zoom so the same spot of the timeline stays under the anchor (pointer or viewport centre):
  // `frac` is that spot as a fraction of the timeline, `offset` its distance from the scroller's left edge.
  const zoomAnchor = useRef<{ frac: number; offset: number } | null>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const fileRef = useRef<HTMLInputElement>(null);
  const thisWeek = useMemo(() => currentWeekIndex(), []);

  useEffect(() => save(stays), [stays]);

  useEffect(() => {
    try {
      localStorage.setItem(HOLIDAYS_KEY, JSON.stringify(holidayOn));
    } catch {
      // toggles just won't be remembered
    }
  }, [holidayOn]);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, JSON.stringify(view));
    } catch {
      // view just won't be remembered
    }
  }, [view]);

  // Dragging the month header pans the (zoomed) timeline; a plain click opens that month.
  const pan = useRef<{ x: number; left: number; month: number | null; moved: boolean } | null>(null);
  const [panning, setPanning] = useState(false);
  function onPanStart(e: ReactPointerEvent<HTMLDivElement>) {
    const el = scrollRef.current;
    if (e.button !== 0 || !el) return;
    const label = (e.target as HTMLElement).closest<HTMLElement>('[data-month]');
    pan.current = { x: e.clientX, left: el.scrollLeft, month: label ? Number(label.dataset.month) : null, moved: false };
    setPanning(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function onPanMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!pan.current || !scrollRef.current) return;
    const dx = e.clientX - pan.current.x;
    if (Math.abs(dx) > 4) pan.current.moved = true;
    scrollRef.current.scrollLeft = pan.current.left - dx;
  }
  function onPanEnd() {
    const p = pan.current;
    if (p && !p.moved && p.month !== null) setView({ mode: 'month', month: p.month });
    pan.current = null;
    setPanning(false);
  }

  const busy = Boolean(drag || editing);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || busy) return;
      // Leave native text undo alone while typing in a field.
      const el = e.target;
      if (el instanceof Element && el.closest('input:not([type=range]), textarea, [contenteditable]')) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) undo();
      else if ((key === 'z' && e.shiftKey) || (key === 'y' && !e.shiftKey)) redo();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy]);

  // anchorX is a clientX to zoom around; without it the viewport centre stays put.
  function zoomTo(next: number, anchorX?: number) {
    const el = scrollRef.current;
    if (el) {
      const offset = anchorX === undefined ? el.clientWidth / 2 : anchorX - el.getBoundingClientRect().left;
      zoomAnchor.current = { frac: (el.scrollLeft + offset) / el.scrollWidth, offset };
    }
    setZoom(clamp(next, ZOOM_MIN, ZOOM_MAX));
  }
  // Buttons and the slider move in whole steps; pinching is continuous.
  const changeZoom = (next: number) => zoomTo(Math.round(next / ZOOM_STEP) * ZOOM_STEP);

  // Pinch to zoom: trackpads report it as ctrl+wheel (Chrome, Firefox) or gesture events (Safari);
  // touch screens as two fingers. All three need non-passive listeners to stop the page itself zooming.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      // ctrl is what a trackpad pinch sends; alt is the same zoom for a plain mouse wheel.
      if (!e.ctrlKey && !e.altKey) return;
      e.preventDefault();
      // A mouse wheel notch is far larger than a trackpad pinch step, so cap each event.
      zoomTo(zoomRef.current * Math.exp(-clamp(e.deltaY || e.deltaX, -30, 30) * 0.01), e.clientX);
    };
    let gestureStart = ZOOM_MIN;
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      gestureStart = zoomRef.current;
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      const g = e as Event & { scale: number; clientX: number };
      zoomTo(gestureStart * g.scale, g.clientX);
    };
    let pinch: { dist: number; zoom: number } | null = null;
    const spread = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      pinch = { dist: spread(e.touches), zoom: zoomRef.current };
      setDrag(null); // the first finger may have started a selection
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();
      zoomTo((pinch.zoom * spread(e.touches)) / pinch.dist, (e.touches[0].clientX + e.touches[1].clientX) / 2);
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch = null;
    };
    const active = { passive: false } as const;
    el.addEventListener('wheel', onWheel, active);
    el.addEventListener('gesturestart', onGestureStart, active);
    el.addEventListener('gesturechange', onGestureChange, active);
    el.addEventListener('touchstart', onTouchStart, active);
    el.addEventListener('touchmove', onTouchMove, active);
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('gesturestart', onGestureStart);
      el.removeEventListener('gesturechange', onGestureChange);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
    // The scroller only exists in the year view, so re-attach when the view changes.
  }, [view.mode]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    const anchor = zoomAnchor.current;
    if (el && anchor) el.scrollLeft = anchor.frac * el.scrollWidth - anchor.offset;
    zoomAnchor.current = null;
    try {
      localStorage.setItem(ZOOM_KEY, String(zoom));
    } catch {
      // zoom just won't be remembered
    }
  }, [zoom]);

  const sorted = useMemo(() => [...stays].sort((a, b) => a.startDay - b.startDay), [stays]);
  // Days per country, each with its cities; stays without a country sit in a '' group.
  const totals = useMemo(() => {
    const groups = new Map<string, { days: number; cities: Map<string, { days: number; stay: Stay }> }>();
    for (const s of sorted) {
      const g = groups.get(s.country) ?? { days: 0, cities: new Map() };
      groups.set(s.country, g);
      g.days += daysOf(s);
      const c = g.cities.get(s.city) ?? { days: 0, stay: s };
      g.cities.set(s.city, c);
      c.days += daysOf(s);
    }
    return [...groups.entries()]
      .map(([country, g]) => ({
        country,
        days: g.days,
        // Stays with no city are keyed '' and listed last, labelled 其他.
        cities: [...g.cities.entries()].sort((a, b) => Number(!a[0]) - Number(!b[0]) || b[1].days - a[1].days),
      }))
      .sort((a, b) => b.days - a.days);
  }, [sorted]);
  const countryCount = totals.filter((g) => g.country).length;
  const cityCount = totals.reduce((n, g) => n + g.cities.filter(([city]) => city).length, 0);
  const flights = useMemo(() => flightStats(stays, coords), [stays, coords]);
  // The itinerary list follows the month in month view; in year view it can be narrowed to a quarter.
  const monthFilter = view.mode === 'month' ? monthRange(view.month) : null;
  const quarterFilter: DayRange | null =
    quarter === 0
      ? null
      : {
          // Q1 and Q4 also take the few days of the neighbouring years that the timeline shows.
          startDay: quarter === 1 ? 0 : monthRange(quarter * 3 - 3).startDay,
          endDay: quarter === 4 ? TOTAL_DAYS - 1 : monthRange(quarter * 3 - 1).endDay,
        };
  const listRange = monthFilter ?? quarterFilter;
  const listed = listRange ? sorted.filter((s) => overlaps(s, listRange)) : sorted;
  const plannedDays = stays.reduce((n, s) => n + daysOf(s), 0);

  const slotAt = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    return clamp(Math.floor(((clientX - rect.left) / rect.width) * SLOTS), 0, SLOTS - 1);
  };
  const slotFree = (slot: number) =>
    slot >= 0 &&
    slot < SLOTS &&
    !stays.some((st) => {
      const { s, e } = slotsOf(st);
      return slot >= s && slot < e;
    });
  // Trims a day range so it doesn't run into neighbouring stays; null if nothing is left.
  const fit = (range: DayRange): DayRange | null => {
    let { startDay, endDay } = range;
    for (const o of sorted) {
      if (o.endDay < startDay || o.startDay > endDay) continue;
      if (o.startDay <= startDay) startDay = o.endDay + 1;
      else endDay = Math.min(endDay, o.startDay - 1);
    }
    return startDay <= endDay ? { startDay, endDay } : null;
  };

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const slot = slotAt(e.clientX);
    const target = e.target as HTMLElement;
    const stayEl = target.closest<HTMLElement>('[data-stay]');
    if (stayEl) {
      const stay = stays.find((s) => s.id === stayEl.dataset.stay);
      if (!stay) return;
      const edge = target.dataset.edge as 'l' | 'r' | undefined;
      const range = { startDay: stay.startDay, endDay: stay.endDay };
      const base = { id: stay.id, grabSlot: slot, moved: false, ...range };
      setDrag(edge ? { kind: 'resize', edge, ...base } : { kind: 'move', orig: range, ...base });
    } else {
      if (!slotFree(slot)) return;
      setDrag({ kind: 'select', anchor: slot, lo: slot, hi: slot });
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const slot = slotAt(e.clientX);
    if (drag.kind === 'select') {
      // Extend from the anchor toward the pointer, stopping at the first occupied slot.
      const dir = slot >= drag.anchor ? 1 : -1;
      let reach = drag.anchor;
      while (reach !== slot && slotFree(reach + dir)) reach += dir;
      setDrag({ ...drag, lo: Math.min(drag.anchor, reach), hi: Math.max(drag.anchor, reach) });
      return;
    }
    if (drag.kind === 'move') {
      const len = daysOf(drag.orig);
      const rangeAt = (delta: number): DayRange => {
        // Whole-week moves keep the exact dates; half-week moves snap the start to a slot boundary.
        const raw =
          delta % 2 === 0
            ? drag.orig.startDay + (delta / 2) * 7
            : dayOfBoundary(clamp(slotsOf(drag.orig).s + delta, 0, SLOTS - 1));
        const startDay = clamp(raw, 0, TOTAL_DAYS - len);
        return { startDay, endDay: startDay + len - 1 };
      };
      // The drag only records where the pointer wants the stay; reorderStays decides where it actually lands.
      const next = rangeAt(slot - drag.grabSlot);
      if (next.startDay === drag.startDay) return;
      setDrag({ ...drag, ...next, moved: true });
    } else {
      if (!drag.moved && slot === drag.grabSlot) return;
      const rangeAt = (at: number): DayRange =>
        drag.edge === 'l'
          ? { startDay: Math.min(dayOfBoundary(at), drag.endDay), endDay: drag.endDay }
          : { startDay: drag.startDay, endDay: Math.max(dayOfBoundary(at + 1) - 1, drag.startDay) };
      // Growing into a neighbour pushes it; back off toward the grab point if that runs out of year.
      let next: DayRange | null = null;
      for (let at = slot; ; at += Math.sign(drag.grabSlot - slot)) {
        const range = rangeAt(at);
        if (pushStays(stays, drag.id, range)) {
          next = range;
          break;
        }
        if (at === drag.grabSlot) break;
      }
      if (!next || (next.startDay === drag.startDay && next.endDay === drag.endDay)) return;
      setDrag({ ...drag, ...next, moved: true });
    }
  }

  function onPointerUp() {
    if (!drag) return;
    setDrag(null);
    if (drag.kind === 'select') {
      const range = fit({ startDay: dayOfBoundary(drag.lo), endDay: dayOfBoundary(drag.hi + 1) - 1 });
      if (range) setEditing({ id: null, ...range });
    } else if (drag.moved) {
      setStays((prev) => (drag.kind === 'move' ? reorderStays(prev, drag.id, drag) : (pushStays(prev, drag.id, drag) ?? prev)));
    } else if (drag.kind === 'move') {
      setEditing({ id: drag.id, startDay: drag.startDay, endDay: drag.endDay });
    }
  }

  function saveEditing(details: StayDetails, range: DayRange, color: ColorKey) {
    if (!editing) return;
    const fields = { ...details, color, ...range };
    setStays((prev) =>
      editing.id
        ? prev.map((s) => (s.id === editing.id ? { ...s, ...fields } : s))
        : [...prev, { id: crypto.randomUUID(), ...fields }],
    );
    setEditing(null);
  }

  function deleteEditing() {
    if (!editing?.id) return;
    setStays((prev) => prev.filter((s) => s.id !== editing.id));
    setEditing(null);
  }

  function download(blob: Blob, ext: string) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nomad-plan-${YEAR}.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportJson() {
    download(new Blob([JSON.stringify(serialize(sorted), null, 2)], { type: 'application/json' }), 'json');
  }

  async function savePng() {
    try {
      download(await renderPng(stays), 'png');
    } catch {
      alert('無法產生 PNG，請再試一次。');
    }
  }

  async function importJson(file: File) {
    try {
      const next = sanitize(JSON.parse(await file.text()));
      if (next.length === 0) return alert('檔案裡沒有可用的行程。');
      if (stays.length > 0 && !confirm(`匯入會取代目前的 ${stays.length} 段行程，確定嗎？`)) return;
      setStays(next);
    } catch {
      alert('無法讀取這個檔案，請確認是先前匯出的 JSON。');
    }
  }

  function clearAll() {
    if (confirm('確定清空全部行程？這個動作無法復原。')) setStays([]);
  }

  // What the timeline draws mid-drag: a moved stay reorders past its neighbours, a resized one pushes them.
  const activeId = drag && drag.kind !== 'select' && drag.moved ? drag.id : null;
  const visible =
    drag?.kind === 'move'
      ? reorderStays(stays, drag.id, drag)
      : drag?.kind === 'resize'
        ? (pushStays(stays, drag.id, drag) ?? stays)
        : stays;
  // No card mid-drag or behind the editor; it would only get in the way.
  const hoveredStay = stayCard && !drag && !editing ? stays.find((s) => s.id === stayCard.id) : undefined;
  // One strip per country under the stays; back-to-back stays in the same country share a strip.
  const countryBars: { id: string; country: string; color: string; s: number; e: number }[] = [];
  for (const stay of [...visible].sort((a, b) => a.startDay - b.startDay)) {
    if (!stay.country) continue;
    const { s, e } = slotsOf(stay);
    const last = countryBars[countryBars.length - 1];
    if (last && last.country === stay.country && last.e === s) last.e = e;
    else countryBars.push({ id: stay.id, country: stay.country, color: colorOf(stay), s, e });
  }
  const editingStay = editing?.id ? stays.find((s) => s.id === editing.id) : undefined;

  return (
    <div className="app">
      <header className="topbar">
        <h1>{YEAR} 遊牧年曆</h1>
        <div className="actions">
          <button onClick={undo} disabled={history.past.length === 0} title={`復原（${MOD}Z）`}>復原</button>
          <button onClick={redo} disabled={history.future.length === 0} title={`重做（${MOD}⇧Z）`}>重做</button>
          <button onClick={() => void savePng()} disabled={stays.length === 0}>保存 PNG</button>
          <button onClick={exportJson} disabled={stays.length === 0}>匯出</button>
          <button onClick={() => fileRef.current?.click()}>匯入</button>
          <button onClick={clearAll} disabled={stays.length === 0}>清空</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importJson(file);
              e.target.value = '';
            }}
          />
        </div>
      </header>

      <div className="timeline-bar">
        <div className="segmented" role="tablist" aria-label="檢視">
          {(['year', 'month'] as const).map((mode) => (
            <button
              key={mode}
              role="tab"
              aria-selected={view.mode === mode}
              onClick={() => setView((v) => ({ ...v, mode }))}
            >
              {mode === 'year' ? '年' : '月'}
            </button>
          ))}
        </div>
        <div className="toggles">
          {HOLIDAY_SETS.map((set) => (
            <button
              key={set.key}
              role="switch"
              aria-checked={holidayOn[set.key]}
              className="toggle"
              style={{ '--c': set.color } as CSSProperties}
              onClick={() => setHolidayOn((prev) => ({ ...prev, [set.key]: !prev[set.key] }))}
            >
              <span className="knob" />
              {set.label}
            </button>
          ))}
        </div>
        {view.mode === 'year' && <div className="zoombar">
          <button onClick={() => changeZoom(zoom - ZOOM_STEP)} disabled={zoom <= ZOOM_MIN} aria-label="縮小" title="縮小">
            <Minus size={14} weight="bold" />
          </button>
          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={ZOOM_STEP}
            value={zoom}
            onChange={(e) => changeZoom(Number(e.target.value))}
            aria-label="時間軸縮放"
            style={{ '--pct': `${((zoom - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN)) * 100}%` } as CSSProperties}
          />
          <button onClick={() => changeZoom(zoom + ZOOM_STEP)} disabled={zoom >= ZOOM_MAX} aria-label="放大" title="放大">
            <Plus size={14} weight="bold" />
          </button>
          <span className="zoom-value">{Math.round(zoom * 100)}%</span>
          <button className="reset" onClick={() => changeZoom(ZOOM_MIN)} disabled={zoom === ZOOM_MIN}>
            符合寬度
          </button>
        </div>}
      </div>

      {view.mode === 'month' ? (
        <MonthView
          stays={stays}
          month={view.month}
          onMonth={(month) => setView({ mode: 'month', month: clamp(month, 0, 11) })}
          holidaySets={HOLIDAY_SETS.filter((set) => holidayOn[set.key])}
          pending={editing && !editing.id ? editing : null}
          onCreate={(range) => setEditing({ id: null, ...range })}
          onEdit={(s) => setEditing({ id: s.id, startDay: s.startDay, endDay: s.endDay })}
          onResize={(id, range) => setStays((prev) => pushStays(prev, id, range) ?? prev)}
          onHover={setStayCard}
        />
      ) : (
      <div className="scroll" ref={scrollRef}>
        <div className="timeline" style={{ '--n': SLOTS, '--zoom': zoom } as CSSProperties}>
          <div
            className={`row months${panning ? ' panning' : ''}`}
            onPointerDown={onPanStart}
            onPointerMove={onPanMove}
            onPointerUp={onPanEnd}
            onPointerCancel={onPanEnd}
            title="拖曳可左右移動時間軸，點月份可看該月"
          >
            {MONTHS.map((m) => (
              <div key={m.month} className="month" data-month={m.month} style={{ gridColumn: `${m.startIndex * 2 + 1} / span ${m.span * 2}` }}>
                {m.month + 1} 月
              </div>
            ))}
          </div>
          {HOLIDAY_SETS.filter((set) => holidayOn[set.key]).map((set) => (
            <div key={set.key} className="lane" style={{ '--c': set.color } as CSSProperties} aria-label={set.label}>
              {set.holidays.map((d) => (
                <div
                  key={`${d.name}-${d.startDay}`}
                  className="holiday"
                  style={{ left: `${(d.startDay / TOTAL_DAYS) * 100}%`, width: `${(daysOf(d) / TOTAL_DAYS) * 100}%` }}
                  onMouseEnter={(e) => {
                    // Anchor to the visible label, which can extend past a one-day bar.
                    const r = (e.currentTarget.firstElementChild ?? e.currentTarget).getBoundingClientRect();
                    setHolidayCard({ holiday: d, set, x: r.left + r.width / 2, y: r.bottom });
                  }}
                  onMouseLeave={() => setHolidayCard(null)}
                >
                  <span>{d.short}</span>
                </div>
              ))}
            </div>
          ))}
          <div
            ref={trackRef}
            className={`row track${drag ? ' dragging' : ''}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => setDrag(null)}
          >
            {WEEKS.map((w) => (
              <div
                key={w.index}
                className={`cell${w.index === thisWeek ? ' today' : ''}${MONTHS.some((m) => m.startIndex === w.index) ? ' month-start' : ''}`}
                style={{ gridColumn: `${w.index * 2 + 1} / span 2` }}
                title={rangeLabel({ startDay: w.index * 7, endDay: w.index * 7 + 6 })}
              >
                <span>{w.start.getDate()}</span>
              </div>
            ))}
            {visible.map((s) => {
              const weeks = weeksLabel(daysOf(s));
              return (
                <div
                  key={s.id}
                  data-stay={s.id}
                  className={`stay${s.id === activeId ? ' active' : ''}`}
                  style={{ ...stayCol(s), background: colorOf(s) }}
                  onMouseEnter={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    // A wide block can run off-screen, so centre on the part that is visible.
                    const x = (Math.max(r.left, 0) + Math.min(r.right, window.innerWidth)) / 2;
                    setStayCard({ id: s.id, x, y: r.bottom });
                  }}
                  onMouseLeave={() => setStayCard(null)}
                >
                  <span className="handle" data-edge="l" />
                  <span className="label">
                    <strong>{placeName(s)}</strong>
                    <small>{s.id === activeId ? rangeLabel(s) : `${weeks}${s.note ? `・${s.note.replace(/\s+/g, ' ')}` : ''}`}</small>
                  </span>
                  <span className="handle" data-edge="r" />
                </div>
              );
            })}
            {drag?.kind === 'select' && (
              <div className="selection" style={slotCol(drag.lo, drag.hi + 1)}>
                {(drag.hi - drag.lo + 1) / 2} 週
              </div>
            )}
            {editing && !editing.id && <div className="selection" style={stayCol(editing)} />}
          </div>
          {countryBars.length > 0 && (
            <div className="row countries">
              {countryBars.map((bar) => (
                <div
                  key={bar.id}
                  className="country-bar"
                  style={{ ...slotCol(bar.s, bar.e), '--c': bar.color } as CSSProperties}
                  title={bar.country}
                >
                  <Flag country={bar.country} />
                  <span>{bar.country}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}

      <section className="panels">
        <div className="panel">
          <h2>摘要</h2>
          <p className="stat">
            已安排 <b>{weeksLabel(plannedDays)}</b>・未安排 <b>{weeksLabel(TOTAL_DAYS - plannedDays)}</b>
            <br />
            去了 <b>{countryCount}</b> 個國家・<b>{cityCount}</b> 個城市
            <br />
            <span title="依行程順序、兩地直線距離估算；300 公里內視為陸路不計，未含轉機">
              約 <b>{flights.legs}</b> 個航段・飛行約 <b>{Math.round(flights.hours)}</b> 小時
              {flights.unknown > 0 && `（${flights.unknown} 段查無座標未計）`}
            </span>
          </p>
          <ul className="totals">
            {totals.map((g) => (
              <Fragment key={g.country}>
                {g.country && (
                  <li className="country">
                    <Flag country={g.country} />
                    {g.country}
                    <span>
                      {weeksLabel(g.days)}
                      <small>（{g.days} 天）</small>
                    </span>
                  </li>
                )}
                {g.cities.map(([city, c]) => (
                  <li key={city} className={g.country ? 'city' : undefined}>
                    {city || '其他'}
                    <span>
                      {weeksLabel(c.days)}
                      <small>（{c.days} 天）</small>
                    </span>
                  </li>
                ))}
              </Fragment>
            ))}
          </ul>
        </div>
        <div className="panel grow">
          <div className="panel-head">
            <h2>行程{monthFilter && `・${view.month + 1} 月`}</h2>
            {!monthFilter && (
              <div className="pills" role="group" aria-label="依季度篩選">
                {['全部', 'Q1', 'Q2', 'Q3', 'Q4'].map((label, q) => (
                  <button key={label} aria-pressed={quarter === q} onClick={() => setQuarter(q)}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {listed.length === 0 ? (
            <p className="empty">
              {monthFilter
                ? '這個月還沒有行程。在上面的月曆拖幾天試試。'
                : quarterFilter
                  ? `Q${quarter} 還沒有行程。`
                  : '還沒有行程。到上面的時間軸拖幾格試試。'}
            </p>
          ) : (
            <ol className="stays">
              {listed.map((s) => (
                <li key={s.id}>
                  <i style={{ background: colorOf(s) }} />
                  <span className="when">{longRangeLabel(s)}</span>
                  <strong>{placeName(s)}</strong>
                  {s.city && s.country && <span className="weeks">{s.country}</span>}
                  <span className="weeks">{weeksLabel(daysOf(s))}・{daysOf(s)} 天</span>
                  {s.companions && <span className="weeks">跟 {s.companions}</span>}
                  <button
                    className="edit"
                    aria-label={`編輯 ${placeFull(s)}`}
                    title="編輯"
                    onClick={() => setEditing({ id: s.id, startDay: s.startDay, endDay: s.endDay })}
                  >
                    <PencilSimple size={18} weight="bold" />
                  </button>
                  {s.note && <span className="note">{s.note}</span>}
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="panel map-panel">
        <h2>地圖</h2>
        <Suspense fallback={<p className="map-status">載入地圖中…</p>}>
          <MapView stays={stays} coords={coords} failed={coordsFailed} />
        </Suspense>
      </section>

      {hoveredStay && stayCard && (
        <div
          className="holiday-card"
          role="tooltip"
          style={{ left: clamp(stayCard.x, 130, window.innerWidth - 130), top: stayCard.y + 8 }}
        >
          <strong className="place">
            {hoveredStay.country && <Flag country={hoveredStay.country} />}
            {placeFull(hoveredStay)}
          </strong>
          <span>{longRangeLabel(hoveredStay)}</span>
          <span>
            {daysOf(hoveredStay)} 天（約 {weeksLabel(daysOf(hoveredStay))}）
          </span>
          {hoveredStay.companions && <span>跟 {hoveredStay.companions}</span>}
          {hoveredStay.note && <span className="note">{hoveredStay.note}</span>}
        </div>
      )}

      {holidayCard && (
        // Fixed, because the timeline's scroll container would clip anything positioned inside it.
        <div
          className="holiday-card"
          role="tooltip"
          style={{ left: clamp(holidayCard.x, 130, window.innerWidth - 130), top: holidayCard.y + 8 }}
        >
          <span className="set" style={{ color: holidayCard.set.color }}>{holidayCard.set.label}</span>
          <strong>{holidayCard.holiday.name}</strong>
          <span>
            {longRangeLabel(holidayCard.holiday)}
            {daysOf(holidayCard.holiday) > 1 && `・${daysOf(holidayCard.holiday)} 天`}
          </span>
          {holidayCard.holiday.note && <span className="note">{holidayCard.holiday.note}</span>}
        </div>
      )}

      {editing && (
        <Editor
          key={editing.id ?? `new-${editing.startDay}-${editing.endDay}`}
          editing={editing}
          stay={editingStay}
          others={stays.filter((s) => s.id !== editing.id)}
          onSave={saveEditing}
          onDelete={deleteEditing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function Editor(props: {
  editing: Editing;
  stay?: Stay;
  others: Stay[];
  onSave: (details: StayDetails, range: DayRange, color: ColorKey) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { editing, stay, others, onSave, onDelete, onClose } = props;
  const [country, setCountry] = useState(stay?.country ?? '');
  const [city, setCity] = useState(stay?.city ?? '');
  const place = { country: country.trim(), city: city.trim() };
  const hasPlace = Boolean(place.country || place.city);
  const countries = [...new Set(others.map((s) => s.country).filter(Boolean))];
  const cities = [
    ...new Set(others.filter((s) => !place.country || s.country === place.country).map((s) => s.city).filter(Boolean)),
  ];

  function changeCity(value: string) {
    setCity(value);
    // A city used before brings its country along, unless one is already typed.
    const known = others.find((s) => s.city === value.trim() && s.country);
    if (known && !country.trim()) setCountry(known.country);
  }
  const [note, setNote] = useState(stay?.note ?? '');
  const [companions, setCompanions] = useState(stay?.companions ?? '');
  const knownCompanions = [...new Set(others.map((s) => s.companions).filter(Boolean))];
  // null = follow the suggested colour for the typed place until the user picks one
  const [picked, setPicked] = useState<ColorKey | null>(stay ? colorKeyOf(stay) : null);
  const color = picked ?? defaultColor(place, others);
  const [start, setStart] = useState(isoOfDay(editing.startDay));
  const [end, setEnd] = useState(isoOfDay(editing.endDay));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const startDay = dayOfIso(start);
  const endDay = dayOfIso(end);
  let range: DayRange | null = null;
  let error = '';
  if (startDay === null || endDay === null) {
    error = `日期需在 ${isoOfDay(0)} 到 ${isoOfDay(TOTAL_DAYS - 1)} 之間。`;
  } else if (startDay > endDay) {
    error = '結束日不能早於開始日。';
  } else {
    range = { startDay, endDay };
    const clash = others.find((o) => overlaps(o, range!));
    if (clash) {
      error = `與「${placeName(clash)}」（${rangeLabel(clash)}）重疊。`;
      range = null;
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (hasPlace && range) {
      onSave({ ...place, companions: companions.trim() || undefined, note: note.trim() || undefined }, range, color);
    }
  }

  return (
    <div className="backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="editor" onSubmit={submit}>
        <h2>{stay ? '編輯行程' : '新增行程'}</h2>
        <div className="dates">
          <label>
            國家
            <input
              autoFocus
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="例：泰國"
              list="known-countries"
              maxLength={40}
            />
          </label>
          <label>
            城市
            <input
              value={city}
              onChange={(e) => changeCity(e.target.value)}
              placeholder="例：清邁"
              list="known-cities"
              maxLength={40}
            />
          </label>
        </div>
        <datalist id="known-countries">
          {countries.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <datalist id="known-cities">
          {cities.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <div className="field">
          顏色
          <div className="swatches" role="radiogroup" aria-label="顏色">
            {PALETTE.map((c) => (
              <button
                key={c.key}
                type="button"
                role="radio"
                aria-checked={c.key === color}
                aria-label={c.name}
                title={c.name}
                className={`swatch${c.key === color ? ' selected' : ''}`}
                style={{ background: c.hex }}
                onClick={() => setPicked(c.key)}
              />
            ))}
          </div>
        </div>
        <div className="dates">
          <label>
            開始日
            <input type="date" value={start} min={isoOfDay(0)} max={isoOfDay(TOTAL_DAYS - 1)} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label>
            結束日
            <input type="date" value={end} min={isoOfDay(0)} max={isoOfDay(TOTAL_DAYS - 1)} onChange={(e) => setEnd(e.target.value)} />
          </label>
        </div>
        {error ? (
          <p className="error">{error}</p>
        ) : (
          range && (
            <p className="range">
              {rangeLabel(range)}・{daysOf(range)} 天（約 {weeksLabel(daysOf(range))}）
            </p>
          )
        )}
        <label>
          跟誰去
          <input
            value={companions}
            onChange={(e) => setCompanions(e.target.value)}
            placeholder="例：自己、家人、Amy"
            list="known-companions"
            maxLength={60}
          />
        </label>
        <datalist id="known-companions">
          {knownCompanions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <label>
          備註
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="例：回台過年、朋友婚禮" rows={3} maxLength={300} />
        </label>
        <div className="buttons">
          {stay && (
            <button type="button" className="danger" onClick={onDelete}>
              刪除
            </button>
          )}
          <span className="spacer" />
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button type="submit" className="primary" disabled={!hasPlace || !range}>
            儲存
          </button>
        </div>
      </form>
    </div>
  );
}
