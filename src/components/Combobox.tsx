import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, ReactNode, UIEvent } from 'react';
import { cityLabel, searchCities } from '../lib/cities';
import { GlobeHemisphereWest } from '@phosphor-icons/react/dist/csr/GlobeHemisphereWest';
import { City } from '@phosphor-icons/react/dist/csr/City';
import { Airplane } from '@phosphor-icons/react/dist/csr/Airplane';
import { Hash } from '@phosphor-icons/react/dist/csr/Hash';
import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown';
import { CaretUp } from '@phosphor-icons/react/dist/csr/CaretUp';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { airlineCode, airlineLogo, searchAirlines } from '../lib/airlines';
import { countryLabel, flagCode, isListedCountry, searchCountries } from '../lib/flags';
import { usePresence } from '../hooks/usePresence';
import { t, useLocale } from '../lib/i18n';
import { Flag } from './Flag';
import './Combobox.css';

type Option = {
  value: string; // what the field holds once this option is picked (may differ from what is shown)
  name: string; // shown in the list and in the field
  sub: string; // secondary text on the right
  flag: string; // country to draw a flag for; '' leaves the slot empty
  logo?: string; // an image to show instead of the flag at the start (airlines); the flag then goes after `sub`
  icon?: ReactNode; // an icon to show instead of the flag at the start, when the flag would say nothing new
};

type Props<T extends Option> = {
  value: string;
  display: (value: string) => string; // text to show in the field for a held value
  onChange: (value: string) => void;
  onPick?: (option: T) => void; // extra effect of choosing an option, beyond setting the value
  onSettle?: (value: string) => void; // the value once an option is picked or the field is left, not per keystroke
  search: (query: string) => T[];
  placeholder: string;
  emptyText: string;
  hint?: ReactNode; // shown under the field while the list is closed
  icon: ReactNode; // at the start of the field
  openIcon?: ReactNode; // replaces `icon` while the list is open
  autoFocus?: boolean;
};

// Height of the fades over the list's first and last rows; must match .combo-less / .combo-more in Combobox.css.
const FADE_HEIGHT = 40;
// Pixels the list must have scrolled before the top fade shows: its own padding, so the fade sits flush with the
// border by the time it is seen.
const ABOVE_FROM = 6;
// The list's border and padding: a row that ends within this of the list's bottom edge is fully in view.
const LIST_INSET = 7;

// Text field with a searchable list, so names are picked rather than typed out. Free text is always accepted:
// the plan may hold older or unusual entries, and no list of places is complete.
function Combobox<T extends Option>({
  value,
  display,
  onChange,
  onPick,
  onSettle,
  search,
  placeholder,
  emptyText,
  hint,
  icon,
  openIcon,
  autoFocus,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  // While the field has focus and holds something, an × at its end clears it.
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // A field focused as it mounts (autoFocus) gets no focus event, so look once.
  useEffect(() => setFocused(document.activeElement === inputRef.current), []);
  // Closed, the list fades out before it goes (styles/base.css .leaving)
  const { shown, leaving } = usePresence(open);
  // Until the user types, the field shows the whole list rather than just what matches the current value.
  const [typed, setTyped] = useState(false);
  const [active, setActive] = useState(-1);
  // Enter only picks from the list once the user has typed or arrowed; otherwise it submits the form as usual.
  const [armed, setArmed] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  // Whether the list goes on below (.more) or above (.above) its visible part; a fade over the rows at that end
  // says so (Combobox.css).
  const [more, setMore] = useState(false);
  const [above, setAbove] = useState(false);
  // The scrollbar shows only while the list is scrolling, and goes a moment after it stops (Combobox.css).
  const [scrolling, setScrolling] = useState(false);
  const scrollTimer = useRef(0);
  useEffect(() => () => clearTimeout(scrollTimer.current), []);
  const onListScroll = (e: UIEvent<HTMLUListElement>) => {
    measure(e.currentTarget);
    setScrolling(true);
    clearTimeout(scrollTimer.current);
    scrollTimer.current = window.setTimeout(() => setScrolling(false), 800);
  };
  const measure = (el: HTMLElement) => {
    // More below only when the last row is actually cut off. scrollHeight can't say: the fades overlap the rows
    // with negative margins, which can leave a pixel or two of scroll on a list that fits.
    const rows = el.querySelectorAll('[role="option"]');
    const last = rows[rows.length - 1]?.getBoundingClientRect();
    const box = el.getBoundingClientRect();
    setMore(Boolean(last) && last.bottom > box.bottom - LIST_INSET + 1);
    setAbove(el.scrollTop > ABOVE_FROM);
  };
  // With the pointer over a fade a small chevron appears there (.near-top / .near-bottom); while it is over the
  // chevron the list rolls that way on its own, a frame at a time, until the pointer leaves or the list ends.
  const [near, setNear] = useState<'top' | 'bottom' | null>(null);
  const rolling = useRef(0);
  const stopRolling = () => cancelAnimationFrame(rolling.current);
  const startRolling = (dir: 1 | -1) => {
    const step = () => {
      const el = listRef.current;
      if (!el) return;
      el.scrollTop += 6 * dir;
      const left = dir > 0 ? el.scrollHeight - el.scrollTop - el.clientHeight : el.scrollTop;
      if (left > 1) rolling.current = requestAnimationFrame(step);
    };
    stopRolling();
    rolling.current = requestAnimationFrame(step);
  };
  useEffect(() => stopRolling, []);
  const onListMove = (e: MouseEvent<HTMLUListElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    setNear(e.clientY - box.top <= FADE_HEIGHT ? 'top' : box.bottom - e.clientY <= FADE_HEIGHT ? 'bottom' : null);
  };
  // A press on a chevron jumps a page that way. mousedown, not click: the input must not lose focus (and close
  // the list).
  const page = (e: MouseEvent, dir: 1 | -1) => {
    e.preventDefault();
    listRef.current?.scrollBy({ top: listRef.current.clientHeight * dir, behavior: 'smooth' });
  };

  // While typing, the field shows exactly what was typed. Otherwise a short entry that happens to be a code
  // ("us", "id") would turn into its country name under the cursor.
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? display(value);
  const options = useMemo(() => search(typed ? text : ''), [search, typed, text]);

  useEffect(() => {
    // By role, not child index: the fades are children of the list too
    listRef.current?.querySelectorAll('[role="option"]')[active]?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  // Measured whenever the list appears or its rows change; scrolling (by wheel or the line above) remeasures.
  useEffect(() => {
    if (listRef.current) measure(listRef.current);
  }, [shown, options]);

  function choose(option: T) {
    onChange(option.value);
    onPick?.(option);
    onSettle?.(option.value);
    setDraft(null);
    setOpen(false);
    setTyped(false);
    setArmed(false);
  }

  // Empties the field and shows the whole list, keeping the focus in the field.
  function clear(e: MouseEvent) {
    e.preventDefault(); // mousedown: the input must not lose focus (and close the list)
    onChange('');
    setDraft('');
    setTyped(true);
    setArmed(false);
    setActive(-1);
    setOpen(true);
    inputRef.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) return setOpen(true);
      setArmed(true);
      const last = options.length - 1;
      setActive((i) => (e.key === 'ArrowDown' ? (i >= last ? 0 : i + 1) : i <= 0 ? last : i - 1));
    } else if (e.key === 'Enter' && open && armed && options[active]) {
      e.preventDefault(); // pick the option instead of submitting the form
      choose(options[active]);
    } else if (e.key === 'Escape' && open) {
      e.stopPropagation(); // close the list, not the whole editor
      setOpen(false);
    }
  }

  return (
    <div className="combo">
      <div className="combo-input">
        <span className="field-icon">
          {openIcon ? (
            // Both stay mounted in one cell, so opening and closing can swap them with a scale (Combobox.css).
            <>
              <span className={`field-icon-layer${open ? ' out' : ''}`}>{icon}</span>
              <span className={`field-icon-layer${open ? '' : ' out'}`}>{openIcon}</span>
            </>
          ) : (
            icon
          )}
        </span>
        <input
          ref={inputRef}
          className={focused && text ? 'clearable' : undefined}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
          autoFocus={autoFocus}
          autoComplete="off"
          value={text}
          placeholder={placeholder}
          maxLength={40}
          onChange={(e) => {
            // Typed text is held as-is; it is matched against the list when the stay is saved.
            onChange(e.target.value);
            setDraft(e.target.value);
            setTyped(true);
            setArmed(true);
            setOpen(true);
            setActive(0);
          }}
          onFocus={(e) => {
            setFocused(true);
            e.target.select();
            setTyped(false);
            setArmed(false);
            setActive(search('').findIndex((o) => o.value === value.trim()));
          }}
          // Focus alone doesn't open the list (the editor focuses a field as it opens); a click, typing or an
          // arrow key does.
          onClick={() => setOpen(true)}
          onBlur={() => {
            setFocused(false);
            setOpen(false);
            setDraft(null);
            onSettle?.(value);
          }}
          onKeyDown={onKeyDown}
        />
        {focused && text && (
          <button type="button" className="combo-clear" tabIndex={-1} aria-label={t('combo.clear')} title={t('combo.clear')} onMouseDown={clear}>
            <X size={12} weight="bold" />
          </button>
        )}
      </div>
      {shown && (
        <ul
          className={`combo-list${more ? ' more' : ''}${above ? ' above' : ''}${scrolling ? ' scrolling' : ''}${near ? ` near-${near}` : ''}${leaving ? ' leaving' : ''}`}
          role="listbox"
          id={listId}
          ref={listRef}
          onScroll={onListScroll}
          onMouseMove={onListMove}
          onMouseLeave={() => setNear(null)}
        >
          {/* The fade over the first rows once the list has scrolled, before every option (sticky to the top) */}
          <li className="combo-less" aria-hidden="true">
            <span onMouseEnter={() => startRolling(-1)} onMouseLeave={stopRolling} onMouseDown={(e) => page(e, -1)}>
              <CaretUp size={12} weight="bold" />
            </span>
          </li>
          {options.map((o, i) => (
            <li
              key={`${o.flag}/${o.value}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'active' : undefined}
              // mousedown, not click: the input must not lose focus (and close the list) first
              onMouseDown={(e) => {
                e.preventDefault();
                choose(o);
              }}
              onMouseEnter={() => setActive(i)}
            >
              {o.icon ? <span className="combo-icon">{o.icon}</span> : o.logo ? <Logo src={o.logo} /> : <Flag country={o.flag} />}
              <span>{o.name}</span>
              <small>
                {o.sub}
                {o.logo && o.flag && <Flag country={o.flag} />}
              </small>
            </li>
          ))}
          {options.length === 0 && <li className="none">{emptyText}</li>}
          {/* The fade over the last rows while the list goes on, after every option (sticky to the bottom) */}
          <li className="combo-more" aria-hidden="true">
            <span onMouseEnter={() => startRolling(1)} onMouseLeave={stopRolling} onMouseDown={(e) => page(e, 1)}>
              <CaretDown size={12} weight="bold" />
            </span>
          </li>
        </ul>
      )}
      {!open && hint}
    </div>
  );
}

export function CountryCombobox(props: {
  value: string; // a stored country: ISO code, region id, or free text
  onChange: (value: string) => void;
  // Once the country is picked or the field is left (typing passes through other countries' codes on the way)
  onSettle?: (value: string) => void;
  recent: string[]; // countries already used in the plan, listed first
  autoFocus?: boolean;
}) {
  const { value, onChange, onSettle, recent, autoFocus } = props;
  const locale = useLocale();
  const recentKey = recent.join('|');
  const search = useMemo(
    () => (query: string) =>
      searchCountries(query, recent).map((o) => ({ value: o.value, name: o.name, sub: o.sub, flag: o.value })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recentKey stands in for the array; names follow the locale
    [recentKey, locale],
  );
  const unlisted = value.trim() !== '' && !isListedCountry(value);
  return (
    <Combobox
      value={value}
      display={countryLabel}
      onChange={onChange}
      onSettle={onSettle}
      search={search}
      placeholder={t('country.placeholder')}
      emptyText={t('country.empty')}
      hint={unlisted && <small className="combo-hint">{t('country.unlisted', { name: value.trim() })}</small>}
      // Once the field names a country with a flag, the flag replaces the globe.
      icon={flagCode(value) ? <Flag country={value} /> : <GlobeHemisphereWest size={16} weight="bold" />}
      // While the list is open the field is a search box, so it says so instead of showing the current flag
      // (the city field does the same).
      openIcon={<MagnifyingGlass size={16} weight="bold" />}
      autoFocus={autoFocus}
    />
  );
}

export function CityCombobox(props: {
  value: string; // a stored city: a listed city's English name, or free text
  country: string; // narrows the list to that country's cities when it has any
  onChange: (value: string) => void;
  onPickCountry: (country: string) => void; // called when a picked city brings its country along
  recent: { city: string; country: string }[];
}) {
  const { value, country, onChange, onPickCountry, recent } = props;
  const locale = useLocale();
  const recentKey = recent.map((r) => `${r.country}/${r.city}`).join('|');
  const search = useMemo(
    () => (query: string) =>
      searchCities(query, country, recent).map((c) => ({
        value: c.value,
        name: c.name,
        // With no country chosen the list spans the world, so say where each city is.
        sub: [c.sub, country.trim() ? '' : countryLabel(c.country)].filter(Boolean).join(t('sep')),
        flag: c.country,
        // A city in the country already chosen: its flag would just repeat the country field, so show a city.
        icon: c.country === country ? <City size={16} weight="bold" /> : undefined,
        country: c.country,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recentKey stands in for the array; names follow the locale
    [country, recentKey, locale],
  );
  return (
    <Combobox
      value={value}
      display={(city) => cityLabel(country, city)}
      onChange={onChange}
      onPick={(o) => {
        if (o.country && !country.trim()) onPickCountry(o.country);
      }}
      search={search}
      placeholder={t('city.placeholder')}
      emptyText={t('city.empty')}
      icon={<City size={16} weight="bold" />}
      openIcon={<MagnifyingGlass size={16} weight="bold" />}
    />
  );
}

// Airline in the flight details: picked from a list of common airlines (with the home country's flag) or typed.
export function AirlineCombobox(props: { value: string; onChange: (value: string) => void; recent: string[] }) {
  const { value, onChange, recent } = props;
  const locale = useLocale();
  const code = airlineCode(value);
  const recentKey = recent.join('|');
  const search = useMemo(
    () => (query: string) =>
      searchAirlines(query, recent).map((a) => ({ value: a.value, name: a.name, sub: a.sub, flag: a.country, logo: airlineLogo(a.code) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recentKey stands in for the array; names follow the locale
    [recentKey, locale],
  );
  return (
    <Combobox
      value={value}
      display={(v) => v}
      onChange={onChange}
      search={search}
      placeholder={t('editor.airlinePh')}
      emptyText={t('airline.empty')}
      // Once the field names a listed airline, its logo replaces the plane (as a country's flag replaces the globe).
      icon={code ? <Logo src={airlineLogo(code)} /> : <Airplane size={16} weight="bold" />}
    />
  );
}

// Flight number: there is no list of every flight, so the picker offers the chosen airline's code to start from
// and the flight numbers already in the plan.
export function FlightNoCombobox(props: { value: string; airline: string; onChange: (value: string) => void; recent: string[] }) {
  const { value, airline, onChange, recent } = props;
  useLocale();
  const code = airlineCode(airline);
  const recentKey = recent.join('|');
  const search = useMemo(
    () => (query: string) => {
      const q = query.trim().toUpperCase();
      const used = [...new Set(recent.map((r) => r.trim().toUpperCase()).filter(Boolean))];
      // This airline's own flights first, then any others.
      used.sort((a, b) => Number(Boolean(code && b.startsWith(code))) - Number(Boolean(code && a.startsWith(code))));
      const options = used.filter((f) => f.includes(q)).map((f) => ({ value: f, name: f, sub: t('flightNo.used'), flag: '' }));
      if (code && !used.includes(code) && (!q || code.startsWith(q) || q.startsWith(code)))
        options.unshift({ value: code, name: code, sub: t('flightNo.code', { airline }), flag: '' });
      return options;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recentKey stands in for the array
    [recentKey, code, airline],
  );
  return (
    <Combobox
      value={value}
      display={(v) => v}
      onChange={onChange}
      search={search}
      placeholder={code ? `${code}211` : t('editor.flightNoPh')}
      emptyText={t('flightNo.empty')}
      icon={<Hash size={16} weight="bold" />}
    />
  );
}

// An airline logo. Hidden rather than shown broken if the file is missing.
function Logo({ src }: { src: string }) {
  return <img className="combo-logo" src={src} alt="" loading="lazy" onError={(e) => (e.currentTarget.style.visibility = 'hidden')} />;
}
