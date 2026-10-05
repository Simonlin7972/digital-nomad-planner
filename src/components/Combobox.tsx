import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { cityLabel, searchCities } from '../lib/cities';
import { GlobeHemisphereWest } from '@phosphor-icons/react/dist/csr/GlobeHemisphereWest';
import { MapPin } from '@phosphor-icons/react/dist/csr/MapPin';
import { countryLabel, flagCode, isListedCountry, searchCountries } from '../lib/flags';
import { t, useLocale } from '../lib/i18n';
import { Flag } from './Flag';
import './Combobox.css';

type Option = {
  value: string; // what the field holds once this option is picked (may differ from what is shown)
  name: string; // shown in the list and in the field
  sub: string; // secondary text on the right
  flag: string; // country to draw a flag for; '' leaves the slot empty
};

type Props<T extends Option> = {
  value: string;
  display: (value: string) => string; // text to show in the field for a held value
  onChange: (value: string) => void;
  onPick?: (option: T) => void; // extra effect of choosing an option, beyond setting the value
  search: (query: string) => T[];
  placeholder: string;
  emptyText: string;
  hint?: ReactNode; // shown under the field while the list is closed
  icon: ReactNode; // at the start of the field
  autoFocus?: boolean;
};

// Text field with a searchable list, so names are picked rather than typed out. Free text is always accepted:
// the plan may hold older or unusual entries, and no list of places is complete.
function Combobox<T extends Option>({
  value,
  display,
  onChange,
  onPick,
  search,
  placeholder,
  emptyText,
  hint,
  icon,
  autoFocus,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  // Until the user types, the field shows the whole list rather than just what matches the current value.
  const [typed, setTyped] = useState(false);
  const [active, setActive] = useState(-1);
  // Enter only picks from the list once the user has typed or arrowed; otherwise it submits the form as usual.
  const [armed, setArmed] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  // While typing, the field shows exactly what was typed. Otherwise a short entry that happens to be a code
  // ("us", "id") would turn into its country name under the cursor.
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? display(value);
  const options = useMemo(() => search(typed ? text : ''), [search, typed, text]);

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  function choose(option: T) {
    onChange(option.value);
    onPick?.(option);
    setDraft(null);
    setOpen(false);
    setTyped(false);
    setArmed(false);
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
        <span className="field-icon">{icon}</span>
        <input
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
            e.target.select();
            setTyped(false);
            setArmed(false);
            setActive(search('').findIndex((o) => o.value === value.trim()));
          }}
          // Focus alone doesn't open the list (the editor focuses a field as it opens); a click, typing or an
          // arrow key does.
          onClick={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            setDraft(null);
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      {open && (
        <ul className="combo-list" role="listbox" id={listId} ref={listRef}>
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
              <Flag country={o.flag} />
              <span>{o.name}</span>
              <small>{o.sub}</small>
            </li>
          ))}
          {options.length === 0 && <li className="none">{emptyText}</li>}
        </ul>
      )}
      {!open && hint}
    </div>
  );
}

export function CountryCombobox(props: {
  value: string; // a stored country: ISO code, region id, or free text
  onChange: (value: string) => void;
  recent: string[]; // countries already used in the plan, listed first
  autoFocus?: boolean;
}) {
  const { value, onChange, recent, autoFocus } = props;
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
      search={search}
      placeholder={t('country.placeholder')}
      emptyText={t('country.empty')}
      hint={unlisted && <small className="combo-hint">{t('country.unlisted', { name: value.trim() })}</small>}
      // Once the field names a country with a flag, the flag replaces the globe.
      icon={flagCode(value) ? <Flag country={value} /> : <GlobeHemisphereWest size={16} weight="bold" />}
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
      icon={<MapPin size={16} weight="bold" />}
    />
  );
}
