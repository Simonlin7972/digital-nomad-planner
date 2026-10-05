import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { usePinchZoom } from '../hooks/usePinchZoom';
import type { Zoom } from '../hooks/useZoom';
import type { Holiday, HolidaySet } from '../lib/holidays';
import { t, useLocale } from '../lib/i18n';
import { colorOf, countryOf, insertStay, placeName, pushStays, reorderStays, type Stay } from '../lib/storage';
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

type Drag =
  | { kind: 'select'; anchor: number; lo: number; hi: number } // slots, inclusive
  // copy: alt-drag. The original stays put and a duplicate is dropped where the pointer goes.
  | (DayRange & { kind: 'move'; id: string; grabSlot: number; orig: DayRange; moved: boolean; copy: boolean })
  | (DayRange & { kind: 'resize'; id: string; edge: 'l' | 'r'; grabSlot: number; moved: boolean });

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
};

const COPY_ID = '__copy__'; // id of the preview stay while alt-dragging

// The duplicate an alt-drag would create. A flight belongs to one trip, so the ticket is not carried over.
function copyOf(stays: Stay[], drag: DayRange & { id: string }, id: string): Stay | null {
  const source = stays.find((s) => s.id === drag.id);
  return source ? { ...source, ticket: undefined, id, startDay: drag.startDay, endDay: drag.endDay } : null;
}

const slotCol = (s: number, e: number): CSSProperties => ({ gridColumn: `${s + 1} / ${e + 1}` });
const stayCol = (r: DayRange) => {
  const { s, e } = slotsOf(r);
  return slotCol(s, e);
};

// The year at a glance: one horizontal timeline of 53 weeks, each split into two half-week slots.
export default function YearView(props: Props) {
  const { stays, zoom, holidaySets, pending, onCreate, onEdit, onChange, onOpenMonth, onHoverStay, onHoverHoliday, onDragging } = props;
  useLocale();
  const [drag, setDrag] = useState<Drag | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thisWeek = useMemo(() => currentWeekIndex(), []);
  const { scrollRef } = zoom;

  usePinchZoom(zoom, () => setDrag(null));

  const dragging = Boolean(drag);
  useEffect(() => {
    onDragging(dragging);
    return () => onDragging(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- report changes only; the callback identity is irrelevant
  }, [dragging]);

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
    if (p && !p.moved && p.month !== null) onOpenMonth(p.month);
    pan.current = null;
    setPanning(false);
  }

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
      const base = { id: stay.id, grabSlot: slot, moved: false, ...range };
      setDrag(edge ? { kind: 'resize', edge, ...base } : { kind: 'move', orig: range, copy: e.altKey, ...base });
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
      // The drag only records where the pointer wants the stay; reorderStays / insertStay decide where it lands.
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
    const { s, e } = slotsOf(stay);
    const last = countryBars[countryBars.length - 1];
    if (last && last.country === stay.country && last.e === s) last.e = e;
    else countryBars.push({ id: stay.id, country: stay.country, city: '', color: colorOf(stay), s, e });
  }

  return (
    <div className="scroll" ref={scrollRef}>
      <div className="timeline" style={{ '--n': SLOTS, '--zoom': zoom.zoom } as CSSProperties}>
        <div
          className={`row months${panning ? ' panning' : ''}`}
          onPointerDown={onPanStart}
          onPointerMove={onPanMove}
          onPointerUp={onPanEnd}
          onPointerCancel={onPanEnd}
          title={t('year.panHint')}
        >
          {MONTHS.map((m) => (
            <div key={m.month} className="month" data-month={m.month} style={{ gridColumn: `${m.startIndex * 2 + 1} / span ${m.span * 2}` }}>
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
                  <strong>{placeName(s)}</strong>
                  <small>{s.id === activeId ? rangeLabel(s) : `${weeks}${s.note ? `${t('sep')}${s.note.replace(/\s+/g, ' ')}` : ''}`}</small>
                </span>
                <span className="handle" data-edge="r" />
              </div>
            );
          })}
          {drag?.kind === 'select' && (
            <div className="selection" style={slotCol(drag.lo, drag.hi + 1)}>
              {t('unit.weeks', { n: (drag.hi - drag.lo + 1) / 2 })}
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
  );
}
