import { useRef } from 'react';
import { ArrowClockwise } from '@phosphor-icons/react/dist/csr/ArrowClockwise';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { Image as ImageIcon } from '@phosphor-icons/react/dist/csr/Image';
import { Question } from '@phosphor-icons/react/dist/csr/Question';
import { Trash } from '@phosphor-icons/react/dist/csr/Trash';
import { UploadSimple } from '@phosphor-icons/react/dist/csr/UploadSimple';
import { Translate } from '@phosphor-icons/react/dist/csr/Translate';
import { setLocale, t, useLocale } from '../lib/i18n';
import { MOD } from '../lib/util';
import './Toolbar.css';

type Props = {
  canUndo: boolean;
  canRedo: boolean;
  hasStays: boolean;
  onHelp: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSavePng: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onClear: () => void;
};

// The row of plan-wide actions in the page header.
export function Toolbar({ canUndo, canRedo, hasStays, onHelp, onUndo, onRedo, onSavePng, onExport, onImport, onClear }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const locale = useLocale();
  return (
    <div className="actions">
      <button onClick={onHelp}>
        <Question size={16} weight="bold" />
        {t('toolbar.help')}
      </button>
      <button onClick={onUndo} disabled={!canUndo} title={t('toolbar.shortcut', { action: t('toolbar.undo'), keys: `${MOD}Z` })}>
        <ArrowCounterClockwise size={16} weight="bold" />
        {t('toolbar.undo')}
      </button>
      <button onClick={onRedo} disabled={!canRedo} title={t('toolbar.shortcut', { action: t('toolbar.redo'), keys: `${MOD}⇧Z` })}>
        <ArrowClockwise size={16} weight="bold" />
        {t('toolbar.redo')}
      </button>
      <button onClick={onSavePng} disabled={!hasStays}>
        <ImageIcon size={16} weight="bold" />
        {t('toolbar.savePng')}
      </button>
      <button onClick={onExport} disabled={!hasStays}>
        <DownloadSimple size={16} weight="bold" />
        {t('toolbar.export')}
      </button>
      <button onClick={() => fileRef.current?.click()}>
        <UploadSimple size={16} weight="bold" />
        {t('toolbar.import')}
      </button>
      <button onClick={onClear} disabled={!hasStays}>
        <Trash size={16} weight="bold" />
        {t('toolbar.clear')}
      </button>
      {/* Labelled in the language it switches to, so it can be found by someone who can't read the current one. */}
      <button onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')} title={t('toolbar.languageHint')} lang={locale === 'en' ? 'zh-Hant' : 'en'}>
        <Translate size={16} weight="bold" />
        {t('toolbar.language')}
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
