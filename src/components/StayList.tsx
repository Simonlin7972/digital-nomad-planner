import { useState } from 'react';
import { PencilSimple } from '@phosphor-icons/react/dist/csr/PencilSimple';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/csr/Ticket';
import { colorOf, overlaps, placeFull, type Stay } from '../lib/storage';
import { TOTAL_DAYS, daysOf, longRangeLabel, monthRange, weeksLabel, type DayRange } from '../lib/weeks';
import { Flag } from './Flag';
import type { Anchor } from './HoverCards';
import './StayList.css';

type Props = {
  stays: Stay[];
  month: number | null; // set in month view: the list follows that month instead of the quarter filter
  onEdit: (stay: Stay) => void;
  ticketCardId: string | null; // stay whose ticket card is showing, so a tap can toggle it
  onTicket: (card: ({ id: string } & Anchor) | null) => void;
};

// The itinerary: one line per stay, in date order.
export function StayList({ stays, month, onEdit, ticketCardId, onTicket }: Props) {
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

  function showTicket(id: string, el: HTMLElement) {
    const r = el.getBoundingClientRect();
    onTicket({ id, x: r.left + r.width / 2, y: r.bottom });
  }

  return (
    <div className="panel grow">
      <div className="panel-head">
        <h2>行程{month !== null && `・${month + 1} 月`}</h2>
        {month === null && (
          <div className="pills" role="group" aria-label="依季度篩選">
            {['全部', 'Q1', 'Q2', 'Q3', 'Q4'].map((label, q) => (
              <button key={label} aria-pressed={quarter === q} onClick={() => setQuarter(q)}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      {listed.length === 0 ? (
        <p className="empty">
          {monthFilter
            ? '這個月還沒有行程。在上面的月曆拖幾天試試。'
            : quarterFilter
              ? `Q${quarter} 還沒有行程。`
              : '還沒有行程。到上面的時間軸拖幾格試試。'}
        </p>
      ) : (
        <ol className="stays">
          {listed.map((s) => (
            <li key={s.id}>
              <i style={{ background: colorOf(s) }} />
              <span className="when">{longRangeLabel(s)}</span>
              <Flag country={s.country} />
              {s.country && <strong>{s.country}</strong>}
              {s.city && <span className={s.country ? 'city' : 'city lead'}>{s.city}</span>}
              <span className="weeks">
                {weeksLabel(daysOf(s))}（{daysOf(s)} 天）
              </span>
              {s.companions && <span className="weeks">跟 {s.companions}</span>}
              {s.ticket && (
                <button
                  className="ticket"
                  aria-label={`${placeFull(s)} 的機票資訊`}
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
              <button className="edit" aria-label={`編輯 ${placeFull(s)}`} title="編輯" onClick={() => onEdit(s)}>
                <PencilSimple size={18} weight="bold" />
              </button>
              {s.note && (
                <span className="note" title={s.note}>
                  {s.note.replace(/\s+/g, ' ')}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
