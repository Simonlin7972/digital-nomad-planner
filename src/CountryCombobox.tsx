import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Flag } from './Flag';
import { isListedCountry, searchCountries } from './flags';

type Props = {
  value: string;
  onChange: (value: string) => void;
  recent: string[]; // countries already used in the plan, listed first
  autoFocus?: boolean;
};

// Country field with a searchable list, so names are picked rather than typed out. Free text is still accepted
// (the plan may hold older or unusual entries) but is called out as not being on the list.
export function CountryCombobox({ value, onChange, recent, autoFocus }: Props) {
  const [open, setOpen] = useState(false);
  // Until the user types, the field shows the whole list rather than just what matches the current value.
  const [typed, setTyped] = useState(false);
  const [active, setActive] = useState(-1);
  // Enter only picks from the list once the user has typed or arrowed; otherwise it submits the form as usual.
  const [armed, setArmed] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const options = useMemo(() => searchCountries(typed ? value : '', recent), [typed, value, recent]);
  const unlisted = value.trim() !== '' && !isListedCountry(value);

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  function choose(name: string) {
    onChange(name);
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
      choose(options[active].name);
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
        placeholder="搜尋國家，例：泰國"
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
          setOpen(true);
          setActive(searchCountries('', recent).findIndex((o) => o.name === value.trim()));
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {open && (
        <ul className="combo-list" role="listbox" id={listId} ref={listRef}>
          {options.map((o, i) => (
            <li
              key={o.name}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'active' : undefined}
              // mousedown, not click: the input must not lose focus (and close the list) first
              onMouseDown={(e) => {
                e.preventDefault();
                choose(o.name);
              }}
              onMouseEnter={() => setActive(i)}
            >
              <Flag country={o.name} />
              <span>{o.name}</span>
              <small>{o.en}</small>
            </li>
          ))}
          {options.length === 0 && <li className="none">找不到符合的國家。仍可照輸入的文字儲存。</li>}
        </ul>
      )}
      {unlisted && !open && <small className="combo-hint">「{value.trim()}」不在國家清單內，會照原樣儲存。</small>}
    </div>
  );
}
