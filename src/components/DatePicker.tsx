import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { CalendarBlank } from '@phosphor-icons/react/dist/csr/CalendarBlank';
import { CaretLeft } from '@phosphor-icons/react/dist/csr/CaretLeft';
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight';
import './DatePicker.css';

type Props = {
  value: string; // ISO date (YYYY-MM-DD), or '' for none
  onChange: (value: string) => void;
  min?: string; // ISO bounds, inclusive
  max?: string;
  rangeWith?: string; // the other end of a range, to tint the days in between
  openAt?: string; // month to show first when there is no value yet
  align?: 'left' | 'right'; // which edge of the field the calendar lines up with
  placeholder?: string;
  label: string; // accessible name of the field
};

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
function fromIso(iso: string | undefined): Date | null {
  const m = iso ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso) : null;
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
}
const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

// A date field with our own calendar instead of the browser's. Weeks start on Monday, like the rest of the app.
export function DatePicker({ value, onChange, min, max, rangeWith, openAt, align = 'left', placeholder = '選擇日期', label }: Props) {
  const selected = fromIso(value);
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(() => monthStart(selected ?? fromIso(openAt) ?? fromIso(min) ?? new Date()));
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const popId = useId();

  // Close on a press anywhere outside the field and its calendar.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  // Opening the calendar puts focus on the selected day (or the first one that can be picked).
  useEffect(() => {
    if (!open) return;
    const grid = gridRef.current;
    (grid?.querySelector<HTMLElement>('[aria-pressed="true"]') ?? grid?.querySelector<HTMLElement>('button:not(:disabled)'))?.focus();
    // The calendar can open past the bottom of a scrolling dialog; bring all of it into view.
    grid?.closest('.datepicker-pop')?.scrollIntoView({ block: 'nearest' });
  }, [open]);

  function toggle() {
    if (!open) setShown(monthStart(selected ?? fromIso(openAt) ?? fromIso(min) ?? new Date()));
    setOpen(!open);
  }

  const minIso = min ?? '';
  const maxIso = max ?? '9999-12-31';
  const allowed = (iso: string) => iso >= minIso && iso <= maxIso;
  const lo = value && rangeWith ? (value < rangeWith ? value : rangeWith) : '';
  const hi = value && rangeWith ? (value < rangeWith ? rangeWith : value) : '';
  const todayIso = toIso(new Date());

  // Six rows from the Monday on or before the 1st, so the calendar never changes height between months.
  const first = monthStart(shown);
  const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - ((first.getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, i) => new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  const prevMonth = new Date(first.getFullYear(), first.getMonth() - 1, 1);
  const nextMonth = new Date(first.getFullYear(), first.getMonth() + 1, 1);
  const canPrev = toIso(new Date(first.getFullYear(), first.getMonth(), 0)) >= minIso;
  const canNext = toIso(nextMonth) <= maxIso;

  function onGridKey(e: KeyboardEvent<HTMLDivElement>) {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    const from = fromIso((e.target as HTMLElement).dataset.day);
    if (!step || !from) return;
    e.preventDefault();
    const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + step);
    const iso = toIso(to);
    if (!allowed(iso)) return;
    if (to.getMonth() !== shown.getMonth() || to.getFullYear() !== shown.getFullYear()) setShown(monthStart(to));
    // The target day may only exist after the month re-renders.
    requestAnimationFrame(() => gridRef.current?.querySelector<HTMLElement>(`[data-day="${iso}"]`)?.focus());
  }

  return (
    <div
      className="datepicker"
      ref={rootRef}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation(); // close the calendar, not the whole dialog
          setOpen(false);
          rootRef.current?.querySelector<HTMLElement>('.datepicker-field')?.focus();
        }
      }}
    >
      <button
        type="button"
        className="datepicker-field"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popId}
        aria-label={label}
        onClick={toggle}
      >
        <span className={selected ? undefined : 'empty'}>
          {selected ? `${selected.getFullYear()}/${selected.getMonth() + 1}/${selected.getDate()}（${WEEKDAYS[(selected.getDay() + 6) % 7]}）` : placeholder}
        </span>
        <CalendarBlank size={16} weight="bold" />
      </button>
      {open && (
        <div className={`datepicker-pop ${align}`} id={popId} role="dialog" aria-label={label}>
          <div className="datepicker-head">
            <button type="button" onClick={() => setShown(prevMonth)} disabled={!canPrev} aria-label="上個月">
              <CaretLeft size={14} weight="bold" />
            </button>
            <strong>
              {shown.getFullYear()} 年 {shown.getMonth() + 1} 月
            </strong>
            <button type="button" onClick={() => setShown(nextMonth)} disabled={!canNext} aria-label="下個月">
              <CaretRight size={14} weight="bold" />
            </button>
          </div>
          <div className="datepicker-weekdays">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="datepicker-grid" ref={gridRef} onKeyDown={onGridKey}>
            {days.map((d) => {
              const iso = toIso(d);
              const classes = [
                d.getMonth() !== shown.getMonth() && 'out',
                iso === todayIso && 'today',
                lo && iso > lo && iso < hi && 'between',
                lo && lo !== hi && iso === lo && 'range-start',
                lo && lo !== hi && iso === hi && 'range-end',
              ].filter(Boolean);
              return (
                <button
                  key={iso}
                  type="button"
                  data-day={iso}
                  className={classes.join(' ') || undefined}
                  aria-pressed={iso === value}
                  disabled={!allowed(iso)}
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                    rootRef.current?.querySelector<HTMLElement>('.datepicker-field')?.focus();
                  }}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
