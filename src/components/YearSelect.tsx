import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown';
import { Check } from '@phosphor-icons/react/dist/csr/Check';
import { usePresence } from '../hooks/usePresence';
import { t, useLocale } from '../lib/i18n';
import { YEAR, YEARS, setYear } from '../lib/weeks';
import './YearSelect.css';

// Which year is being planned: a pill that opens a small list, styled like the toolbar's ⋯ menu. Picking another
// year swaps the plan in place. Closes on a pick, Esc, or a press outside; arrow keys move, Enter or Space picks.
// The planner's year, shown as a pill that opens a menu of the years there are plans for. On its own it shows the
// live year and a pick switches the whole page (setYear); given `value` and `onChange` it is controlled instead
// and touches nothing (the demo page).
export function YearSelect({ value, onChange }: { value?: number; onChange?: (year: number) => void } = {}) {
  useLocale();
  const year = value ?? YEAR;
  const [open, setOpen] = useState(false);
  // Closed, the menu fades out before it goes (styles/base.css .leaving)
  const { shown, leaving } = usePresence(open);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    // Opening puts focus on the current year, so the keyboard starts from there.
    rootRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  function close() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  function pick(next: number) {
    close();
    if (onChange) onChange(next);
    else setYear(next);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = [...(rootRef.current?.querySelectorAll<HTMLElement>('[role=menuitemradio]') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  }

  return (
    <div className="year-select" ref={rootRef} onKeyDown={open ? onKeyDown : undefined}>
      <button
        ref={buttonRef}
        type="button"
        className="year-button"
        aria-label={t('year.label')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        {year}
        <CaretDown size={14} weight="bold" />
      </button>
      {/* Phone only (CSS): the dimmed page behind the sheet; tapping it closes the menu without reaching the page. */}
      {shown && <div className={`menu-scrim${leaving ? ' leaving' : ''}`} aria-hidden="true" onClick={close} />}
      {shown && (
        <div className={`year-menu${leaving ? ' leaving' : ''}`} role="menu" id={listId} aria-label={t('year.label')}>
          {YEARS.map((y) => (
            <button key={y} type="button" role="menuitemradio" aria-checked={y === year} onClick={() => pick(y)}>
              {y}
              {y === year && <Check size={14} weight="bold" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
