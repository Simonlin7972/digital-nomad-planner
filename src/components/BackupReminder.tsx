import { FloppyDisk } from '@phosphor-icons/react/dist/csr/FloppyDisk';
import { t, useLocale } from '../lib/i18n';
import './BackupReminder.css';

type Props = {
  daysSince: number | null; // since the last export, or null if there never was one
  onExport: () => void;
  onSnooze: () => void;
};

// A strip under the header when the plan has changed and gone a week without an export.
export function BackupReminder({ daysSince, onExport, onSnooze }: Props) {
  useLocale();
  return (
    <div className="backup-reminder" role="status">
      <FloppyDisk size={20} weight="bold" />
      <p>
        <b>{daysSince === null ? t('backup.never') : t('backup.since', { n: daysSince })}</b>
        {t('backup.why')}
      </p>
      <button className="primary" onClick={onExport}>
        {t('backup.export')}
      </button>
      <button onClick={onSnooze}>{t('backup.later')}</button>
    </div>
  );
}
