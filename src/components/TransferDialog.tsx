import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Copy } from '@phosphor-icons/react/dist/csr/Copy';
import { ShareNetwork } from '@phosphor-icons/react/dist/csr/ShareNetwork';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { useScrollLock } from '../hooks/useScrollLock';
import { QrCode, qrLayout } from './QrCode';
import { t, useLocale } from '../lib/i18n';
import { serializeAll, type Stay } from '../lib/storage';
import { encodePlan, transferUrl, withoutNotes, withoutTicketDetails } from '../lib/transfer';
import './Dialog.css';
import './TransferDialog.css';

type Qr = NonNullable<ReturnType<typeof qrLayout>>;

// A link (and a QR code for phones) that carries every year's plan to another device, phone or computer.
export function TransferDialog({ stays, onClose }: { stays: Stay[]; onClose: () => void }) {
  useLocale();
  useScrollLock();
  const [details, setDetails] = useState(true);
  const [url, setUrl] = useState<string | null>(null);
  // The QR code carries the same link, or, when long notes make that too much for one code, the plan without notes.
  const [qr, setQr] = useState<{ code: Qr | null; noNotes: boolean } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    const all = serializeAll(stays);
    const file = details ? all : withoutTicketDetails(all);
    void (async () => {
      const full = transferUrl(await encodePlan(file));
      let code = qrLayout(full);
      let noNotes = false;
      if (!code) {
        code = qrLayout(transferUrl(await encodePlan(withoutNotes(file))));
        noNotes = Boolean(code);
      }
      if (!live) return;
      setUrl(full);
      setQr({ code, noNotes });
    })();
    return () => {
      live = false;
    };
    // The plan can't change behind the dialog; only the details switch re-encodes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [details]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard refused: the link is still in the field to copy by hand
    }
  }

  async function share() {
    if (!url) return;
    try {
      await navigator.share({ url, title: t('app.title') });
    } catch {
      // cancelled from the share sheet
    }
  }

  return (
    <div className="backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="editor transfer" role="dialog" aria-modal="true" aria-labelledby="transfer-title">
        <h2 id="transfer-title">
          {t('toolbar.transfer')}
          <button className="close" onClick={onClose} aria-label={t('help.close')} autoFocus>
            <X size={16} weight="bold" />
          </button>
        </h2>
        <p className="transfer-text">{t('transfer.body')}</p>
        <div className="transfer-qr">
          {!qr ? (
            <p>{t('transfer.preparing')}</p>
          ) : qr.code ? (
            <QrCode layout={qr.code} label={t('transfer.qrAlt')} caption={t('transfer.scanMe')} />
          ) : (
            <p>{t('transfer.tooLong')}</p>
          )}
          {qr?.noNotes && <p className="transfer-qr-note">{t('transfer.qrNoNotes')}</p>}
        </div>
        <button
          type="button"
          className="toggle"
          role="switch"
          aria-checked={details}
          style={{ '--c': 'var(--text)' } as CSSProperties}
          onClick={() => setDetails((v) => !v)}
        >
          <span className="knob" />
          {t('transfer.details')}
        </button>
        <input className="transfer-link" readOnly value={url ?? ''} aria-label={t('toolbar.transfer')} onFocus={(e) => e.target.select()} />
        <p className="transfer-note">{t('transfer.privacy')}</p>
        <div className="buttons">
          <span className="spacer" />
          {typeof navigator.share === 'function' && (
            <button type="button" disabled={!url} onClick={() => void share()}>
              <ShareNetwork size={16} weight="bold" />
              {t('share.share')}
            </button>
          )}
          <button type="button" className="primary" disabled={!url} onClick={() => void copy()}>
            <Copy size={16} weight="bold" />
            {copied ? t('transfer.copied') : t('transfer.copy')}
          </button>
        </div>
      </div>
    </div>
  );
}
