import { Airplane } from '@phosphor-icons/react/dist/csr/Airplane';
import { useEffect, useState } from 'react';
import type { ChangeEvent, CSSProperties, FormEvent } from 'react';
import { useScrollLock } from '../hooks/useScrollLock';
import { cityFitsCountry, normalizeCity } from '../lib/cities';
import { normalizeCountry } from '../lib/flags';
import { daysText, t, useLocale } from '../lib/i18n';
import { PALETTE, clashes, cleanTicket, colorKeyOf, defaultColor, getEdges, placeName, sharesDay, type ColorKey, type Stay, type Ticket } from '../lib/storage';
import { dayLabel, dayOfIso, dayOfIsoAny, daysOf, isoOfDay, rangeLabel, weeksLabel, type DayRange } from '../lib/weeks';
import { CityCombobox, CountryCombobox, AirlineCombobox, FlightNoCombobox } from './Combobox';
import { DatePicker } from './DatePicker';
import { SeasonStrip } from './SeasonStrip';
import { VisaLine } from './VisaLine';
import { visaOverstays } from '../lib/visa';
import './Dialog.css';
import './Editor.css';

// The stay being edited: an existing one by id, or a new one (id null) over the given dates.
export type Editing = DayRange & { id: string | null };
export type StayDetails = Pick<Stay, 'country' | 'city' | 'companions' | 'ticket' | 'note'>;

// Dialog for creating or editing one stay.
export function Editor(props: {
  editing: Editing;
  stay?: Stay;
  others: Stay[];
  onSave: (details: StayDetails, range: DayRange, color: ColorKey) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { editing, stay, others, onSave, onDelete, onClose } = props;
  useLocale();
  const [country, setCountry] = useState(stay?.country ?? '');
  const [city, setCity] = useState(stay?.city ?? '');
  // What will be stored: a typed name that matches the list becomes that listed place.
  const placeCountry = normalizeCountry(country);
  const place = { country: placeCountry, city: normalizeCity(placeCountry, city) };
  const hasPlace = Boolean(place.country || place.city);
  const countries = [...new Set(others.map((s) => s.country).filter(Boolean))];
  const usedCities = others.map((s) => ({ city: s.city, country: s.country }));
  const [note, setNote] = useState(stay?.note ?? '');
  const [companions, setCompanions] = useState(stay?.companions ?? '');
  const [hasTicket, setHasTicket] = useState(Boolean(stay?.ticket));
  const [ticket, setTicket] = useState<Ticket>(stay?.ticket ?? {});
  const ticketField = (key: keyof Ticket) => ({
    value: ticket[key] ?? '',
    onChange: (e: ChangeEvent<HTMLInputElement>) => setTicket((t) => ({ ...t, [key]: e.target.value })),
    maxLength: 80,
  });
  const knownCompanions = [...new Set(others.map((s) => s.companions).filter(Boolean))];
  // Airlines and flight numbers from the other stays' tickets, offered first in their pickers.
  const usedAirlines = [...new Set(others.map((s) => s.ticket?.airline ?? '').filter(Boolean))];
  const usedFlights = others.map((s) => s.ticket?.flightNo ?? '').filter(Boolean);
  // null = follow the suggested colour for the typed place until the user picks one
  const [picked, setPicked] = useState<ColorKey | null>(stay ? colorKeyOf(stay) : null);
  const color = picked ?? defaultColor(place, others);
  const [startDay, setStartDay] = useState(editing.startDay);
  const [endDay, setEndDay] = useState(editing.endDay);
  // Picking a start after the end (or an end before the start) drags the other date along with it.
  const pickStart = (day: number) => {
    setStartDay(day);
    if (day > endDay) setEndDay(day);
  };
  const pickEnd = (day: number) => {
    setEndDay(day);
    if (day < startDay) setStartDay(day);
  };

  // A stay starts on this year's timeline and may end in the next year, within what the neighbouring years'
  // plans leave free (see getEdges).
  const edges = getEdges();
  const startDates = { min: isoOfDay(edges.lo), max: isoOfDay(edges.lastStart) };
  const endDates = { min: isoOfDay(edges.lo), max: isoOfDay(edges.hi) };
  const pickDay = (iso: string, pick: (day: number) => void) => {
    const day = dayOfIsoAny(iso);
    if (day !== null) pick(day);
  };
  // The flight's departure is stored as one "YYYY-MM-DDTHH:MM" string and edited as a date plus a time.
  const [depDate = '', depTime = ''] = (ticket.departure ?? '').split('T');
  const setDeparture = (date: string, time: string) =>
    setTicket((t) => ({ ...t, departure: date ? (time ? `${date}T${time}` : date) : '' }));
  // The departure and the stay's first day are separate fields; point it out when they disagree.
  const depDay = depDate ? dayOfIso(depDate) : null;
  const depMismatch = hasTicket && depDay !== null && depDay !== startDay;
  // The return leg, the same way, held against the stay's last day (which may lie in the next year).
  const [retDate = '', retTime = ''] = (ticket.returnDeparture ?? '').split('T');
  const setReturn = (date: string, time: string) =>
    setTicket((t) => ({ ...t, returnDeparture: date ? (time ? `${date}T${time}` : date) : '' }));
  const retDay = retDate ? dayOfIsoAny(retDate) : null;
  const retMismatch = hasTicket && retDay !== null && retDay !== endDay;
  // The return leg's airline starts as the outbound one and is only stored when it differs.
  const retAirline = ticket.returnAirline ?? ticket.airline ?? '';
  const setRetAirline = (v: string) => setTicket((tk) => ({ ...tk, returnAirline: v === (tk.airline ?? '') ? undefined : v }));

  useScrollLock();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const dates: DayRange = { startDay, endDay };
  // The visa rule for the place, and whether this stay, with any it runs straight on from or into in the same
  // country, outlasts the visa-free days. `others` holds the neighbouring years' stays too; visaOverstays adds them.
  const visaOver = place.country
    ? visaOverstays([...others.filter((o) => !('year' in o)), { id: '__editing', ...place, ...dates }]).get('__editing')
    : undefined;
  const clash = others.find((o) => clashes(o, dates));
  const range = clash ? null : dates;
  // Neighbours this stay shares a travel day with: the one it arrives from on its first day, the one it leaves for
  // on its last.
  const from = range && others.find((o) => sharesDay(o, range));
  const to = range && others.find((o) => sharesDay(range, o));
  const error = clash ? t('editor.clash', { place: placeName(clash), range: rangeLabel(clash) }) : '';

  function submit(e: FormEvent) {
    e.preventDefault();
    if (hasPlace && range) {
      onSave(
        {
          ...place,
          companions: companions.trim() || undefined,
          ticket: hasTicket ? cleanTicket(ticket) : undefined,
          note: note.trim() || undefined,
        },
        range,
        color,
      );
    }
  }

  return (
    <div className="backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="editor" onSubmit={submit}>
        <h2>{stay ? t('editor.edit') : t('editor.new')}</h2>
        <div className="dialog-body">
          <div className="dates place">
            <label>
              {t('editor.country')}
              <CountryCombobox
                value={country}
                onChange={setCountry}
                // A city from another country can't stay: clear it so it isn't saved under the wrong one.
                onSettle={(c) => !cityFitsCountry(c, city) && setCity('')}
                recent={countries}
                autoFocus
              />
            </label>
            <label>
              {t('editor.city')}
              <CityCombobox value={city} country={country} onChange={setCity} onPickCountry={setCountry} recent={usedCities} />
            </label>
          </div>
          <div className="field">
            {t('editor.color')}
            <div className="swatches" role="radiogroup" aria-label={t('editor.color')}>
              {PALETTE.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  role="radio"
                  aria-checked={c.key === color}
                  aria-label={t(`color.${c.key}`)}
                  title={t(`color.${c.key}`)}
                  className={`swatch${c.key === color ? ' selected' : ''}`}
                  style={{ background: c.hex }}
                  onClick={() => setPicked(c.key)}
                />
              ))}
            </div>
          </div>
          <div className="dates">
            <div className="field">
              {t('editor.start')}
              <DatePicker {...startDates} value={isoOfDay(startDay)} onChange={(iso) => pickDay(iso, pickStart)} rangeWith={isoOfDay(endDay)} label={t('editor.start')} />
            </div>
            <div className="field">
              {t('editor.end')}
              <DatePicker {...endDates} value={isoOfDay(endDay)} onChange={(iso) => pickDay(iso, pickEnd)} rangeWith={isoOfDay(startDay)} align="right" label={t('editor.end')} />
            </div>
          </div>
          {error ? (
            <p className="error">{error}</p>
          ) : (
            range && (
              <p className="range">
                {t('editor.range', {
                  range: rangeLabel(range),
                  length: t('about', { days: daysText(daysOf(range)), weeks: weeksLabel(daysOf(range)) }),
                })}
              </p>
            )
          )}
          {from && (
            <p className="range travel">
              <Airplane size={13} weight="bold" />
              {t('editor.arrive', { date: dayLabel(from.endDay), place: placeName(from) })}
            </p>
          )}
          {to && (
            <p className="range travel">
              <Airplane size={13} weight="bold" />
              {t('editor.leave', { date: dayLabel(to.startDay), place: placeName(to) })}
            </p>
          )}
          <SeasonStrip place={place} range={range} />
          {place.country && <VisaLine country={place.country} over={visaOver} source />}
          <label>
            {t('editor.companions')}
            <input
              value={companions}
              onChange={(e) => setCompanions(e.target.value)}
              placeholder={t('editor.companionsPh')}
              list="known-companions"
              maxLength={60}
            />
          </label>
          <datalist id="known-companions">
            {knownCompanions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <div className="field">
            <button
              type="button"
              role="switch"
              aria-checked={hasTicket}
              className="toggle"
              style={{ '--c': 'var(--text)' } as CSSProperties}
              onClick={() => setHasTicket((on) => !on)}
            >
              <span className="knob" />
              {t('ticket.booked')}
            </button>
            {hasTicket && (
              <div className="ticket-fields">
                {/* Laid out like the country / city row, so the airline list spans both fields */}
                <div className="dates place wide">
                  <label>
                    {t('editor.airline')}
                    <AirlineCombobox value={ticket.airline ?? ''} onChange={(v) => setTicket((tk) => ({ ...tk, airline: v }))} recent={usedAirlines} />
                  </label>
                  <label>
                    {t('editor.flightNo')}
                    <FlightNoCombobox
                      value={ticket.flightNo ?? ''}
                      airline={ticket.airline ?? ''}
                      onChange={(v) => setTicket((tk) => ({ ...tk, flightNo: v }))}
                      recent={usedFlights}
                    />
                  </label>
                </div>
                <div className="field wide">
                  {t('editor.departure')}
                  <div className="date-time">
                    <DatePicker value={depDate} onChange={(date) => setDeparture(date, depTime)} openAt={isoOfDay(startDay)} label={t('editor.depDate')} />
                    <input
                      type="time"
                      aria-label={t('editor.depTime')}
                      value={depTime}
                      disabled={!depDate}
                      onChange={(e) => setDeparture(depDate, e.target.value)}
                    />
                  </div>
                  {depMismatch && (
                    <p className="dep-mismatch">
                      <span>{t('editor.depMismatch', { dep: dayLabel(depDay), start: dayLabel(startDay) })}</span>
                      <button type="button" onClick={() => pickStart(depDay)}>
                        {t('editor.depMatch', { dep: dayLabel(depDay) })}
                      </button>
                    </p>
                  )}
                </div>
                {/* The return leg, laid out exactly like the outbound one above */}
                <p className="wide leg-title">{t('editor.return')}</p>
                <div className="dates place wide">
                  <label>
                    {t('editor.returnAirline')}
                    <AirlineCombobox value={retAirline} onChange={setRetAirline} recent={usedAirlines} />
                  </label>
                  <label>
                    {t('editor.returnFlightNo')}
                    <FlightNoCombobox
                      value={ticket.returnFlightNo ?? ''}
                      airline={retAirline}
                      onChange={(v) => setTicket((tk) => ({ ...tk, returnFlightNo: v }))}
                      recent={usedFlights}
                    />
                  </label>
                </div>
                <div className="field wide">
                  {t('editor.returnDeparture')}
                  <div className="date-time">
                    <DatePicker value={retDate} onChange={(date) => setReturn(date, retTime)} openAt={isoOfDay(endDay)} label={t('editor.retDate')} />
                    <input
                      type="time"
                      aria-label={t('editor.retTime')}
                      value={retTime}
                      disabled={!retDate}
                      onChange={(e) => setReturn(retDate, e.target.value)}
                    />
                  </div>
                  {retMismatch && (
                    <p className="dep-mismatch">
                      <span>{t('editor.retMismatch', { dep: dayLabel(retDay), end: dayLabel(endDay) })}</span>
                      <button type="button" onClick={() => pickEnd(retDay)}>
                        {t('editor.retMatch', { dep: dayLabel(retDay) })}
                      </button>
                    </p>
                  )}
                </div>
                <label>
                  {t('editor.bookingRef')}
                  <input {...ticketField('bookingRef')} placeholder={t('editor.bookingRefPh')} />
                </label>
                <label>
                  {t('editor.fare')}
                  <input {...ticketField('price')} placeholder={t('editor.farePh')} />
                </label>
              </div>
            )}
          </div>
          <label>
            {t('editor.note')}
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('editor.notePh')} rows={3} maxLength={300} />
          </label>
        </div>
        <div className="buttons">
          {stay && (
            <button type="button" className="danger" onClick={onDelete}>
              {t('editor.delete')}
            </button>
          )}
          <span className="spacer" />
          <button type="button" onClick={onClose}>
            {t('editor.cancel')}
          </button>
          <button type="submit" className="primary" disabled={!hasPlace || !range}>
            {t('editor.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
