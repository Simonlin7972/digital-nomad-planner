import { useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { CaretLeft } from '@phosphor-icons/react/dist/csr/CaretLeft';
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight';
import { Flag } from './Flag';
import type { HolidaySet } from '../lib/holidays';
import { daysText, t, tr, useLocale } from '../lib/i18n';
import { colorOf, placeName, pushStays, type Stay } from '../lib/storage';
import { TOTAL_DAYS, YEAR, dateOfDay, daysOf, monthRange, monthTitle, todayIndex, weekdayHeaders, type DayRange } from '../lib/weeks';
import './MonthView.css';

type Drag =
  | { kind: 'select'; anchor: number; lo: number; hi: number }
  | (DayRange & { kind: 'resize'; id: string; edge: 'l' | 'r'; moved: boolean })
  | { kind: 'press'; id: string };

type Props = {
  stays: Stay[];
  month: number;
  onMonth: (month: number) => void;
  holidaySets: HolidaySet[]; // only the ones switched on
  pending: DayRange | null; // range of the stay being created in the editor
  onCreate: (range: DayRange) => void;
  onEdit: (stay: Stay) => void;
  onResize: (id: string, range: DayRange) => void;
  onHover: (card: { id: string; x: number; y: number } | null) => void;
  stacked?: boolean; // one of twelve months shown together: a plain title, no previous / next buttons
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export default function MonthView(props: Props) {
  const { stays, month, onMonth, holidaySets, pending, onCreate, onEdit, onResize, onHover, stacked } = props;
  useLocale();
  const [drag, setDrag] = useState<Drag | null>(null);
  const weekEls = useRef<(HTMLDivElement | null)[]>([]);

  const range = monthRange(month);
  // Day index 0 is a Monday, so day % 7 is the weekday column.
  const gridStart = range.startDay - (range.startDay % 7);
  const weekCount = Math.ceil((range.endDay - gridStart + 1) / 7);
  const today = todayIndex();

  const shown = drag?.kind === 'resize' ? (pushStays(stays, drag.id, drag) ?? stays) : stays;
  const inMonth = shown.filter((s) => s.startDay <= range.endDay && s.endDay >= range.startDay);
  const plannedDays = inMonth.reduce(
    (n, s) => n + Math.min(s.endDay, range.endDay) - Math.max(s.startDay, range.startDay) + 1,
    0,
  );
  const selection: DayRange | null = drag?.kind === 'select' ? { startDay: drag.lo, endDay: drag.hi } : pending;

  const isFree = (day: number) => day >= 0 && day < TOTAL_DAYS && !stays.some((s) => day >= s.startDay && day <= s.endDay);

  function dayAt(e: ReactPointerEvent) {
    const rows = weekEls.current.slice(0, weekCount);
    let row = rows.findIndex((el) => el && e.clientY < el.getBoundingClientRect().bottom);
    if (row === -1) row = weekCount - 1;
    const rect = rows[row]!.getBoundingClientRect();
    const col = clamp(Math.floor(((e.clientX - rect.left) / rect.width) * 7), 0, 6);
    return gridStart + row * 7 + col;
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    const bar = target.closest<HTMLElement>('[data-stay]');
    onHover(null);
    if (bar) {
      const stay = stays.find((s) => s.id === bar.dataset.stay);
      if (!stay) return;
      const edge = target.dataset.edge as 'l' | 'r' | undefined;
      setDrag(
        edge
          ? { kind: 'resize', id: stay.id, edge, startDay: stay.startDay, endDay: stay.endDay, moved: false }
          : { kind: 'press', id: stay.id },
      );
    } else {
      const day = dayAt(e);
      if (!isFree(day)) return;
      setDrag({ kind: 'select', anchor: day, lo: day, hi: day });
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag || drag.kind === 'press') return;
    const day = dayAt(e);
    if (drag.kind === 'select') {
      // Extend from the anchor toward the pointer, stopping at the first taken day.
      const dir = day >= drag.anchor ? 1 : -1;
      let reach = drag.anchor;
      while (reach !== day && isFree(reach + dir)) reach += dir;
      setDrag({ ...drag, lo: Math.min(drag.anchor, reach), hi: Math.max(drag.anchor, reach) });
      return;
    }
    const fixed = drag.edge === 'l' ? drag.endDay : drag.startDay;
    const rangeAt = (at: number): DayRange =>
      drag.edge === 'l' ? { startDay: Math.min(at, fixed), endDay: fixed } : { startDay: fixed, endDay: Math.max(at, fixed) };
    // Growing into a neighbour pushes it; back off toward the fixed end if that runs out of year.
    let next: DayRange | null = null;
    for (let at = day; ; at += Math.sign(fixed - day)) {
      const range = rangeAt(at);
      if (pushStays(stays, drag.id, range)) {
        next = range;
        break;
      }
      if (at === fixed) break;
    }
    if (next && (next.startDay !== drag.startDay || next.endDay !== drag.endDay)) setDrag({ ...drag, ...next, moved: true });
  }

  function onPointerUp() {
    if (!drag) return;
    setDrag(null);
    if (drag.kind === 'select') onCreate({ startDay: drag.lo, endDay: drag.hi });
    else if (drag.kind === 'resize' && drag.moved) onResize(drag.id, { startDay: drag.startDay, endDay: drag.endDay });
    else if (drag.kind === 'press') {
      const stay = stays.find((s) => s.id === drag.id);
      if (stay) onEdit(stay);
    }
  }

  // Position of a day range within one week row, or null if it doesn't touch that week.
  const segment = (r: DayRange, weekStart: number) => {
    const from = Math.max(r.startDay, weekStart);
    const to = Math.min(r.endDay, weekStart + 6);
    if (from > to) return null;
    return {
      style: { left: `${((from - weekStart) / 7) * 100}%`, width: `${((to - from + 1) / 7) * 100}%` } as CSSProperties,
      starts: from === r.startDay,
      ends: to === r.endDay,
    };
  };

  return (
    <div className={`month-view${stacked ? ' stacked' : ''}`} data-month={month}>
      <div className="mhead">
        {!stacked && (
          <button className="icon" onClick={() => onMonth(month - 1)} disabled={month === 0} aria-label={t('month.prev')}>
            <CaretLeft size={16} weight="bold" />
          </button>
        )}
        <h2>{monthTitle(YEAR, month)}</h2>
        {!stacked && (
          <button className="icon" onClick={() => onMonth(month + 1)} disabled={month === 11} aria-label={t('month.next')}>
            <CaretRight size={16} weight="bold" />
          </button>
        )}
        <span className="mstat">
          {tr('month.stat', { planned: <b>{daysText(plannedDays)}</b>, free: <b>{daysText(daysOf(range) - plannedDays)}</b> })}
        </span>
      </div>

      <div className="mweekdays">
        {weekdayHeaders().map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div
        className={`mgrid${drag ? ' dragging' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag(null)}
      >
        {Array.from({ length: weekCount }, (_, w) => {
          const weekStart = gridStart + w * 7;
          const sel = selection && segment(selection, weekStart);
          return (
            <div key={weekStart} className="mweek" ref={(el) => void (weekEls.current[w] = el)}>
              {Array.from({ length: 7 }, (_, i) => {
                const day = weekStart + i;
                const date = dateOfDay(day);
                const outside = day < range.startDay || day > range.endDay;
                return (
                  <div key={day} className={`mday${outside ? ' out' : ''}${day === today ? ' today' : ''}`}>
                    <span className="num">{date.getDate() === 1 || outside ? `${date.getMonth() + 1}/${date.getDate()}` : date.getDate()}</span>
                    {holidaySets.map((set) => {
                      const h = set.holidays.find((d) => day >= d.startDay && day <= d.endDay);
                      return (
                        h && (
                          <span key={set.key} className="hol" style={{ '--c': set.color } as CSSProperties} title={`${h.name}${h.note ? `\n${h.note}` : ''}`}>
                            {h.short}
                          </span>
                        )
                      );
                    })}
                  </div>
                );
              })}
              {shown.map((s) => {
                const seg = segment(s, weekStart);
                if (!seg) return null;
                const active = drag?.kind === 'resize' && drag.id === s.id;
                return (
                  <div
                    key={s.id}
                    data-stay={s.id}
                    className={`mbar${seg.starts ? ' starts' : ''}${seg.ends ? ' ends' : ''}${active ? ' active' : ''}`}
                    style={{ ...seg.style, background: colorOf(s) }}
                    onMouseEnter={(e) => {
                      if (drag) return;
                      const r = e.currentTarget.getBoundingClientRect();
                      onHover({ id: s.id, x: r.left + r.width / 2, y: r.bottom });
                    }}
                    onMouseLeave={() => onHover(null)}
                  >
                    {seg.starts && <span className="handle" data-edge="l" />}
                    <span className="label">
                      {s.country && <Flag country={s.country} />}
                      <strong>{placeName(s)}</strong>
                      {s.note && <small>{s.note.replace(/\s+/g, ' ')}</small>}
                    </span>
                    {seg.ends && <span className="handle" data-edge="r" />}
                  </div>
                );
              })}
              {sel && (
                <div className={`mbar msel${sel.starts ? ' starts' : ''}${sel.ends ? ' ends' : ''}`} style={sel.style}>
                  {sel.starts && drag?.kind === 'select' && <span className="label">{daysText(drag.hi - drag.lo + 1)}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
