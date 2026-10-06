import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { ArrowLeft } from '@phosphor-icons/react/dist/csr/ArrowLeft';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { Warning } from '@phosphor-icons/react/dist/csr/Warning';
import { usePinchZoom } from '../hooks/usePinchZoom';
import type { Zoom } from '../hooks/useZoom';
import type { Holiday, HolidaySet } from '../lib/holidays';
import { daysText, t, useLocale } from '../lib/i18n';
import { colorOf, countryOf, insertStay, placeName, pushStays, reorderStays, type Stay } from '../lib/storage';
import { seasonWarning } from '../lib/seasons';
import { clamp } from '../lib/util';
import {
  MONTHS,
  SLOTS,
  TOTAL_DAYS,
  WEEKS,
  currentWeekIndex,
  dayOfBoundary,
  daysOf,
  monthName,
  rangeLabel,
  slotsOf,
  weeksLabel,
  type DayRange,
} from '../lib/weeks';
import { Flag } from './Flag';
import type { Anchor } from './HoverCards';
import './YearView.css';

// The timeline's grid: half-week slots normally, single days once zoomed in far enough to aim at one.
type Unit = 'half' | 'day';
const DAY_UNIT_ZOOM = 3; // 300% and up

type Grid = {
  unit: Unit;
  n: number; // columns across the year
  perWeek: number; // columns per week
  cols: (r: DayRange) => { s: number; e: number }; // a day range as columns [s, e)
  boundary: (k: number) => number; // the first day of column k
};

function gridOf(unit: Unit): Grid {
  return unit === 'day'
    ? { unit, n: TOTAL_DAYS, perWeek: 7, cols: (r) => ({ s: r.startDay, e: r.endDay + 1 }), boundary: (k) => k }
    : { unit, n: SLOTS, perWeek: 2, cols: slotsOf, boundary: dayOfBoundary };
}

// Positions are in columns of the grid the drag started on (see Grid), so a zoom mid-drag can't shift them.
type Drag = { unit: Unit } & (
  | { kind: 'select'; anchor: number; lo: number; hi: number } // columns, inclusive
  // copy: alt-drag. The original stays put and a duplicate is dropped where the pointer goes.
  | (DayRange & { kind: 'move'; id: string; grabSlot: number; orig: DayRange; moved: boolean; copy: boolean })
  | (DayRange & { kind: 'resize'; id: string; edge: 'l' | 'r'; grabSlot: number; moved: boolean })
);

type Props = {
  stays: Stay[];
  zoom: Zoom;
  holidaySets: HolidaySet[]; // only the ones switched on
  pending: DayRange | null; // range of the stay being created in the editor
  onCreate: (range: DayRange) => void;
  onEdit: (stay: Stay) => void;
  onChange: (update: (prev: Stay[]) => Stay[]) => void;
  onOpenMonth: (month: number) => void;
  onHoverStay: (card: ({ id: string } & Anchor) | null) => void;
  onHoverHoliday: (card: ({ holiday: Holiday; set: HolidaySet } & Anchor) | null) => void;
  onDragging: (active: boolean) => void;
  prevYear: number | null; // the years either side, if there are any to pull through to
  nextYear: number | null;
  onYearEdge: (dir: 1 | -1) => void; // pulled far enough past an end: switch to the neighbouring year
  startAtEnd: boolean; // arrived from the following year, so show December first
};

// How far (px) the month row has to be pulled past the end of the timeline before letting go switches year.
const PULL_TRIGGER = 140;

const COPY_ID = '__copy__'; // id of the preview stay while alt-dragging

// The duplicate an alt-drag would create. A flight belongs to one trip, so the ticket is not carried over.
function copyOf(stays: Stay[], drag: DayRange & { id: string }, id: string): Stay | null {
  const source = stays.find((s) => s.id === drag.id);
  return source ? { ...source, ticket: undefined, id, startDay: drag.startDay, endDay: drag.endDay } : null;
}

const slotCol = (s: number, e: number): CSSProperties => ({ gridColumn: `${s + 1} / ${e + 1}` });

// The year at a glance: one horizontal timeline of weeks, each split into two half-week slots, or into seven days
// when zoomed to DAY_UNIT_ZOOM or beyond. Stays keep their exact dates either way; only drawing and dragging snap.
export default function YearView(props: Props) {
  const { stays, zoom, holidaySets, pending, onCreate, onEdit, onChange, onOpenMonth, onHoverStay, onHoverHoliday, onDragging } = props;
  const { prevYear, nextYear, onYearEdge, startAtEnd } = props;
  useLocale();
  const [drag, setDrag] = useState<Drag | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thisWeek = useMemo(() => currentWeekIndex(), []);
  const { scrollRef } = zoom;

  usePinchZoom(zoom, () => setDrag(null));

  // The unit follows the zoom, except during a drag, which keeps the unit it started with.
  const unit: Unit = drag?.unit ?? (zoom.zoom >= DAY_UNIT_ZOOM ? 'day' : 'half');
  const grid = gridOf(unit);
  const stayCol = (r: DayRange) => {
    const { s, e } = grid.cols(r);
    return slotCol(s, e);
  };

  const dragging = Boolean(drag);
  useEffect(() => {
    onDragging(dragging);
    return () => onDragging(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- report changes only; the callback identity is irrelevant
  }, [dragging]);

  // Coming back from the following year, start at December, where the drag left off.
  useEffect(() => {
    const el = scrollRef.current;
    if (startAtEnd && el) el.scrollLeft = el.scrollWidth;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on arrival
  }, []);

  // Dragging the month header pans the (zoomed) timeline; a plain click opens that month. Pulling on past either
  // end stretches the timeline a little and, once far enough, letting go moves to the neighbouring year.
  const pan = useRef<{ x: number; left: number; month: number | null; moved: boolean } | null>(null);
  const [panning, setPanning] = useState(false);
  const [pull, setPull] = useState(0); // px past the end; positive is past December, negative past January
  function onPanStart(e: ReactPointerEvent<HTMLDivElement>) {
    const el = scrollRef.current;
    if (e.button !== 0 || !el) return;
    const label = (e.target as HTMLElement).closest<HTMLElement>('[data-month]');
    pan.current = {
      x: e.clientX,
      left: el.scrollLeft,
      month: label ? Number(label.dataset.month) : null,
      moved: false,
    };
    setPanning(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }
  function onPanMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!pan.current || !scrollRef.current) return;
    const dx = e.clientX - pan.current.x;
    if (Math.abs(dx) > 4) pan.current.moved = true;
    const el = scrollRef.current;
    const want = pan.current.left - dx;
    const max = el.scrollWidth - el.clientWidth;
    el.scrollLeft = want;
    setPull(want > max && nextYear !== null ? want - max : want < 0 && prevYear !== null ? want : 0);
  }
  function onPanEnd() {
    const p = pan.current;
    if (p && !p.moved && p.month !== null) onOpenMonth(p.month);
    if (Math.abs(pull) >= PULL_TRIGGER) onYearEdge(pull > 0 ? 1 : -1);
    pan.current = null;
    setPanning(false);
    setPull(0);
  }
  const pullYear = pull > 0 ? nextYear : pull < 0 ? prevYear : null;
  const pullReady = Math.abs(pull) >= PULL_TRIGGER;

  // Alt held: stays show a copy cursor, hinting that a drag will duplicate.
  const [altDown, setAltDown] = useState(false);
  useEffect(() => {
    const sync = (e: KeyboardEvent) => setAltDown(e.altKey);
    const clear = () => setAltDown(false);
    window.addEventListener('keydown', sync);
    window.addEventListener('keyup', sync);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', sync);
      window.removeEventListener('keyup', sync);
      window.removeEventListener('blur', clear);
    };
  }, []);

  const slotAt = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    return clamp(Math.floor(((clientX - rect.left) / rect.width) * grid.n), 0, grid.n - 1);
  };
  const slotFree = (slot: number) =>
    slot >= 0 &&
    slot < grid.n &&
    !stays.some((st) => {
      const { s, e } = grid.cols(st);
      return slot >= s && slot < e;
    });
  // Trims a day range so it doesn't run into neighbouring stays; null if nothing is left.
  const fit = (range: DayRange): DayRange | null => {
    let { startDay, endDay } = range;
    for (const o of [...stays].sort((a, b) => a.startDay - b.startDay)) {
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
    onHoverStay(null);
    if (stayEl) {
      const stay = stays.find((s) => s.id === stayEl.dataset.stay);
      if (!stay) return;
      // With alt held the whole block copies, wherever it is grabbed.
      const edge = e.altKey ? undefined : (target.dataset.edge as 'l' | 'r' | undefined);
      const range = { startDay: stay.startDay, endDay: stay.endDay };
      const base = { unit, id: stay.id, grabSlot: slot, moved: false, ...range };
      setDrag(edge ? { kind: 'resize', edge, ...base } : { kind: 'move', orig: range, copy: e.altKey, ...base });
    } else {
      if (!slotFree(slot)) return;
      setDrag({ unit, kind: 'select', anchor: slot, lo: slot, hi: slot });
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
        // By day: the stay moves that many days. By half-week: whole-week moves keep the exact dates, half-week
        // moves snap the start to a slot boundary.
        const raw =
          grid.unit === 'day'
            ? drag.orig.startDay + delta
            : delta % 2 === 0
              ? drag.orig.startDay + (delta / 2) * 7
              : dayOfBoundary(clamp(slotsOf(drag.orig).s + delta, 0, SLOTS - 1));
        const startDay = clamp(raw, 0, TOTAL_DAYS - len);
        return { startDay, endDay: startDay + len - 1 };
      };
      // The drag only records where the pointer wants the stay; reorderStays / insertStay decide where it lands.
      const next = rangeAt(slot - drag.grabSlot);
      if (next.startDay === drag.startDay) return;
      setDrag({ ...drag, ...next, moved: true });
    } else {
      if (!drag.moved && slot === drag.grabSlot) return;
      const rangeAt = (at: number): DayRange =>
        drag.edge === 'l'
          ? { startDay: Math.min(grid.boundary(at), drag.endDay), endDay: drag.endDay }
          : { startDay: drag.startDay, endDay: Math.max(grid.boundary(at + 1) - 1, drag.startDay) };
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
      const range = fit({ startDay: grid.boundary(drag.lo), endDay: grid.boundary(drag.hi + 1) - 1 });
      if (range) onCreate(range);
    } else if (drag.kind === 'move' && drag.copy) {
      // A copy dropped where it started would only pile onto the original, so that does nothing.
      if (drag.moved) onChange((prev) => insertStay(prev, copyOf(prev, drag, crypto.randomUUID())!) ?? prev);
    } else if (drag.moved) {
      onChange((prev) => (drag.kind === 'move' ? reorderStays(prev, drag.id, drag) : (pushStays(prev, drag.id, drag) ?? prev)));
    } else if (drag.kind === 'move') {
      const stay = stays.find((s) => s.id === drag.id);
      if (stay) onEdit(stay);
    }
  }

  // What the timeline draws mid-drag: a moved stay reorders past its neighbours, a resized one pushes them.
  const copying = drag?.kind === 'move' && drag.copy && drag.moved ? drag : null;
  const ghost = copying && copyOf(stays, copying, COPY_ID);
  const copyPreview = ghost && insertStay(stays, ghost);
  // The ghost is still drawn when there is no room for it, flagged so it reads as "can't drop here".
  const copyBlocked = Boolean(ghost && !copyPreview);
  const activeId = ghost ? COPY_ID : drag && drag.kind !== 'select' && drag.moved ? drag.id : null;
  const visible = ghost
    ? (copyPreview ?? [...stays, ghost])
    : drag?.kind === 'move'
      ? drag.copy
        ? stays
        : reorderStays(stays, drag.id, drag)
      : drag?.kind === 'resize'
        ? (pushStays(stays, drag.id, drag) ?? stays)
        : stays;

  // One strip per country under the stays; back-to-back stays in the same country share a strip.
  const countryBars: { id: string; country: string; city: string; color: string; s: number; e: number }[] = [];
  for (const stay of [...visible].sort((a, b) => a.startDay - b.startDay)) {
    if (!stay.country) continue;
    const { s, e } = grid.cols(stay);
    const last = countryBars[countryBars.length - 1];
    if (last && last.country === stay.country && last.e === s) last.e = e;
    else countryBars.push({ id: stay.id, country: stay.country, city: '', color: colorOf(stay), s, e });
  }

  return (
    <div className="year-view">
      {pullYear !== null && (
        <div
          className={`year-pull ${pull > 0 ? 'next' : 'prev'}${pullReady ? ' ready' : ''}`}
          style={{ opacity: Math.min(1, Math.abs(pull) / PULL_TRIGGER) }}
          aria-hidden
        >
          {pull < 0 && <ArrowLeft size={16} weight="bold" />}
          {pullReady ? t('year.release', { year: pullYear }) : pullYear}
          {pull > 0 && <ArrowRight size={16} weight="bold" />}
        </div>
      )}
      <div className="scroll" ref={scrollRef}>
        <div
          className={`timeline${pull ? ' pulling' : ''}${unit === 'day' ? ' days' : ''}`}
          // --slots sets the minimum width and stays in half-weeks, so changing unit never changes the width.
          style={{ '--n': grid.n, '--slots': SLOTS, '--zoom': zoom.zoom, '--pull': `${-pull * 0.3}px` } as CSSProperties}
        >
          <div
            className={`row months${panning ? ' panning' : ''}`}
            onPointerDown={onPanStart}
            onPointerMove={onPanMove}
            onPointerUp={onPanEnd}
            onPointerCancel={onPanEnd}
            title={t('year.panHint')}
          >
            {MONTHS.map((m) => (
              <div
                key={m.month}
                className="month"
                data-month={m.month}
                style={{ gridColumn: `${m.startIndex * grid.perWeek + 1} / span ${m.span * grid.perWeek}` }}
              >
                {monthName(m.month)}
              </div>
            ))}
          </div>
          {holidaySets.map((set) => (
            <div key={set.key} className="lane" style={{ '--c': set.color } as CSSProperties} aria-label={set.label}>
              {set.holidays.map((d) => (
                <div
                  key={`${d.name}-${d.startDay}`}
                  className="holiday"
                  style={{ left: `${(d.startDay / TOTAL_DAYS) * 100}%`, width: `${(daysOf(d) / TOTAL_DAYS) * 100}%` }}
                  onMouseEnter={(e) => {
                    // Anchor to the visible label, which can extend past a one-day bar.
                    const r = (e.currentTarget.firstElementChild ?? e.currentTarget).getBoundingClientRect();
                    onHoverHoliday({ holiday: d, set, x: r.left + r.width / 2, y: r.bottom });
                  }}
                  onMouseLeave={() => onHoverHoliday(null)}
                >
                  <span>{d.short}</span>
                </div>
              ))}
            </div>
          ))}
          <div
            ref={trackRef}
            className={`row track${drag ? ' dragging' : ''}${altDown ? ' alt' : ''}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => setDrag(null)}
          >
            {WEEKS.map((w) => (
              <div
                key={w.index}
                className={`cell${w.index === thisWeek ? ' today' : ''}${MONTHS.some((m) => m.startIndex === w.index) ? ' month-start' : ''}`}
                style={{ gridColumn: `${w.index * grid.perWeek + 1} / span ${grid.perWeek}` }}
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
                  className={`stay${s.id === activeId ? ' active' : ''}${s.id === COPY_ID && copyBlocked ? ' blocked' : ''}`}
                  style={{ ...stayCol(s), background: colorOf(s) }}
                  onMouseEnter={(e) => {
                    // No card mid-drag; it would only get in the way.
                    if (drag) return;
                    const r = e.currentTarget.getBoundingClientRect();
                    // A wide block can run off-screen, so centre on the part that is visible.
                    const x = (Math.max(r.left, 0) + Math.min(r.right, window.innerWidth)) / 2;
                    onHoverStay({ id: s.id, x, y: r.bottom });
                  }}
                  onMouseLeave={() => onHoverStay(null)}
                >
                  <span className="handle" data-edge="l" />
                  <span className="label">
                    <strong>
                      {seasonWarning(s) && <Warning size={12} weight="bold" aria-label={t('season.warnShort')} />}
                      {placeName(s)}
                    </strong>
                    <small>
                      {s.id === activeId ? rangeLabel(s) : `${weeks}${s.note ? `${t('sep')}${s.note.replace(/\s+/g, ' ')}` : ''}`}
                    </small>
                  </span>
                  <span className="handle" data-edge="r" />
                </div>
              );
            })}
            {drag?.kind === 'select' && (
              <div className="selection" style={slotCol(drag.lo, drag.hi + 1)}>
                {drag.unit === 'day' ? daysText(drag.hi - drag.lo + 1) : t('unit.weeks', { n: (drag.hi - drag.lo + 1) / 2 })}
              </div>
            )}
            {pending && <div className="selection" style={stayCol(pending)} />}
          </div>
          {countryBars.length > 0 && (
            <div className="row countries">
              {countryBars.map((bar) => (
                <div
                  key={bar.id}
                  className="country-bar"
                  style={{ ...slotCol(bar.s, bar.e), '--c': bar.color } as CSSProperties}
                  title={countryOf(bar)}
                >
                  <Flag country={bar.country} />
                  <span>{countryOf(bar)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
