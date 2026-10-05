import { useEffect, useState } from 'react';
import type { ChangeEvent, CSSProperties, FormEvent } from 'react';
import { useScrollLock } from '../hooks/useScrollLock';
import { normalizeCity } from '../lib/cities';
import { normalizeCountry } from '../lib/flags';
import { daysText, t, useLocale } from '../lib/i18n';
import { PALETTE, cleanTicket, colorKeyOf, defaultColor, overlaps, placeName, type ColorKey, type Stay, type Ticket } from '../lib/storage';
import { TOTAL_DAYS, dayOfIso, daysOf, isoOfDay, rangeLabel, weeksLabel, type DayRange } from '../lib/weeks';
import { CityCombobox, CountryCombobox } from './Combobox';
import { DatePicker } from './DatePicker';
import { SeasonStrip } from './SeasonStrip';
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

  // The stay's dates are limited to the days the plan covers.
  const planDates = { min: isoOfDay(0), max: isoOfDay(TOTAL_DAYS - 1) };
  const pickDay = (iso: string, pick: (day: number) => void) => {
    const day = dayOfIso(iso);
    if (day !== null) pick(day);
  };
  // The flight's departure is stored as one "YYYY-MM-DDTHH:MM" string and edited as a date plus a time.
  const [depDate = '', depTime = ''] = (ticket.departure ?? '').split('T');
  const setDeparture = (date: string, time: string) =>
    setTicket((t) => ({ ...t, departure: date ? (time ? `${date}T${time}` : date) : '' }));

  useScrollLock();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const dates: DayRange = { startDay, endDay };
  const clash = others.find((o) => overlaps(o, dates));
  const range = clash ? null : dates;
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
        <div className="dates place">
          <label>
            {t('editor.country')}
            <CountryCombobox value={country} onChange={setCountry} recent={countries} autoFocus />
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
            <DatePicker {...planDates} value={isoOfDay(startDay)} onChange={(iso) => pickDay(iso, pickStart)} rangeWith={isoOfDay(endDay)} label={t('editor.start')} />
          </div>
          <div className="field">
            {t('editor.end')}
            <DatePicker {...planDates} value={isoOfDay(endDay)} onChange={(iso) => pickDay(iso, pickEnd)} rangeWith={isoOfDay(startDay)} align="right" label={t('editor.end')} />
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
        <SeasonStrip place={place} range={range} />
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
              <label>
                {t('editor.airline')}
                <input {...ticketField('airline')} placeholder={t('editor.airlinePh')} />
              </label>
              <label>
                {t('editor.flightNo')}
                <input {...ticketField('flightNo')} placeholder={t('editor.flightNoPh')} />
              </label>
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
