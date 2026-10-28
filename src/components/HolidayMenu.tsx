import { useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { CalendarStar } from '@phosphor-icons/react/dist/csr/CalendarStar';
import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown';
import { usePresence } from '../hooks/usePresence';
import type { HolidaySet } from '../lib/holidays';
import { t, useLocale } from '../lib/i18n';
import type { HolidayToggles } from '../lib/prefs';
import './YearSelect.css';
import './HolidayMenu.css';

// Which public holidays the timeline and calendar show: one pill that opens a menu of the holiday sets (`sets`: the
// hand-written ones and one per country in the plan), each with
// a switch. Switching one leaves the menu open, so both can be set in one go; Esc or a press outside closes it.
// The pill shows a dot in each switched-on set's colour.
export function HolidayMenu({ sets, on, onToggle }: { sets: HolidaySet[]; on: HolidayToggles; onToggle: (key: string) => void }) {
  useLocale();
  const [open, setOpen] = useState(false);
  const { shown, leaving } = usePresence(open);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  // Years with no holiday data have nothing to switch.

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    rootRef.current?.querySelector<HTMLElement>('[role=menuitemcheckbox]')?.focus();
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  function close() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = [...(rootRef.current?.querySelectorAll<HTMLElement>('[role=menuitemcheckbox]') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  }

  if (sets.length === 0) return null;
  return (
    <div className="holiday-select" ref={rootRef} onKeyDown={open ? onKeyDown : undefined}>
      <button
        ref={buttonRef}
        type="button"
        className="holiday-button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <CalendarStar size={16} weight="bold" />
        {t('holidays.label')}
        {sets.some((set) => on[set.key]) && (
          <span className="holiday-dots" aria-hidden>
            {sets.filter((set) => on[set.key]).map((set) => (
              <span key={set.key} style={{ background: set.color }} />
            ))}
          </span>
        )}
        <CaretDown size={14} weight="bold" className="caret" />
      </button>
      {shown && (
        <div className={`year-menu holiday-menu${leaving ? ' leaving' : ''}`} role="menu" id={listId} aria-label={t('holidays.label')}>
          {sets.map((set) => (
            <button
              key={set.key}
              type="button"
              role="menuitemcheckbox"
              aria-checked={Boolean(on[set.key])}
              className="switch-row"
              style={{ '--c': set.color } as CSSProperties}
              onClick={() => onToggle(set.key)}
            >
              {set.label}
              <span className="knob" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
