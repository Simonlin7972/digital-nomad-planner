import { useState } from 'react';
import { ArrowSquareOut } from '@phosphor-icons/react/dist/csr/ArrowSquareOut';
import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown';
import { HouseLine } from '@phosphor-icons/react/dist/csr/HouseLine';
import { t } from '../lib/i18n';
import { LONG_STAY_UPDATED, longStaysFor, text } from '../lib/longStay';
import './SeasonStrip.css';
import './LongStayOptions.css';

// Under the visa line in the editor: the destination's long-stay programs (digital nomad visas and the like),
// folded shut behind a button that says how many there are. Nothing when there are none for this place and passport.
export function LongStayOptions({ country }: { country: string }) {
  const [open, setOpen] = useState(false);
  const programs = longStaysFor(country);
  if (programs.length === 0) return null;
  return (
    <div className="field season long-stay">
      <div className="season-head">
        <button type="button" className="season-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <HouseLine size={15} weight="bold" className="season-icon" aria-hidden />
          {t('longStay.title', { n: programs.length })}
          <CaretDown size={14} weight="bold" className="caret" />
        </button>
      </div>
      {/* Folds like the season guide's months (SeasonStrip.css); shut, it is inert and takes no room */}
      <div className={`season-body${open ? ' open' : ''}`} inert={!open}>
        <div>
          <ul className="long-stay-list">
            {programs.map((p) => (
              <li key={p.name}>
                <strong>{p.name}</strong>
                <span>{text(p.length)}</span>
                <span>{text(p.needs)}</span>
                {p.only && <span className="only">{text(p.only)}</span>}
                <a href={p.url} target="_blank" rel="noreferrer">
                  {t('longStay.official')}
                  <ArrowSquareOut size={12} weight="bold" />
                </a>
              </li>
            ))}
          </ul>
          <small className="long-stay-note">{t('longStay.note', { date: LONG_STAY_UPDATED })}</small>
        </div>
      </div>
    </div>
  );
}
