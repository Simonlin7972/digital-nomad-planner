import { Fragment, useState } from 'react';
import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown';
import { Warning } from '@phosphor-icons/react/dist/csr/Warning';
import { monthName } from '../lib/weeks';
import { t, useLocale } from '../lib/i18n';
import { cityLabel } from '../lib/cities';
import { daysPerMonth, noteText, seasonBasis, seasonOf, seasonWarning, tempRange } from '../lib/seasons';
import type { Stay } from '../lib/storage';
import type { DayRange } from '../lib/weeks';
import './SeasonStrip.css';

const RATING_CLASS = ['avoid', 'fine', 'best'] as const;

// A small "when to go" button that opens twelve months for the chosen place, coloured best / fine / avoid, with
// the stay's months outlined, then the reasons. Closed by default; when the stay lands in months to avoid, the
// button says so, so a warning is never hidden. Nothing at all for places without season data.
export function SeasonStrip({ place, range }: { place: Pick<Stay, 'country' | 'city'>; range: DayRange | null }) {
  useLocale();
  const [open, setOpen] = useState(false);
  const season = seasonOf(place);
  if (!season) return null;
  const warning = range ? seasonWarning({ ...place, ...range }) : null;
  const basis = seasonBasis(place);
  const covered = range ? daysPerMonth(range).map((n) => n > 0) : new Array<boolean>(12).fill(false);
  // Reasons that touch the stay's months come first.
  const notes = [...season.notes].sort(
    (a, b) => Number(b.months.some((m) => covered[m])) - Number(a.months.some((m) => covered[m])),
  );
  return (
    <div className="field season">
      <button type="button" className="season-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {t('season.title')}
        {basis && <span className="season-basis">{t('season.basis', { city: cityLabel(place.country, basis) })}</span>}
        {warning && (
          <span className="season-flag">
            <Warning size={14} weight="bold" />
            {t('season.warnShort')}
          </span>
        )}
        <CaretDown size={14} weight="bold" className="caret" />
      </button>
      {open && (
        <>
          <ol className="season-months" aria-label={t('season.title')}>
            {season.ratings.map((r, m) => (
              <li
                key={m}
                className={`${RATING_CLASS[r]}${covered[m] ? ' in' : ''}`}
                title={[monthName(m), t(`season.${RATING_CLASS[r]}`), t('season.temp', tempRange(season, [m]))].join(t('sep'))}
              >
                {m + 1}
              </li>
            ))}
          </ol>
          <ul className="season-notes">
            {notes.map((n, i) => (
              <li key={i} className={`${n.kind}${n.months.some((m) => covered[m]) ? ' here' : ''}`}>
                <b>{monthSpan(n.months)}</b>
                {noteText(n)}
                <span className="temp">{t('season.temp', tempRange(season, n.months))}</span>
              </li>
            ))}
          </ul>
          <p className="season-legend">
            {(['best', 'fine', 'avoid'] as const).map((k) => (
              <Fragment key={k}>
                <i className={k} />
                {t(`season.${k}`)}
              </Fragment>
            ))}
            <span>{t('season.disclaimer')}</span>
          </p>
        </>
      )}
    </div>
  );
}

// [10, 11, 0, 1] → "11–2 月" / "Nov–Feb"; runs are joined with commas.
function monthSpan(months: number[]): string {
  const runs: number[][] = [];
  for (const m of months) {
    const last = runs[runs.length - 1];
    if (last && (last[last.length - 1] + 1) % 12 === m) last.push(m);
    else runs.push([m]);
  }
  return runs
    .map((run) => (run.length === 1 ? monthName(run[0]) : `${monthName(run[0])}–${monthName(run[run.length - 1])}`))
    .join(t('list'));
}
