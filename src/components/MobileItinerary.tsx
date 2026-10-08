import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/csr/Ticket';
import { Warning } from '@phosphor-icons/react/dist/csr/Warning';
import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { daysText, t, useLocale } from '../lib/i18n';
import { cityOf, colorOf, countryOf, loadYearPlan, ticketLines, type Stay } from '../lib/storage';
import { noteText, seasonWarning } from '../lib/seasons';
import { checkSchengen, gapsOf } from '../lib/stayRules';
import { TOTAL_DAYS, YEAR, YEARS, dateOfDay, daysOf, inYear, longRangeLabel, setYear, todayIndex, weeksLabel } from '../lib/weeks';
import { Flag } from './Flag';
import { YearSelect } from './YearSelect';
import './MobileItinerary.css';

const DAY_MS = 86_400_000;

// A stay from any year's plan, with its dates as local midnights so stays from different years compare.
type Entry = { year: number; stay: Stay; start: number; end: number };

// The phone layout: nothing to drag, just where you are, where you go next, and every stay written out in
// full (flight details included, since that is what you look up on the road).
export function MobileItinerary({ stays }: { stays: Stay[] }) {
  useLocale();
  const sorted = [...stays].sort((a, b) => a.startDay - b.startDay);
  const schengen = useMemo(() => checkSchengen(stays), [stays]);
  const today = todayIndex();
  const [showPast, setShowPast] = useState(false);

  // "Now" and "next" look through every year's plan, so they stay right whichever year is on screen. A stay can
  // appear in two plans (the borrowed days at a year's edges), so the next stay must start after the current one.
  const entries = useMemo(
    () =>
      YEARS.flatMap((year) =>
        (year === YEAR ? stays : loadYearPlan(year)).map((stay) =>
          inYear(year, () => ({ year, stay, start: dateOfDay(stay.startDay).getTime(), end: dateOfDay(stay.endDay).getTime() })),
        ),
      ).sort((a, b) => a.start - b.start),
    [stays],
  );
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const covering = entries.filter((e) => e.start <= midnight && midnight <= e.end);
  const current = covering.find((e) => e.year === now.getFullYear()) ?? covering[0];
  const next = entries.find((e) => e.start > (current ? current.end : midnight));

  // Past stays fold into one line when the year on screen is the one being lived. Gaps before the first stay and
  // after the last are left out: they are just the rest of the year.
  const past = today === null ? [] : sorted.filter((s) => s.endDay < today);
  const shown = showPast ? sorted : sorted.filter((s) => !past.includes(s));
  const from = shown[0]?.startDay ?? TOTAL_DAYS;
  const gaps = gapsOf(stays).filter((g) => g.startDay > 0 && g.endDay < TOTAL_DAYS - 1 && g.startDay > from);
  const rows = [
    ...shown.map((stay) => ({ startDay: stay.startDay, stay })),
    ...gaps.map((gap) => ({ startDay: gap.startDay, gap })),
  ].sort((a, b) => a.startDay - b.startDay);

  // Tapping a place in the "now / next" card goes to its card below, or to its year if that isn't on screen.
  function open(e: MouseEvent, entry: Entry) {
    e.preventDefault();
    if (entry.year !== YEAR) return setYear(entry.year);
    document.getElementById(`mstay-${entry.stay.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section className="mobile">
      {(current || next) && (
        <div className="panel now">
          {current && (
            <div>
              <span className="tag">{t('mobile.now')}</span>
              <a href={`#mstay-${current.stay.id}`} onClick={(e) => open(e, current)}>
                <Place stay={current.stay} />
              </a>
              <p>{inYear(current.year, () => longRangeLabel(current.stay))}</p>
              <Progress entry={current} midnight={midnight} />
            </div>
          )}
          {next && (
            <div>
              <span className="tag">{t('mobile.next')}</span>
              <a href={`#mstay-${next.stay.id}`} onClick={(e) => open(e, next)}>
                <Place stay={next.stay} />
              </a>
              <p>
                {inYear(next.year, () => longRangeLabel(next.stay))}
                {t('sep') + t('mobile.inDays', { days: daysText(Math.round((next.start - midnight) / DAY_MS)) })}
              </p>
              {next.stay.ticket && <Ticket stay={next.stay} />}
            </div>
          )}
        </div>
      )}

      <div className="panel">
        <div className="mobile-head">
          <h2>{t('stays.title')}</h2>
          <YearSelect />
        </div>
        {sorted.length === 0 ? (
          <p className="empty">{t('mobile.empty')}</p>
        ) : (
          <ol className="mstays">
            {past.length > 0 && (
              <li className="mpast">
                <button type="button" aria-expanded={showPast} onClick={() => setShowPast((v) => !v)}>
                  {t('mobile.past', { n: past.length })}
                  <span>{showPast ? t('mobile.pastHide') : t('mobile.pastShow')}</span>
                </button>
              </li>
            )}
            {rows.map((row) => {
              if ('gap' in row) {
                const g = row.gap;
                return (
                  <li key={`gap-${g.startDay}`} className="mgap">
                    {t('stays.gap')}
                    {t('sep')}
                    {longRangeLabel(g)}
                    {t('sep')}
                    {daysText(daysOf(g))}
                  </li>
                );
              }
              const s = row.stay;
              const over = schengen.overBy.get(s.id);
              return (
                <li
                  key={s.id}
                  id={`mstay-${s.id}`}
                  className={today !== null && s.endDay < today ? 'past' : undefined}
                  style={{ borderLeftColor: colorOf(s) }}
                >
                  <Place stay={s} />
                  <p className="when">
                    {longRangeLabel(s)}
                    {t('sep')}
                    {weeksLabel(daysOf(s))}
                    {t('paren', { x: daysText(daysOf(s)) })}
                  </p>
                  {s.companions && <p>{t('with', { who: s.companions })}</p>}
                  {seasonWarning(s)?.notes.map((n, i) => (
                    <p key={i} className="warn">
                      <Warning size={14} weight="bold" />
                      {noteText(n)}
                    </p>
                  ))}
                  {over !== undefined && (
                    <p className="warn">
                      <Warning size={14} weight="bold" />
                      {t('stays.schengenOver', { n: over })}
                    </p>
                  )}
                  {s.ticket && <Ticket stay={s} />}
                  {s.note && <p className="note">{s.note}</p>}
                </li>
              );
            })}
          </ol>
        )}
        <p className="readonly">{t('mobile.readOnly')}</p>
      </div>
    </section>
  );
}

// How far into the current stay today is: "day 38 of 50 · 13 days to go", over a bar.
function Progress({ entry, midnight }: { entry: Entry; midnight: number }) {
  const total = Math.round((entry.end - entry.start) / DAY_MS) + 1;
  const n = Math.round((midnight - entry.start) / DAY_MS) + 1;
  return (
    <>
      <div className="progress" role="presentation">
        <i style={{ width: `${(n / total) * 100}%`, background: colorOf(entry.stay) }} />
      </div>
      <p>
        {t('mobile.dayOf', { n, total })}
        {t('sep') + t('mobile.daysLeft', { days: daysText(total - n + 1) })}
      </p>
    </>
  );
}

function Ticket({ stay }: { stay: Stay }) {
  return (
    <div className="mticket">
      <TicketIcon size={16} weight="bold" />
      <div>
        {ticketLines(stay.ticket!).map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function Place({ stay }: { stay: Stay }) {
  return (
    <strong className="mplace">
      {stay.country && <Flag country={stay.country} />}
      {stay.city ? cityOf(stay) : countryOf(stay)}
      {stay.city && stay.country && <small>{countryOf(stay)}</small>}
    </strong>
  );
}
