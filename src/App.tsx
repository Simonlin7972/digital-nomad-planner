import { Suspense, lazy, useEffect, useState } from 'react';
import { Editor, type Editing, type StayDetails } from './components/Editor';
import { HelpDialog } from './components/HelpDialog';
import { HolidayCard, StayCard, TicketCard, type Anchor } from './components/HoverCards';
import MonthView from './components/MonthView';
import { StayList } from './components/StayList';
import { Summary } from './components/Summary';
import { Toolbar } from './components/Toolbar';
import { ViewBar } from './components/ViewBar';
import YearView from './components/YearView';
import { useCoords } from './hooks/useCoords';
import { useHistory } from './hooks/useHistory';
import { useZoom } from './hooks/useZoom';
import { renderPng } from './lib/exportPng';
import { download } from './lib/files';
import { holidaySets as allHolidaySets, type Holiday, type HolidaySet } from './lib/holidays';
import { t, useLocale } from './lib/i18n';
import { loadHolidayToggles, loadView, saveHolidayToggles, saveView } from './lib/prefs';
import { load, pushStays, sanitize, save, serialize, type ColorKey, type Stay } from './lib/storage';
import { MOD, clamp } from './lib/util';
import { YEAR, type DayRange } from './lib/weeks';

// The map library is large; load it separately from the planner itself.
const MapView = lazy(() => import('./components/MapView'));

const VIEW_FADE_MS = 140; // keep in sync with .view in styles/base.css

// Owns the plan and the page-level state, and wires the pieces together. The pieces own their interactions.
export default function App() {
  const locale = useLocale();
  // Every change to the plan goes through setStays so it lands on the undo stack.
  const { present: stays, set: setStays, undo, redo, canUndo, canRedo } = useHistory<Stay[]>(load);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [view, setView] = useState(loadView);
  const [holidayOn, setHolidayOn] = useState(loadHolidayToggles);
  const [stayCard, setStayCard] = useState<({ id: string } & Anchor) | null>(null);
  const [ticketCard, setTicketCard] = useState<({ id: string } & Anchor) | null>(null);
  const [holidayCard, setHolidayCard] = useState<({ holiday: Holiday; set: HolidaySet } & Anchor) | null>(null);
  const zoom = useZoom();
  const { coords, failed: coordsFailed } = useCoords(stays);

  // The view on screen trails view.mode by one fade-out, so the old view can leave before the new one enters.
  const [shownMode, setShownMode] = useState(view.mode);
  useEffect(() => {
    if (shownMode === view.mode) return;
    const timer = setTimeout(() => setShownMode(view.mode), VIEW_FADE_MS);
    return () => clearTimeout(timer);
  }, [view.mode, shownMode]);

  useEffect(() => save(stays), [stays]);
  useEffect(() => saveHolidayToggles(holidayOn), [holidayOn]);
  useEffect(() => saveView(view), [view]);
  useEffect(() => {
    document.documentElement.lang = locale === 'en' ? 'en' : 'zh-Hant';
    document.title = t('app.title', { year: YEAR });
  }, [locale]);

  const busy = Boolean(dragging || editing || helpOpen);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || busy) return;
      // Leave native text undo alone while typing in a field.
      const el = e.target;
      if (el instanceof Element && el.closest('input:not([type=range]), textarea, [contenteditable]')) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) undo();
      else if ((key === 'z' && e.shiftKey) || (key === 'y' && !e.shiftKey)) redo();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- undo and redo only call a state setter
  }, [busy]);

  const edit = (s: Stay) => setEditing({ id: s.id, startDay: s.startDay, endDay: s.endDay });

  function saveEditing(details: StayDetails, range: DayRange, color: ColorKey) {
    if (!editing) return;
    const fields = { ...details, color, ...range };
    setStays((prev) =>
      editing.id
        ? prev.map((s) => (s.id === editing.id ? { ...s, ...fields } : s))
        : [...prev, { id: crypto.randomUUID(), ...fields }],
    );
    setEditing(null);
  }

  function deleteEditing() {
    if (!editing?.id) return;
    setStays((prev) => prev.filter((s) => s.id !== editing.id));
    setEditing(null);
  }

  function exportJson() {
    const sorted = [...stays].sort((a, b) => a.startDay - b.startDay);
    download(new Blob([JSON.stringify(serialize(sorted), null, 2)], { type: 'application/json' }), 'json');
  }

  async function savePng() {
    try {
      download(await renderPng(stays), 'png');
    } catch {
      alert(t('alert.pngFailed'));
    }
  }

  async function importJson(file: File) {
    try {
      const next = sanitize(JSON.parse(await file.text()));
      if (next.length === 0) return alert(t('alert.importEmpty'));
      if (stays.length > 0 && !confirm(t('alert.importConfirm', { n: stays.length }))) return;
      setStays(next);
    } catch {
      alert(t('alert.importFailed'));
    }
  }

  function clearAll() {
    if (confirm(t('alert.clearConfirm'))) setStays([]);
  }

  const holidaySets = allHolidaySets().filter((set) => holidayOn[set.key]);
  const pending = editing && !editing.id ? editing : null;
  // No card mid-drag or behind the editor; it would only get in the way.
  const hoveredStay = stayCard && !dragging && !editing ? stays.find((s) => s.id === stayCard.id) : undefined;
  const ticketStay = ticketCard && !editing ? stays.find((s) => s.id === ticketCard.id) : undefined;
  const editingStay = editing?.id ? stays.find((s) => s.id === editing.id) : undefined;

  return (
    <div className="app">
      <header className="topbar">
        <h1>{t('app.title', { year: YEAR })}</h1>
        <Toolbar
          canUndo={canUndo}
          canRedo={canRedo}
          hasStays={stays.length > 0}
          onHelp={() => setHelpOpen(true)}
          onUndo={undo}
          onRedo={redo}
          onSavePng={() => void savePng()}
          onExport={exportJson}
          onImport={(file) => void importJson(file)}
          onClear={clearAll}
        />
      </header>

      <ViewBar
        mode={view.mode}
        onMode={(mode) => setView((v) => ({ ...v, mode }))}
        holidayOn={holidayOn}
        onToggleHoliday={(key) => setHolidayOn((prev) => ({ ...prev, [key]: !prev[key] }))}
        zoom={zoom.zoom}
        onZoom={zoom.stepTo}
      />

      <div key={shownMode} className={`view${shownMode !== view.mode ? ' leaving' : ''}`}>
        {shownMode === 'month' ? (
          <MonthView
            stays={stays}
            month={view.month}
            onMonth={(month) => setView({ mode: 'month', month: clamp(month, 0, 11) })}
            holidaySets={holidaySets}
            pending={pending}
            onCreate={(range) => setEditing({ id: null, ...range })}
            onEdit={edit}
            onResize={(id, range) => setStays((prev) => pushStays(prev, id, range) ?? prev)}
            onHover={setStayCard}
          />
        ) : (
          <YearView
            stays={stays}
            zoom={zoom}
            holidaySets={holidaySets}
            pending={pending}
            onCreate={(range) => setEditing({ id: null, ...range })}
            onEdit={edit}
            onChange={setStays}
            onOpenMonth={(month) => setView({ mode: 'month', month })}
            onHoverStay={setStayCard}
            onHoverHoliday={setHolidayCard}
            onDragging={setDragging}
          />
        )}
      </div>

      <section className="panels">
        <Summary stays={stays} coords={coords} />
        <StayList
          stays={stays}
          month={view.mode === 'month' ? view.month : null}
          onEdit={edit}
          ticketCardId={ticketCard?.id ?? null}
          onTicket={setTicketCard}
        />
      </section>

      <section className="panel map-panel">
        <h2>{t('map.title')}</h2>
        <Suspense fallback={<p className="map-status">{t('map.loading')}</p>}>
          <MapView stays={stays} coords={coords} failed={coordsFailed} />
        </Suspense>
      </section>

      {hoveredStay && stayCard && <StayCard stay={hoveredStay} x={stayCard.x} y={stayCard.y} />}
      {ticketStay && ticketCard && <TicketCard stay={ticketStay} x={ticketCard.x} y={ticketCard.y} />}
      {holidayCard && <HolidayCard {...holidayCard} />}

      {helpOpen && <HelpDialog mod={MOD} onClose={() => setHelpOpen(false)} />}

      {editing && (
        <Editor
          key={editing.id ?? `new-${editing.startDay}-${editing.endDay}`}
          editing={editing}
          stay={editingStay}
          others={stays.filter((s) => s.id !== editing.id)}
          onSave={saveEditing}
          onDelete={deleteEditing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
