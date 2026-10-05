import { useRef } from 'react';
import { ArrowClockwise } from '@phosphor-icons/react/dist/csr/ArrowClockwise';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { Image as ImageIcon } from '@phosphor-icons/react/dist/csr/Image';
import { Question } from '@phosphor-icons/react/dist/csr/Question';
import { Trash } from '@phosphor-icons/react/dist/csr/Trash';
import { UploadSimple } from '@phosphor-icons/react/dist/csr/UploadSimple';
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
  return (
    <div className="actions">
      <button onClick={onHelp}>
        <Question size={16} weight="bold" />
        如何使用
      </button>
      <button onClick={onUndo} disabled={!canUndo} title={`復原（${MOD}Z）`}>
        <ArrowCounterClockwise size={16} weight="bold" />
        復原
      </button>
      <button onClick={onRedo} disabled={!canRedo} title={`重做（${MOD}⇧Z）`}>
        <ArrowClockwise size={16} weight="bold" />
        重做
      </button>
      <button onClick={onSavePng} disabled={!hasStays}>
        <ImageIcon size={16} weight="bold" />
        保存 PNG
      </button>
      <button onClick={onExport} disabled={!hasStays}>
        <DownloadSimple size={16} weight="bold" />
        匯出
      </button>
      <button onClick={() => fileRef.current?.click()}>
        <UploadSimple size={16} weight="bold" />
        匯入
      </button>
      <button onClick={onClear} disabled={!hasStays}>
        <Trash size={16} weight="bold" />
        清空
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
