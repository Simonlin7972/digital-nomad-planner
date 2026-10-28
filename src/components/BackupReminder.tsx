import { FloppyDisk } from '@phosphor-icons/react/dist/csr/FloppyDisk';
import { t, useLocale } from '../lib/i18n';
import { NoticeStrip } from './NoticeStrip';

type Props = {
  daysSince: number | null; // since the last export, or null if there never was one
  onExport: () => void;
  onSnooze: () => void;
  onSignIn?: () => void; // signed out: the other way to keep a copy
};

// A strip under the header when the plan has changed and gone a week without an export.
export function BackupReminder({ daysSince, onExport, onSnooze, onSignIn }: Props) {
  useLocale();
  return (
    <NoticeStrip
      icon={<FloppyDisk size={20} weight="bold" />}
      actions={
        <>
          <button className="primary" onClick={onExport}>
            {t('backup.export')}
          </button>
          {onSignIn && <button onClick={onSignIn}>{t('backup.signIn')}</button>}
          <button onClick={onSnooze}>{t('backup.later')}</button>
        </>
      }
    >
      <b>{daysSince === null ? t('backup.never') : t('backup.since', { n: daysSince })}</b>
      {t('backup.why')}
    </NoticeStrip>
  );
}
