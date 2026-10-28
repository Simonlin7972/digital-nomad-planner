// A sandboxed copy of the planner for the landing page: the real views, fed a sample plan held in React state.
// Nothing here reads or writes the visitor's plan: no setStays, no localStorage writes, no geocoding (the sample's
// coordinates are written out below), no analytics. Changes last until the page is reloaded.
import { createContext, lazy, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Minus } from '@phosphor-icons/react/dist/csr/Minus';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { Editor, type Editing, type StayDetails } from '../components/Editor';
import { StayCard, TicketCard, HolidayCard, type Anchor } from '../components/HoverCards';
import { Presence } from '../components/Presence';
import { HolidayMenu } from '../components/HolidayMenu';
import { YearSelect } from '../components/YearSelect';
import { ShareDialog } from '../components/ShareDialog';
import { holidaySets as allHolidaySets, type Holiday, type HolidaySet } from '../lib/holidays';
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP, type HolidayToggles } from '../lib/prefs';
import { pushStays, splitStay, type ColorKey, type Stay } from '../lib/storage';
import type { DayRange } from '../lib/weeks';
import { placeQuery, type Coords } from '../hooks/useCoords';
import type { Zoom } from '../hooks/useZoom';
import { YEAR, dayOfIso } from '../lib/weeks';
import { t, useLocale } from '../lib/i18n';
import { clamp } from '../lib/util';
import '../components/ViewBar.css';
import '../components/MapView.css';

export const MapView = lazy(() => import('../components/MapView'));

/* ---------- Sample plan ---------- */

// Day index of a date in the current year (the sample follows whichever year the visitor's planner is on).
const d = (m: number, day: number) => dayOfIso(`${YEAR}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`)!;

export function samplePlan(): Stay[] {
  const s = (id: string, country: string, city: string, color: ColorKey, from: [number, number], to: [number, number], extra: Partial<Stay> = {}): Stay => ({
    id,
    country,
    city,
    color,
    startDay: d(...from),
    endDay: d(...to),
    ...extra,
  });
  return [
    s('tpe', 'tw', 'Taipei', 'red', [1, 1], [2, 14]),
    // Starts on the day Taipei ends: a travel day
    s('cnx', 'th', 'Chiang Mai', 'orange', [2, 14], [3, 20], { companions: t('landing.sample.with') }),
    s('cgu', 'id', 'Canggu', 'teal', [3, 21], [4, 30], { note: t('landing.sample.note') }),
    // Booked, so it is locked on the timeline
    s('lis', 'pt', 'Lisbon', 'blue', [5, 1], [6, 25], {
      ticket: { airline: 'Turkish Airlines', flightNo: 'TK 25', departure: `${YEAR}-05-01T09:10`, returnFlightNo: 'TK 24', returnDeparture: `${YEAR}-06-25T14:30` },
    }),
    s('tbs', 'ge', 'Tbilisi', 'purple', [6, 25], [7, 31]),
    s('mex', 'mx', 'Mexico City', 'green', [9, 1], [10, 31]),
    s('tyo', 'jp', 'Tokyo', 'pink', [11, 5], [11, 30]),
    s('tpe2', 'tw', 'Taipei', 'red', [12, 10], [12, 31]),
  ];
}

// Coordinates for the sample's places and the cities a visitor is likely to add, so the map needs no geocoding.
const KNOWN: [string, string, number, number][] = [
  ['tw', 'Taipei', 121.56, 25.04],
  ['th', 'Chiang Mai', 98.99, 18.79],
  ['th', 'Bangkok', 100.5, 13.76],
  ['id', 'Canggu', 115.14, -8.65],
  ['pt', 'Lisbon', -9.14, 38.72],
  ['ge', 'Tbilisi', 44.79, 41.72],
  ['mx', 'Mexico City', -99.13, 19.43],
  ['jp', 'Tokyo', 139.69, 35.69],
  ['vn', 'Da Nang', 108.22, 16.05],
  ['my', 'Kuala Lumpur', 101.69, 3.14],
];
export const SAMPLE_COORDS: Coords = Object.fromEntries(
  KNOWN.map(([country, city, lng, lat]) => [placeQuery({ country, city }), [lng, lat] as [number, number]]),
);

/* ---------- Zoom without saving ---------- */

// useZoom without saveZoom: the landing page must not change the planner's zoom.
function useLocalZoom(): Zoom {
  const [zoom, setZoom] = useState(ZOOM_MIN);
  const scrollRef = useRef<HTMLDivElement>(null);
  const anchor = useRef<{ frac: number; offset: number } | null>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  function zoomTo(next: number, anchorX?: number) {
    const el = scrollRef.current;
    if (el) {
      const offset = anchorX === undefined ? el.clientWidth / 2 : anchorX - el.getBoundingClientRect().left;
      anchor.current = { frac: (el.scrollLeft + offset) / el.scrollWidth, offset };
    }
    setZoom(clamp(next, ZOOM_MIN, ZOOM_MAX));
  }
  const stepTo = (next: number) => zoomTo(Math.round(next / ZOOM_STEP) * ZOOM_STEP);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && anchor.current) el.scrollLeft = anchor.current.frac * el.scrollWidth - anchor.current.offset;
    anchor.current = null;
  }, [zoom]);
  return { zoom, zoomRef, scrollRef, zoomTo, stepTo };
}

/* ---------- Shared sandbox state ---------- */

type Sandbox = {
  stays: Stay[];
  change: (update: (prev: Stay[]) => Stay[]) => void;
  reset: () => void;
  edited: boolean;
  zoom: Zoom;
  month: number;
  setMonth: (m: number) => void;
  holidayOn: HolidayToggles;
  toggleHoliday: (key: keyof HolidayToggles) => void;
  holidaySets: HolidaySet[];
  pending: DayRange | null;
  create: (range: DayRange) => void;
  edit: (stay: Stay) => void;
  resize: (id: string, range: DayRange) => void;
  split: (id: string, day: number) => void;
  hoverStay: (card: ({ id: string } & Anchor) | null) => void;
  hoverHoliday: (card: ({ holiday: Holiday; set: HolidaySet } & Anchor) | null) => void;
  ticket: (card: ({ id: string } & Anchor) | null) => void;
  ticketId: string | null;
  setDragging: (on: boolean) => void;
  openShare: () => void;
};

const Ctx = createContext<Sandbox | null>(null);
export const useSandbox = () => useContext(Ctx)!;

export function SandboxProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const [stays, setStays] = useState(samplePlan);
  const [edited, setEdited] = useState(false);
  // The sample's note and companion are text in the current language; until the visitor has changed something,
  // a language switch rebuilds it so they follow.
  const editedRef = useRef(edited);
  editedRef.current = edited;
  useEffect(() => {
    if (!editedRef.current) setStays(samplePlan());
  }, [locale]);
  const zoom = useLocalZoom();
  const [month, setMonth] = useState(1);
  const [holidayOn, setHolidayOn] = useState<HolidayToggles>({ tw: true, au: false });
  const [editing, setEditing] = useState<Editing | null>(null);
  const [stayCard, setStayCard] = useState<({ id: string } & Anchor) | null>(null);
  const [ticketCard, setTicketCard] = useState<({ id: string } & Anchor) | null>(null);
  const [holidayCard, setHolidayCard] = useState<({ holiday: Holiday; set: HolidaySet } & Anchor) | null>(null);
  const [dragging, setDragging] = useState(false);
  const [sharing, setSharing] = useState(false);

  // The page scrolls under the cards (the planner rarely does), so drop them on scroll rather than leave one floating.
  useEffect(() => {
    const hide = () => {
      setStayCard(null);
      setHolidayCard(null);
    };
    addEventListener('scroll', hide, { passive: true });
    return () => removeEventListener('scroll', hide);
  }, []);

  const change = (update: (prev: Stay[]) => Stay[]) => {
    setStays(update);
    setEdited(true);
  };
  const holidaySets = allHolidaySets().filter((set) => holidayOn[set.key]);

  function save(details: StayDetails, range: DayRange, color: ColorKey) {
    if (!editing) return;
    const fields = { ...details, color, ...range };
    change((prev) =>
      editing.id ? prev.map((s) => (s.id === editing.id ? { ...s, ...fields } : s)) : [...prev, { id: crypto.randomUUID(), ...fields }],
    );
    setEditing(null);
  }

  const value: Sandbox = {
    stays,
    change,
    reset: () => {
      setStays(samplePlan());
      setEdited(false);
    },
    edited,
    zoom,
    month,
    setMonth: (m) => setMonth(clamp(m, 0, 11)),
    holidayOn,
    toggleHoliday: (key) => setHolidayOn((prev) => ({ ...prev, [key]: !prev[key] })),
    holidaySets,
    pending: editing && !editing.id ? editing : null,
    create: (range) => setEditing({ id: null, ...range }),
    edit: (stay) => setEditing({ id: stay.id, startDay: stay.startDay, endDay: stay.endDay }),
    resize: (id, range) => change((prev) => pushStays(prev, id, range) ?? prev),
    split: (id, day) => change((prev) => splitStay(prev, id, day) ?? prev),
    hoverStay: setStayCard,
    hoverHoliday: setHolidayCard,
    ticket: setTicketCard,
    ticketId: ticketCard?.id ?? null,
    setDragging,
    openShare: () => setSharing(true),
  };

  const hovered = stayCard && !dragging && !editing ? stays.find((s) => s.id === stayCard.id) : undefined;
  const ticketStay = ticketCard ? stays.find((s) => s.id === ticketCard.id) : undefined;
  const editingStay = editing?.id ? stays.find((s) => s.id === editing.id) : undefined;

  return (
    <Ctx.Provider value={value}>
      {children}
      <Presence show={Boolean(hovered && stayCard)}>{hovered && stayCard && <StayCard stay={hovered} x={stayCard.x} y={stayCard.y} />}</Presence>
      <Presence show={Boolean(ticketStay && ticketCard)}>
        {ticketStay && ticketCard && <TicketCard stay={ticketStay} x={ticketCard.x} y={ticketCard.y} />}
      </Presence>
      <Presence show={Boolean(holidayCard)}>{holidayCard && <HolidayCard {...holidayCard} />}</Presence>
      <Presence show={Boolean(editing)}>
        {editing && (
          <Editor
            key={editing.id ?? `new-${editing.startDay}-${editing.endDay}`}
            editing={editing}
            stay={editingStay}
            others={stays.filter((s) => s.id !== editing.id)}
            onSave={save}
            onDelete={() => {
              change((prev) => prev.filter((s) => s.id !== editing.id));
              setEditing(null);
            }}
            onClose={() => setEditing(null)}
          />
        )}
      </Presence>
      <Presence show={sharing}>{sharing && <ShareDialog stays={stays} holidaySets={holidaySets} onClose={() => setSharing(false)} silent />}</Presence>
    </Ctx.Provider>
  );
}

/* ---------- The view bar, as ViewBar draws it, wired to the sandbox ---------- */

// ViewBar's markup and classes, but with a controlled YearSelect (the real one would switch the planner's year).
export function SandboxBar({ mode, onMode }: { mode: 'year' | 'month'; onMode: (m: 'year' | 'month') => void }) {
  useLocale();
  const sb = useSandbox();
  const z = sb.zoom.zoom;
  return (
    <div className="timeline-bar">
      <div className="view-pick">
        <YearSelect value={YEAR} onChange={() => {}} />
        <div className="segmented" role="tablist" aria-label={t('view.label')} style={{ '--i': mode === 'year' ? 0 : 1 } as CSSProperties}>
          <span className="thumb" aria-hidden />
          {(['year', 'month'] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => onMode(m)}>
              {t(m === 'year' ? 'view.year' : 'view.month')}
            </button>
          ))}
        </div>
      </div>
      <HolidayMenu sets={allHolidaySets()} on={sb.holidayOn} onToggle={sb.toggleHoliday} />
      {mode === 'year' && (
        <div className="zoombar">
          <button onClick={() => sb.zoom.stepTo(z - ZOOM_STEP)} disabled={z <= ZOOM_MIN} aria-label={t('zoom.out')}>
            <Minus size={14} weight="bold" />
          </button>
          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={ZOOM_STEP}
            value={z}
            onChange={(e) => sb.zoom.stepTo(Number(e.target.value))}
            aria-label={t('zoom.label')}
            style={{ '--pct': `${((z - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN)) * 100}%` } as CSSProperties}
          />
          <button onClick={() => sb.zoom.stepTo(z + ZOOM_STEP)} disabled={z >= ZOOM_MAX} aria-label={t('zoom.in')}>
            <Plus size={14} weight="bold" />
          </button>
          <span className="zoom-value">{Math.round(z * 100)}%</span>
        </div>
      )}
    </div>
  );
}

// "Put the sample back" — shown once the visitor has changed something.
export function ResetButton() {
  useLocale();
  const sb = useSandbox();
  if (!sb.edited) return null;
  return (
    <button className="l-reset" onClick={sb.reset}>
      <ArrowCounterClockwise size={14} weight="bold" /> {t('landing.try.reset')}
    </button>
  );
}
