import { useEffect, useState } from 'react';
import type { ChangeEvent, CSSProperties, FormEvent } from 'react';
import { useScrollLock } from '../hooks/useScrollLock';
import { PALETTE, cleanTicket, colorKeyOf, defaultColor, overlaps, placeName, type ColorKey, type Stay, type Ticket } from '../lib/storage';
import { TOTAL_DAYS, dayOfIso, daysOf, isoOfDay, rangeLabel, weeksLabel, type DayRange } from '../lib/weeks';
import { CityCombobox, CountryCombobox } from './Combobox';
import { DatePicker } from './DatePicker';
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
  const [country, setCountry] = useState(stay?.country ?? '');
  const [city, setCity] = useState(stay?.city ?? '');
  const place = { country: country.trim(), city: city.trim() };
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
  const error = clash ? `與「${placeName(clash)}」（${rangeLabel(clash)}）重疊。` : '';

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
        <h2>{stay ? '編輯行程' : '新增行程'}</h2>
        <div className="dates place">
          <label>
            國家
            <CountryCombobox value={country} onChange={setCountry} recent={countries} autoFocus />
          </label>
          <label>
            城市
            <CityCombobox value={city} country={country} onChange={setCity} onPickCountry={setCountry} recent={usedCities} />
          </label>
        </div>
        <div className="field">
          顏色
          <div className="swatches" role="radiogroup" aria-label="顏色">
            {PALETTE.map((c) => (
              <button
                key={c.key}
                type="button"
                role="radio"
                aria-checked={c.key === color}
                aria-label={c.name}
                title={c.name}
                className={`swatch${c.key === color ? ' selected' : ''}`}
                style={{ background: c.hex }}
                onClick={() => setPicked(c.key)}
              />
            ))}
          </div>
        </div>
        <div className="dates">
          <div className="field">
            開始日
            <DatePicker {...planDates} value={isoOfDay(startDay)} onChange={(iso) => pickDay(iso, pickStart)} rangeWith={isoOfDay(endDay)} label="開始日" />
          </div>
          <div className="field">
            結束日
            <DatePicker {...planDates} value={isoOfDay(endDay)} onChange={(iso) => pickDay(iso, pickEnd)} rangeWith={isoOfDay(startDay)} align="right" label="結束日" />
          </div>
        </div>
        {error ? (
          <p className="error">{error}</p>
        ) : (
          range && (
            <p className="range">
              {rangeLabel(range)}・{daysOf(range)} 天（約 {weeksLabel(daysOf(range))}）
            </p>
          )
        )}
        <label>
          跟誰去
          <input
            value={companions}
            onChange={(e) => setCompanions(e.target.value)}
            placeholder="例：自己、家人、Amy"
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
            已買機票
          </button>
          {hasTicket && (
            <div className="ticket-fields">
              <label>
                航空公司
                <input {...ticketField('airline')} placeholder="例：長榮航空" />
              </label>
              <label>
                航班編號
                <input {...ticketField('flightNo')} placeholder="例：BR211" />
              </label>
              <div className="field wide">
                起飛時間
                <div className="date-time">
                  <DatePicker value={depDate} onChange={(date) => setDeparture(date, depTime)} openAt={isoOfDay(startDay)} label="起飛日期" />
                  <input
                    type="time"
                    aria-label="起飛時刻"
                    value={depTime}
                    disabled={!depDate}
                    onChange={(e) => setDeparture(depDate, e.target.value)}
                  />
                </div>
              </div>
              <label>
                訂位代號
                <input {...ticketField('bookingRef')} placeholder="例：ABC123" />
              </label>
              <label>
                票價
                <input {...ticketField('price')} placeholder="例：NT$ 8,500" />
              </label>
            </div>
          )}
        </div>
        <label>
          備註
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="例：回台過年、朋友婚禮" rows={3} maxLength={300} />
        </label>
        <div className="buttons">
          {stay && (
            <button type="button" className="danger" onClick={onDelete}>
              刪除
            </button>
          )}
          <span className="spacer" />
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button type="submit" className="primary" disabled={!hasPlace || !range}>
            儲存
          </button>
        </div>
      </form>
    </div>
  );
}
