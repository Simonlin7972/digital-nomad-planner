import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { ShareNetwork } from '@phosphor-icons/react/dist/csr/ShareNetwork';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { useScrollLock } from '../hooks/useScrollLock';
import { renderPng, renderPortraitPng, type PngLayout } from '../lib/exportPng';
import { useNarrow } from '../hooks/useNarrow';
import { track } from '../lib/analytics';
import { download, fileName } from '../lib/files';
import type { HolidaySet } from '../lib/holidays';
import { t, useLocale } from '../lib/i18n';
import type { Stay } from '../lib/storage';
import './Dialog.css';
import './ShareDialog.css';

type Props = { stays: Stay[]; holidaySets: HolidaySet[]; onClose: () => void };

// Shows the PNG before it is saved, with a download button and, where the device supports sharing files
// (most phones), the system share sheet. Two shapes: the wide year (the default on a computer) and a 9:16 one for
// stories (the default on a phone).
export function ShareDialog({ stays, holidaySets, onClose }: Props) {
  useLocale();
  useScrollLock();
  const narrow = useNarrow();
  const [layout, setLayout] = useState<PngLayout>(narrow ? 'portrait' : 'landscape');
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let url: string | null = null;
    let live = true;
    setImage(null);
    setFailed(false);
    (layout === 'portrait' ? renderPortraitPng(stays) : renderPng(stays, { holidaySets }))
      .then((blob) => {
        if (!live) return;
        url = URL.createObjectURL(blob);
        setImage({ blob, url });
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
      if (url) URL.revokeObjectURL(url);
    };
    // The dialog shows the plan as it was when it opened; it can't change behind the dialog anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const file = image ? new File([image.blob], fileName('png'), { type: 'image/png' }) : null;
  const canShare = Boolean(file && navigator.canShare?.({ files: [file] }));

  async function share() {
    if (!file) return;
    try {
      await navigator.share({ files: [file], title: t('app.title') });
      track('share_download', { method: 'native_share' });
    } catch {
      // cancelled from the share sheet, or the browser refused: nothing to do
    }
  }

  return (
    <div className="backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="editor share" role="dialog" aria-modal="true" aria-labelledby="share-title">
        <h2 id="share-title">
          {t('share.title')}
          <button className="close" onClick={onClose} aria-label={t('help.close')} autoFocus>
            <X size={16} weight="bold" />
          </button>
        </h2>
        <div className="segmented share-layout" role="tablist" aria-label={t('share.title')} style={{ '--i': layout === 'landscape' ? 0 : 1 } as CSSProperties}>
          <span className="thumb" aria-hidden />
          {(['landscape', 'portrait'] as const).map((l) => (
            <button key={l} role="tab" aria-selected={layout === l} onClick={() => setLayout(l)}>
              {t(l === 'landscape' ? 'share.landscape' : 'share.portrait')}
            </button>
          ))}
        </div>
        <div className={`share-preview ${layout}`}>
          {image ? (
            <img src={image.url} alt={t('share.alt')} />
          ) : (
            <p>{failed ? t('alert.pngFailed') : t('share.rendering')}</p>
          )}
        </div>
        <p className="share-note">{t('share.note')}</p>
        <div className="buttons">
          <span className="spacer" />
          {canShare && (
            <button type="button" onClick={() => void share()}>
              <ShareNetwork size={16} weight="bold" />
              {t('share.share')}
            </button>
          )}
          <button type="button" className="primary" disabled={!image} onClick={() => {
              if (!image) return;
              download(image.blob, 'png');
              track('share_download', { method: 'download' });
            }}>
            <DownloadSimple size={16} weight="bold" />
            {t('share.download')}
          </button>
        </div>
      </div>
    </div>
  );
}
