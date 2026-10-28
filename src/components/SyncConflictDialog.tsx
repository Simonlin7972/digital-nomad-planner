import { useEffect } from 'react';
import { CloudCheck } from '@phosphor-icons/react/dist/csr/CloudCheck';
import { DesktopTower } from '@phosphor-icons/react/dist/csr/DesktopTower';
import type { ConflictChoice, ConflictYear } from '../hooks/useCloudSync';
import { useScrollLock } from '../hooks/useScrollLock';
import { t, useLocale } from '../lib/i18n';
import { agoText } from '../lib/weeks';
import './Dialog.css';
import './SyncConflictDialog.css';

type Props = {
  years: ConflictYear[]; // the years both sides have, differently
  onChoose: (choice: ConflictChoice) => void;
};

// Asked once, on a first sign-in that finds a plan in the cloud and a different one in this browser. Two columns,
// one per copy, listing only the years that differ; "use the cloud's" is the usual answer (the cloud copy came
// from the device that was planned on), so it leads. Esc and the backdrop mean "later".
export function SyncConflictDialog({ years, onChoose }: Props) {
  useLocale();
  useScrollLock();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onChoose('later');
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onChoose]);
  const latest = Math.max(...years.map((y) => Date.parse(y.cloudUpdatedAt)));

  return (
    <div className="backdrop" onPointerDown={(e) => e.target === e.currentTarget && onChoose('later')}>
      <div className="editor sync-conflict" role="dialog" aria-modal="true" aria-labelledby="sync-conflict-title">
        <h2 id="sync-conflict-title">{t('sync.conflict.title')}</h2>
        <div className="dialog-body">
          <p className="sync-intro">{t('sync.conflict.intro')}</p>
          <div className="sync-sides">
            <section className="sync-side">
              <h3>
                <CloudCheck size={16} weight="bold" /> {t('sync.conflict.cloud')}
              </h3>
              <ul>
                {years.map((y) => (
                  <li key={y.year}>
                    <span>{y.year}</span>
                    {t('sync.conflict.stays', { n: y.cloud })}
                  </li>
                ))}
              </ul>
              <p>{t('sync.conflict.updated', { when: agoText(latest) })}</p>
            </section>
            <section className="sync-side">
              <h3>
                <DesktopTower size={16} weight="bold" /> {t('sync.conflict.local')}
              </h3>
              <ul>
                {years.map((y) => (
                  <li key={y.year}>
                    <span>{y.year}</span>
                    {t('sync.conflict.stays', { n: y.local })}
                  </li>
                ))}
              </ul>
              <p>{t('sync.conflict.now')}</p>
            </section>
          </div>
          <p className="sync-note">{t('sync.conflict.useCloudNote')}</p>
        </div>
        <div className="buttons">
          <button type="button" onClick={() => onChoose('later')}>
            {t('sync.conflict.later')}
          </button>
          <button type="button" onClick={() => onChoose('local')}>
            {t('sync.conflict.useLocal')}
          </button>
          <button type="button" className="primary" onClick={() => onChoose('cloud')}>
            {t('sync.conflict.useCloud')}
          </button>
        </div>
      </div>
    </div>
  );
}
