import type { ReactNode } from 'react';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/csr/Ticket';
import { Warning } from '@phosphor-icons/react/dist/csr/Warning';
import { noteText, seasonWarning } from '../lib/seasons';
import type { Holiday, HolidaySet } from '../lib/holidays';
import { daysText, t } from '../lib/i18n';
import { placeFull, ticketLines, type Stay } from '../lib/storage';
import { clamp } from '../lib/util';
import { daysOf, longRangeLabel, weeksLabel } from '../lib/weeks';
import { Flag } from './Flag';
import './HoverCards.css';

// Where a card hangs from: the horizontal centre and bottom edge of whatever is hovered, in viewport pixels.
export type Anchor = { x: number; y: number };

// Cards are fixed to the viewport, because the timeline's scroll container would clip anything positioned
// inside it. They are kept clear of the window's side edges.
function Card({ x, y, children }: Anchor & { children: ReactNode }) {
  return (
    <div className="hover-card" role="tooltip" style={{ left: clamp(x, 130, window.innerWidth - 130), top: y + 8 }}>
      {children}
    </div>
  );
}

export function StayCard({ stay, ...anchor }: Anchor & { stay: Stay }) {
  return (
    <Card {...anchor}>
      <strong className="place">
        {stay.country && <Flag country={stay.country} />}
        {placeFull(stay)}
      </strong>
      <span>{longRangeLabel(stay)}</span>
      <span>
        {t('about', { days: daysText(daysOf(stay)), weeks: weeksLabel(daysOf(stay)) })}
      </span>
      {stay.companions && <span>{t('with', { who: stay.companions })}</span>}
      {stay.ticket && (
        <span className="with-icon">
          <TicketIcon size={14} weight="bold" />
          {t('ticket.booked')}
        </span>
      )}
      {stay.note && <span className="note">{stay.note}</span>}
      <SeasonWarning stay={stay} />
    </Card>
  );
}

export function TicketCard({ stay, ...anchor }: Anchor & { stay: Stay }) {
  if (!stay.ticket) return null;
  return (
    <Card {...anchor}>
      <span className="set">{t('ticket.title', { place: placeFull(stay) })}</span>
      {ticketLines(stay.ticket).map((line, i) => (i === 0 ? <strong key={line}>{line}</strong> : <span key={line}>{line}</span>))}
    </Card>
  );
}

export function HolidayCard({ holiday, set, ...anchor }: Anchor & { holiday: Holiday; set: HolidaySet }) {
  return (
    <Card {...anchor}>
      <span className="set" style={{ color: set.color }}>
        {set.label}
      </span>
      <strong>{holiday.name}</strong>
      <span>
        {longRangeLabel(holiday)}
        {daysOf(holiday) > 1 && `${t('sep')}${daysText(daysOf(holiday))}`}
      </span>
      {holiday.note && <span className="note">{holiday.note}</span>}
    </Card>
  );
}

// One line per reason the stay falls in a month worth avoiding, if it does.
export function SeasonWarning({ stay }: { stay: Stay }) {
  const warning = seasonWarning(stay);
  if (!warning) return null;
  return (
    <>
      {warning.notes.map((n, i) => (
        <span key={i} className="with-icon season-warn">
          <Warning size={14} weight="bold" />
          {noteText(n)}
        </span>
      ))}
    </>
  );
}
