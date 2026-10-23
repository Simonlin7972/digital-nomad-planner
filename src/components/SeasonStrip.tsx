import { Fragment, useState } from 'react';
import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown';
import { CloudSun } from '@phosphor-icons/react/dist/csr/CloudSun';
import { Warning } from '@phosphor-icons/react/dist/csr/Warning';
import { monthName } from '../lib/weeks';
import { t, useLocale } from '../lib/i18n';
import { cityLabel } from '../lib/cities';
import { daysPerMonth, noteText, seasonBasis, seasonOf, seasonWarning, tempRange } from '../lib/seasons';
import type { SeasonNote } from '../lib/seasons';
import type { Stay } from '../lib/storage';
import type { DayRange } from '../lib/weeks';
import './SeasonStrip.css';

const RATING_CLASS = ['avoid', 'fine', 'best'] as const;

// A small "when to go" button that opens twelve months for the chosen place, coloured best / fine / avoid, with
// the stay's months filled dark, then the reasons as aligned rows (months, reason, temperatures), one row per run
// of months. Closed by default; when the stay lands in months to avoid, the button says so, so a warning is never
// hidden. Nothing at all for places without season data.
export function SeasonStrip({ place, range }: { place: Pick<Stay, 'country' | 'city'>; range: DayRange | null }) {
  useLocale();
  const [open, setOpen] = useState(false);
  const season = seasonOf(place);
  if (!season) return null;
  const warning = range ? seasonWarning({ ...place, ...range }) : null;
  const basis = seasonBasis(place);
  const covered = range ? daysPerMonth(range).map((n) => n > 0) : new Array<boolean>(12).fill(false);
  // One row per run of months ("4–6" and "9–11" apart, each with its own temperatures), in calendar order of
  // the run's first month; a run over the new year (11–1) sorts by where it starts.
  const rows = season.notes
    .flatMap((note) => runsOf(note.months).map((run) => ({ note, run, here: run.some((m) => covered[m]) })))
    .sort((a, b) => a.run[0] - b.run[0]);
  return (
    <div className="field season">
      <div className="season-head">
        <button type="button" className="season-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <CloudSun size={15} weight="bold" className="season-icon" aria-hidden />
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
        {/* The legend sits beside the button and only shows while the months are open */}
        <p className={`season-legend${open ? ' open' : ''}`} aria-hidden={!open}>
          {(['best', 'fine', 'avoid'] as const).map((k) => (
            <Fragment key={k}>
              <i className={k} />
              {t(`season.${k}`)}
            </Fragment>
          ))}
        </p>
      </div>
      {/* Always in the DOM so it can fold open and shut (SeasonStrip.css); shut, it is inert and takes no room */}
      <div className={`season-body${open ? ' open' : ''}`} inert={!open}>
        <div>
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
            {rows.map(({ note, run, here }, i) => (
              <li key={i} className={`${note.kind}${here ? ' here' : ''}`}>
                <b>{monthSpan(run)}</b>
                <span className="why">{noteText(note)}</span>
                <span className="temp">{t('season.temp', tempRange(season, run))}</span>
              </li>
            ))}
          </ul>
          <p className="season-foot">{t('season.disclaimer')}</p>
        </div>
      </div>
    </div>
  );
}

// [10, 11, 0, 1] → [[10, 11, 0, 1]]; [3, 4, 5, 8, 9, 10] → [[3, 4, 5], [8, 9, 10]]: consecutive months, wrapping at
// the year's end, as the data lists them.
function runsOf(months: SeasonNote['months']): number[][] {
  const runs: number[][] = [];
  for (const m of months) {
    const last = runs[runs.length - 1];
    if (last && (last[last.length - 1] + 1) % 12 === m) last.push(m);
    else runs.push([m]);
  }
  return runs;
}

// [10, 11, 0, 1] → "11–2 月" / "Nov–Feb"
function monthSpan(run: number[]): string {
  return run.length === 1 ? monthName(run[0]) : `${monthName(run[0])}–${monthName(run[run.length - 1])}`;
}
