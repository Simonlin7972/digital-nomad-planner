import { Fragment } from 'react';
import { monthName } from '../lib/weeks';
import { t, useLocale } from '../lib/i18n';
import { daysPerMonth, noteText, seasonOf } from '../lib/seasons';
import type { Stay } from '../lib/storage';
import type { DayRange } from '../lib/weeks';
import './SeasonStrip.css';

const RATING_CLASS = ['avoid', 'fine', 'best'] as const;

// Twelve months for the chosen place, coloured best / fine / avoid, with the stay's months outlined, then the
// reasons. Nothing at all for places without season data.
export function SeasonStrip({ place, range }: { place: Pick<Stay, 'country' | 'city'>; range: DayRange | null }) {
  useLocale();
  const season = seasonOf(place);
  if (!season) return null;
  const covered = range ? daysPerMonth(range).map((n) => n > 0) : new Array<boolean>(12).fill(false);
  // Reasons that touch the stay's months come first.
  const notes = [...season.notes].sort(
    (a, b) => Number(b.months.some((m) => covered[m])) - Number(a.months.some((m) => covered[m])),
  );
  return (
    <div className="field season">
      {t('season.title')}
      <ol className="season-months" aria-label={t('season.title')}>
        {season.ratings.map((r, m) => (
          <li
            key={m}
            className={`${RATING_CLASS[r]}${covered[m] ? ' in' : ''}`}
            title={`${monthName(m)}・${t(`season.${RATING_CLASS[r]}`)}`}
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
