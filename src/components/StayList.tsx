import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { Airplane } from '@phosphor-icons/react/dist/csr/Airplane';
import { PencilSimple } from '@phosphor-icons/react/dist/csr/PencilSimple';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/csr/Ticket';
import { Warning } from '@phosphor-icons/react/dist/csr/Warning';
import { daysText, t, useLocale } from '../lib/i18n';
import { transitionName, withTransition } from '../lib/motion';
import { cityOf, colorOf, countryOf, overlaps, placeFull, travelDays, type Stay } from '../lib/storage';
import { noteText, seasonWarning } from '../lib/seasons';
import { visaOverstays } from '../lib/visa';
import { checkSchengen, gapsOf } from '../lib/stayRules';
import { TOTAL_DAYS, dayLabel, daysOf, longRangeLabel, monthName, monthRange, weeksLabel, type DayRange } from '../lib/weeks';
import { Flag } from './Flag';
import { FlashRing, type Flash } from './Flash';
import type { Anchor } from './HoverCards';
import './StayList.css';

type Props = {
  stays: Stay[];
  month: number | null; // set in month view: the list follows that month instead of the quarter filter
  onEdit: (stay: Stay) => void;
  onLocate: (stay: Stay) => void; // the row itself was clicked: show the stay on the timeline
  onCreate: (range: DayRange) => void; // plan a stay in a gap
  ticketCardId: string | null; // stay whose ticket card is showing, so a tap can toggle it
  onTicket: (card: ({ id: string } & Anchor) | null) => void;
  flash?: Flash | null; // stays that just changed, highlighted for a moment
};

// The itinerary: one line per stay, in date order, with the unplanned stretches between them.
export function StayList({ stays, month, onEdit, onLocate, onCreate, ticketCardId, onTicket, flash }: Props) {
  useLocale();
  const [quarter, setQuarter] = useState(0); // 0 = whole year

  const monthFilter = month === null ? null : monthRange(month);
  const quarterFilter: DayRange | null =
    quarter === 0
      ? null
      : {
          // Q1 and Q4 also take the few days of the neighbouring years that the timeline shows.
          startDay: quarter === 1 ? 0 : monthRange(quarter * 3 - 3).startDay,
          endDay: quarter === 4 ? TOTAL_DAYS - 1 : monthRange(quarter * 3 - 1).endDay,
        };
  const range = monthFilter ?? quarterFilter;
  const sorted = [...stays].sort((a, b) => a.startDay - b.startDay);
  const listed = range ? sorted.filter((s) => overlaps(s, range)) : sorted;
  const schengen = useMemo(() => checkSchengen(stays), [stays]);
  const visaOver = visaOverstays(stays);
  // Stays that begin on a travel day shared with the one before
  const arriving = travelDays(stays).arriving;
  // Gaps only make sense around stays; an empty plan gets the empty message instead.
  const gaps = stays.length === 0 ? [] : gapsOf(stays).filter((g) => !range || overlaps(g, range));
  const rows = [
    ...listed.map((stay) => ({ startDay: stay.startDay, stay })),
    ...gaps.map((gap) => ({ startDay: gap.startDay, gap })),
  ].sort((a, b) => a.startDay - b.startDay);

  function showTicket(id: string, el: HTMLElement) {
    const r = el.getBoundingClientRect();
    onTicket({ id, x: r.left + r.width / 2, y: r.bottom });
  }

  return (
    <div className="panel grow">
      <div className="panel-head">
        <h2>{month === null ? t('stays.title') : t('stays.titleMonth', { month: monthName(month) })}</h2>
        {month === null && (
          <div className="pills" role="group" aria-label={t('stays.filter')}>
            {[t('stays.all'), 'Q1', 'Q2', 'Q3', 'Q4'].map((label, q) => (
              <button key={label} aria-pressed={quarter === q} onClick={() => withTransition(() => setQuarter(q))}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      {listed.length === 0 ? (
        <p className="empty">
          {monthFilter
            ? t('stays.emptyMonth')
            : quarterFilter
              ? t('stays.emptyQuarter', { q: quarter })
              : t('stays.empty')}
        </p>
      ) : (
        <ol className="stays">
          {rows.map((row, i) => {
            if ('gap' in row) {
              const g = row.gap;
              return (
                <li key={`gap-${g.startDay}`} className="gap" style={{ '--i': i } as CSSProperties}>
                  <i />
                  <span className="when">{longRangeLabel(g)}</span>
                  <span>{t('stays.gap')}</span>
                  <span className="weeks">
                    {weeksLabel(daysOf(g))}
                    {t('paren', { x: daysText(daysOf(g)) })}
                  </span>
                  <button
                    className="edit"
                    aria-label={t('stays.gapAddLabel', {
                      range: longRangeLabel(g),
                    })}
                    title={t('stays.gapAdd')}
                    onClick={() => onCreate(g)}
                  >
                    <Plus size={18} weight="bold" />
                  </button>
                </li>
              );
            }
            const s = row.stay;
            const over = schengen.overBy.get(s.id);
            const visa = visaOver.get(s.id);
            const season = seasonWarning(s);
            const seasonText = season?.notes.map(noteText).join(t('list'));
            return (
              <li
                key={s.id}
                className="stay-row"
                style={{ '--i': i, viewTransitionName: transitionName('row', s.id) } as CSSProperties}
                title={t('stays.locate')}
                // The row's buttons do their own thing; a click anywhere else goes to the stay on the timeline
                onClick={(e) => !(e.target as Element).closest('button') && onLocate(s)}
              >
                <FlashRing flash={flash} id={s.id} />
                <i style={{ background: colorOf(s) }} />
                <span className="when">{longRangeLabel(s)}</span>
                <Flag country={s.country} />
                {s.country && <strong>{countryOf(s)}</strong>}
                {s.city && <span className={s.country ? 'city' : 'city lead'}>{cityOf(s)}</span>}
                <span className="weeks">
                  {weeksLabel(daysOf(s))}
                  {t('paren', { x: daysText(daysOf(s)) })}
                </span>
                {arriving.has(s.id) && (
                  <span className="travel-tag">
                    <Airplane size={12} weight="bold" />
                    {t('stays.travelDay', { date: dayLabel(s.startDay) })}
                  </span>
                )}
                {s.companions && <span className="weeks">{t('with', { who: s.companions })}</span>}
                {season && (
                  <span className="warn" role="img" aria-label={t('season.warn', { why: seasonText ?? '' })} title={t('season.warn', { why: seasonText ?? '' })}>
                    <Warning size={18} weight="bold" />
                  </span>
                )}
                {over !== undefined && (
                  <span
                    className="warn"
                    role="img"
                    aria-label={t('stays.schengenOver', { n: over })}
                    title={t('stays.schengenOver', { n: over })}
                  >
                    <Warning size={18} weight="bold" />
                  </span>
                )}
                {visa && (
                  <span
                    className="warn"
                    role="img"
                    aria-label={t('visa.over', { length: visa.length, n: visa.allowed })}
                    title={t('visa.over', { length: visa.length, n: visa.allowed })}
                  >
                    <Warning size={18} weight="bold" />
                  </span>
                )}
                {s.ticket && (
                  <button
                    className="ticket"
                    aria-label={t('stays.ticket', { place: placeFull(s) })}
                    onMouseEnter={(e) => showTicket(s.id, e.currentTarget)}
                    onMouseLeave={() => onTicket(null)}
                    onFocus={(e) => showTicket(s.id, e.currentTarget)}
                    onBlur={() => onTicket(null)}
                    // Touch has no hover, so a tap toggles the card.
                    onClick={(e) => (ticketCardId === s.id ? onTicket(null) : showTicket(s.id, e.currentTarget))}
                  >
                    <TicketIcon size={18} weight="bold" />
                  </button>
                )}
                <button
                  className="edit"
                  aria-label={t('stays.editPlace', { place: placeFull(s) })}
                  title={t('stays.edit')}
                  onClick={() => onEdit(s)}
                >
                  <PencilSimple size={18} weight="bold" />
                </button>
                {s.note && (
                  <span className="note" title={s.note}>
                    {s.note.replace(/\s+/g, ' ')}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
