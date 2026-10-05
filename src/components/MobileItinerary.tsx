import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/csr/Ticket';
import { Warning } from '@phosphor-icons/react/dist/csr/Warning';
import { useMemo } from 'react';
import { daysText, t, useLocale } from '../lib/i18n';
import { cityOf, colorOf, countryOf, ticketLines, type Stay } from '../lib/storage';
import { noteText, seasonWarning } from '../lib/seasons';
import { checkSchengen, gapsOf } from '../lib/stayRules';
import { DAY0, dateOfDay, daysOf, longRangeLabel, todayIndex, weeksLabel } from '../lib/weeks';
import { Flag } from './Flag';
import './MobileItinerary.css';

// The phone layout: nothing to drag, just where you are, where you go next, and every stay written out in
// full (flight details included, since that is what you look up on the road).
export function MobileItinerary({ stays }: { stays: Stay[] }) {
  useLocale();
  const sorted = [...stays].sort((a, b) => a.startDay - b.startDay);
  const schengen = useMemo(() => checkSchengen(stays), [stays]);
  const today = todayIndex();
  // Outside the timeline there is no day index for today. Before it starts, the first stay is next.
  const before = today === null && Date.now() < DAY0.getTime();
  const current = today === null ? undefined : sorted.find((s) => s.startDay <= today && today <= s.endDay);
  const next = sorted.find((s) => (today === null ? before : s.startDay > today));

  const rows = [
    ...sorted.map((stay) => ({ startDay: stay.startDay, stay })),
    ...(stays.length ? gapsOf(stays) : []).map((gap) => ({ startDay: gap.startDay, gap })),
  ].sort((a, b) => a.startDay - b.startDay);

  return (
    <section className="mobile">
      {(current || next) && (
        <div className="panel now">
          {current && (
            <div>
              <span className="tag">{t('mobile.now')}</span>
              <Place stay={current} />
              <p>{t('mobile.daysLeft', { days: daysText(current.endDay - today! + 1) })}</p>
            </div>
          )}
          {next && (
            <div>
              <span className="tag">{t('mobile.next')}</span>
              <Place stay={next} />
              <p>
                {longRangeLabel(next)}
                {t('sep') + t('mobile.inDays', { days: daysText(daysUntil(next.startDay)) })}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="panel">
        <h2>{t('stays.title')}</h2>
        {rows.length === 0 ? (
          <p className="empty">{t('mobile.empty')}</p>
        ) : (
          <ol className="mstays">
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
                <li key={s.id} className={today !== null && s.endDay < today ? 'past' : undefined} style={{ borderLeftColor: colorOf(s) }}>
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
                  {s.ticket && (
                    <div className="mticket">
                      <TicketIcon size={16} weight="bold" />
                      <div>
                        {ticketLines(s.ticket).map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                      </div>
                    </div>
                  )}
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

// Whole days from today to a day on the timeline; works before the timeline starts too.
function daysUntil(day: number): number {
  const now = new Date();
  const d = dateOfDay(day);
  return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86_400_000);
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
