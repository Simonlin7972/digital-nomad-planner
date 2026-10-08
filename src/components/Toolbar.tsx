import { Fragment, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { ArrowClockwise } from '@phosphor-icons/react/dist/csr/ArrowClockwise';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { DeviceMobile } from '@phosphor-icons/react/dist/csr/DeviceMobile';
import { DotsThree } from '@phosphor-icons/react/dist/csr/DotsThree';
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { Info } from '@phosphor-icons/react/dist/csr/Info';
import { Question } from '@phosphor-icons/react/dist/csr/Question';
import { ShareNetwork } from '@phosphor-icons/react/dist/csr/ShareNetwork';
import { UploadSimple } from '@phosphor-icons/react/dist/csr/UploadSimple';
import { Translate } from '@phosphor-icons/react/dist/csr/Translate';
import { langTag, nextLocale, setLocale, t, useLocale } from '../lib/i18n';
import { MOD } from '../lib/util';
import { HOME_URL } from '../lib/links';
import './Toolbar.css';

type Props = {
  readOnly: boolean; // phone layout: no undo or redo
  canUndo: boolean;
  canRedo: boolean;
  hasStays: boolean; // this year has stays: share
  canExport: boolean; // any year has stays: export
  onHelp: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onShare: () => void;
  onExport: () => void;
  onTransfer: () => void; // send every year's plan to another device by link
  onImport: (file: File) => void;
};

// The row of plan-wide actions in the page header. Undo and redo are icons only; the file actions (export,
// import, share as PNG) sit in a ⋯ menu, with the guide and the product page below a divider.
export function Toolbar({ readOnly, canUndo, canRedo, hasStays, canExport, onHelp, onUndo, onRedo, onShare, onExport, onTransfer, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const locale = useLocale();
  const undoLabel = t('toolbar.shortcut', { action: t('toolbar.undo'), keys: `${MOD}Z` });
  const redoLabel = t('toolbar.shortcut', { action: t('toolbar.redo'), keys: `${MOD}⇧Z` });
  return (
    <div className="actions">
      {!readOnly && (
        <>
          <button className="icon" onClick={onUndo} disabled={!canUndo} aria-label={undoLabel} title={undoLabel}>
            <ArrowCounterClockwise size={16} weight="bold" />
          </button>
          <button className="icon" onClick={onRedo} disabled={!canRedo} aria-label={redoLabel} title={redoLabel}>
            <ArrowClockwise size={16} weight="bold" />
          </button>
        </>
      )}
      <MoreMenu
        items={[
          { label: t('toolbar.export'), icon: <DownloadSimple size={16} weight="bold" />, onSelect: onExport, disabled: !canExport },
          { label: t('toolbar.import'), icon: <UploadSimple size={16} weight="bold" />, onSelect: () => fileRef.current?.click() },
          { label: t('toolbar.transfer'), icon: <DeviceMobile size={16} weight="bold" />, onSelect: onTransfer, disabled: !canExport },
          { label: t('toolbar.share'), icon: <ShareNetwork size={16} weight="bold" />, onSelect: onShare, disabled: !hasStays },
          { label: t('toolbar.help'), icon: <Question size={16} weight="bold" />, onSelect: onHelp, divider: true },
          {
            label: t('toolbar.about'),
            icon: <Info size={16} weight="bold" />,
            // The landing page, in a new tab so the plan stays open here.
            onSelect: () => window.open(HOME_URL, '_blank', 'noopener'),
          },
        ]}
      />
      {/* Shows the current language; each press moves to the next one (中文 → English → 日本語). */}
      {/* On a phone only the icon shows; the label stays readable to screen readers. */}
      <button className="lang" onClick={() => setLocale(nextLocale(locale))} title={t('toolbar.languageHint')} lang={langTag(locale)}>
        <Translate size={16} weight="bold" />
        <span className="lang-label">{t('toolbar.language')}</span>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImport(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// divider: draw a separating line above this item
type MenuItem = { label: string; icon: ReactNode; onSelect: () => void; disabled?: boolean; divider?: boolean };

// A ⋯ button with a small drop-down. Closes on a pick, Esc, or a press outside; arrow keys move between items.
function MoreMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    // Opening moves focus into the menu, so the keyboard can pick straight away.
    rootRef.current?.querySelector<HTMLElement>('[role=menuitem]:not(:disabled)')?.focus();
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
    const enabled = [...(rootRef.current?.querySelectorAll<HTMLElement>('[role=menuitem]:not(:disabled)') ?? [])];
    const i = enabled.indexOf(document.activeElement as HTMLElement);
    enabled[(i + (e.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length]?.focus();
  }

  return (
    <div className="more" ref={rootRef} onKeyDown={open ? onKeyDown : undefined}>
      <button
        ref={buttonRef}
        className="icon"
        aria-label={t('toolbar.more')}
        title={t('toolbar.more')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <DotsThree size={18} weight="bold" />
      </button>
      {/* Phone only (CSS): the dimmed page behind the sheet; tapping it closes the menu without reaching the page. */}
      {open && <div className="menu-scrim" aria-hidden="true" onClick={close} />}
      {open && (
        <div className="more-menu" role="menu" id={menuId}>
          {items.map((item) => (
            <Fragment key={item.label}>
              {item.divider && <hr className="more-sep" role="separator" />}
              <button
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  close();
                  item.onSelect();
                }}
              >
                {item.icon}
                {item.label}
              </button>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
