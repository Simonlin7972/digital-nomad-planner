import { CloudSlash } from '@phosphor-icons/react/dist/csr/CloudSlash';
import { t, useLocale } from '../lib/i18n';
import { NoticeStrip } from './NoticeStrip';

// A strip under the header while the sync waits on a choice between two different copies (the person chose
// "later" on the conflict dialog). Nothing goes up or down until they pick.
export function SyncPaused({ onChoose }: { onChoose: () => void }) {
  useLocale();
  return (
    <NoticeStrip
      icon={<CloudSlash size={20} weight="bold" />}
      actions={
        <button className="primary" onClick={onChoose}>
          {t('sync.choose')}
        </button>
      }
    >
      <b>{t('sync.paused')}</b>
      {t('sync.pausedWhy')}
    </NoticeStrip>
  );
}
