import { IdentificationCard } from '@phosphor-icons/react/dist/csr/IdentificationCard';
import { Warning } from '@phosphor-icons/react/dist/csr/Warning';
import { countryLabel } from '../lib/flags';
import { t } from '../lib/i18n';
import { getProfile } from '../lib/profile';
import { visaFor, visaText, visaUpdated, type Overstay } from '../lib/visa';
import './VisaLine.css';

// What entering `country` takes on the profile's passport, and, when the stay runs past the visa-free days, by how
// much. Nothing at all without a passport, before the data has loaded, or for a place the data doesn't know.
// `source` adds the dataset's date and a reminder to check (the editor shows it; small cards leave it out).
export function VisaLine({ country, over, source }: { country: string; over?: Overstay | null; source?: boolean }) {
  const visa = visaFor(country);
  if (!visa) return null;
  const passport = countryLabel(getProfile().passport);
  return (
    <span className="visa-line">
      <span className="with-icon">
        <IdentificationCard size={14} weight="bold" />
        {t('visa.line', { passport, status: visaText(visa, country) })}
      </span>
      {over && (
        <span className="with-icon visa-over">
          <Warning size={14} weight="bold" />
          {t('visa.over', { length: over.length, n: over.allowed })}
        </span>
      )}
      {source && <small>{t('visa.source', { date: visaUpdated() })}</small>}
    </span>
  );
}
