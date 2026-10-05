import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { searchCities } from '../lib/cities';
import { Flag } from './Flag';
import { isListedCountry, searchCountries } from '../lib/flags';
import './Combobox.css';

type Option = {
  key: string;
  name: string; // what goes into the field
  sub: string; // secondary text on the right
  flag: string; // country name to draw a flag for; '' leaves the slot empty
};

type Props<T extends Option> = {
  value: string;
  onChange: (value: string) => void;
  onPick?: (option: T) => void; // extra effect of choosing an option, beyond setting the value
  search: (query: string) => T[];
  placeholder: string;
  emptyText: string;
  hint?: ReactNode; // shown under the field while the list is closed
  autoFocus?: boolean;
};

// Text field with a searchable list, so names are picked rather than typed out. Free text is always accepted:
// the plan may hold older or unusual entries, and no list of places is complete.
function Combobox<T extends Option>({ value, onChange, onPick, search, placeholder, emptyText, hint, autoFocus }: Props<T>) {
  const [open, setOpen] = useState(false);
  // Until the user types, the field shows the whole list rather than just what matches the current value.
  const [typed, setTyped] = useState(false);
  const [active, setActive] = useState(-1);
  // Enter only picks from the list once the user has typed or arrowed; otherwise it submits the form as usual.
  const [armed, setArmed] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const options = useMemo(() => search(typed ? value : ''), [search, typed, value]);

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  function choose(option: T) {
    onChange(option.name);
    onPick?.(option);
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
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open && options[active] ? `${listId}-${active}` : undefined}
        autoFocus={autoFocus}
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        maxLength={40}
        onChange={(e) => {
          onChange(e.target.value);
          setTyped(true);
          setArmed(true);
          setOpen(true);
          setActive(0);
        }}
        onFocus={(e) => {
          e.target.select();
          setTyped(false);
          setArmed(false);
          setActive(search('').findIndex((o) => o.name === value.trim()));
        }}
        // Focus alone doesn't open the list (the editor focuses a field as it opens); a click, typing or an
        // arrow key does.
        onClick={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul className="combo-list" role="listbox" id={listId} ref={listRef}>
          {options.map((o, i) => (
            <li
              key={o.key}
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
  value: string;
  onChange: (value: string) => void;
  recent: string[]; // countries already used in the plan, listed first
  autoFocus?: boolean;
}) {
  const { value, onChange, recent, autoFocus } = props;
  const recentKey = recent.join('|');
  const search = useMemo(
    () => (query: string) => searchCountries(query, recent).map((o) => ({ key: o.name, name: o.name, sub: o.en, flag: o.name })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recentKey stands in for the array's contents
    [recentKey],
  );
  const unlisted = value.trim() !== '' && !isListedCountry(value);
  return (
    <Combobox
      value={value}
      onChange={onChange}
      search={search}
      placeholder="搜尋國家，例：泰國"
      emptyText="找不到符合的國家。仍可照輸入的文字儲存。"
      hint={unlisted && <small className="combo-hint">「{value.trim()}」不在國家清單內，會照原樣儲存。</small>}
      autoFocus={autoFocus}
    />
  );
}

export function CityCombobox(props: {
  value: string;
  country: string; // narrows the list to that country's cities when it is a recognised one
  onChange: (value: string) => void;
  onPickCountry: (country: string) => void; // called when a picked city brings its country along
  recent: { city: string; country: string }[];
}) {
  const { value, country, onChange, onPickCountry, recent } = props;
  const recentKey = recent.map((r) => `${r.country}/${r.city}`).join('|');
  const search = useMemo(
    () => (query: string) =>
      searchCities(query, country, recent).map((c) => ({
        key: `${c.country}/${c.name}`,
        name: c.name,
        // With no country chosen the list spans the world, so say where each city is.
        sub: [c.en, country.trim() ? '' : c.country].filter(Boolean).join('・'),
        flag: c.country,
        country: c.country,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recentKey stands in for the array's contents
    [country, recentKey],
  );
  return (
    <Combobox
      value={value}
      onChange={onChange}
      onPick={(o) => {
        if (o.country && !country.trim()) onPickCountry(o.country);
      }}
      search={search}
      placeholder="搜尋城市，例：清邁"
      emptyText="清單裡沒有這個城市。照輸入的文字儲存即可。"
    />
  );
}
