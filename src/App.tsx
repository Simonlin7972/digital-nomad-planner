import { Suspense, lazy, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { BackupReminder } from './components/BackupReminder';
import { AllMonths, MONTH_INDEXES } from './components/AllMonths';
import { MobileItinerary } from './components/MobileItinerary';
import { ShareDialog } from './components/ShareDialog';
import { TransferDialog } from './components/TransferDialog';
import { ReportDialog } from './components/ReportDialog';
import { Editor, type Editing, type StayDetails } from './components/Editor';
import { Footer } from './components/Footer';
import { HelpDialog } from './components/HelpDialog';
import { HolidayCard, StayCard, TicketCard, type Anchor } from './components/HoverCards';
import MonthView from './components/MonthView';
import { StayList } from './components/StayList';
import { Summary } from './components/Summary';
import { PixelNomad } from './components/PixelNomad';
import { Tagline } from './components/Tagline';
import { Toolbar } from './components/Toolbar';
import { ViewBar } from './components/ViewBar';
import YearView from './components/YearView';
import { useBackupReminder } from './hooks/useBackupReminder';
import { getProfile } from './lib/profile';
import { markYearBackedUp } from './lib/backup';
import { useCoords } from './hooks/useCoords';
import { useHistory } from './hooks/useHistory';
import { NARROW_QUERY, useNarrow } from './hooks/useNarrow';
import { useNearView } from './hooks/useNearView';
import { useZoom } from './hooks/useZoom';
import { bucket, track, trackActivation } from './lib/analytics';
import { download } from './lib/files';
import { holidaySets as allHolidaySets, type Holiday, type HolidaySet } from './lib/holidays';
import { langTag, t, useLocale } from './lib/i18n';
import { loadHolidayToggles, loadView, saveHolidayToggles, saveView } from './lib/prefs';
import { load, pushStays, save, type ColorKey, type Stay, loadYearPlan, saveYearPlan, sanitizeAll, serializeAll, splitStay } from './lib/storage';
import { decodePlan, onTransferLink, pendingTransfer } from './lib/transfer';
import { MOD, clamp } from './lib/util';
import { YEAR, YEARS, getYear, setYear, subscribeYear, todayIndex, yearDirection, type DayRange } from './lib/weeks';
// The map's frame is sized before the library arrives, so the page doesn't jump when it does.
import './components/MapView.css';

// The map library is large; load it separately from the planner itself.
const MapView = lazy(() => import('./components/MapView'));

// A phone opens on the year it is today when that year has a plan, since the year last looked at may be another
// one. Done before the first render: switching once a plan is on screen would race its save. Not when the saved
// year already has a stay covering today (the borrowed days at its edges).
if (window.matchMedia(NARROW_QUERY).matches) {
  const year = new Date().getFullYear();
  const today = todayIndex();
  const covered = today !== null && load().some((s) => s.startDay <= today && today <= s.endDay);
  if (year !== YEAR && (YEARS as readonly number[]).includes(year) && !covered && loadYearPlan(year).length) setYear(year);
}

const VIEW_FADE_MS = 140; // keep in sync with .view in styles/base.css

// The page for one year. Changing year remounts it, so nothing derived from the old year's dates survives;
// `entered` says which way the year changed, for the slide-in.
export default function App() {
  const year = useSyncExternalStore(subscribeYear, getYear);
  return <Planner key={year} entered={yearDirection()} />;
}

// Owns the plan and the page-level state, and wires the pieces together. The pieces own their interactions.
function Planner({ entered }: { entered: -1 | 0 | 1 }) {
  const locale = useLocale();
  // Every change to the plan goes through setStays so it lands on the undo stack.
  const { present: stays, set: setStays, undo, redo, canUndo, canRedo } = useHistory<Stay[]>(load);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [dropping, setDropping] = useState(false); // a file is being dragged over the page
  // Phones get a read-only layout: no timeline or calendar to drag on, no editor.
  const narrow = useNarrow();
  const [dragging, setDragging] = useState(false);
  const [view, setView] = useState(loadView);
  const [holidayOn, setHolidayOn] = useState(loadHolidayToggles);
  const [stayCard, setStayCard] = useState<({ id: string } & Anchor) | null>(null);
  const [ticketCard, setTicketCard] = useState<({ id: string } & Anchor) | null>(null);
  const [holidayCard, setHolidayCard] = useState<({ holiday: Holiday; set: HolidaySet } & Anchor) | null>(null);
  const zoom = useZoom();
  // Home (from the profile) is looked up with the stays, so the flight estimate can count the trips to and from it.
  const homePlace = (() => {
    const p = getProfile();
    return p.homeCountry || p.homeCity ? [{ country: p.homeCountry, city: p.homeCity } as Stay] : [];
  })();
  const { coords, failed: coordsFailed } = useCoords([...stays, ...homePlace]);
  const backup = useBackupReminder(stays);
  // The map library loads when the page is scrolled near the map, not with the page.
  const [mapRef, mapNear] = useNearView();

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
    document.documentElement.lang = langTag(locale);
    document.title = `${t('app.title')} — ${t('app.tagline')}`;
  }, [locale]);

  const busy = Boolean(dragging || editing || helpOpen || shareOpen || transferOpen || reportOpen);
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
    if (!editing.id) {
      track('stay_create', { view: view.mode, stay_count: bucket(stays.length + 1) });
      trackActivation();
    }
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

  // Export and import cover every year in one file, so one backup is enough.
  function exportJson(source: 'menu' | 'reminder') {
    const file = serializeAll(stays);
    track('export_json', { years: Object.keys(file.years).length, source });
    download(new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' }), 'json', false);
    backup.markBackedUp(stays);
    const now = Date.now();
    for (const year of YEARS) if (year !== YEAR) markYearBackedUp(year, loadYearPlan(year), now);
  }

  // Puts imported plans in place. The years they hold replace what is there (asking first if that loses stays);
  // other years are left alone. A file the user keeps counts as a backup; a link doesn't.
  function applyImport(plans: Map<number, Stay[]>, fromFile: boolean) {
    if (plans.size === 0) {
      track('import_result', { ok: false, years: 0 });
      return alert(t('alert.importEmpty'));
    }
    // Ask only when something would be lost: a year in the file that already has stays.
    const years = [...plans.keys()].sort();
    const replaced = years.filter((y) => (y === YEAR ? stays : loadYearPlan(y)).length > 0);
    if (replaced.length && !confirm(t('alert.importConfirm', { years: replaced.join(t('list')) }))) return;
    track('import_result', { ok: true, years: plans.size });
    const now = Date.now();
    for (const [year, next] of plans) {
      if (year === YEAR) continue;
      saveYearPlan(year, next);
      if (fromFile) markYearBackedUp(year, next, now);
    }
    const here = plans.get(YEAR);
    if (here) {
      // The year on screen goes through setStays, so the import can be undone.
      setStays(here);
      if (fromFile) backup.markBackedUp(here);
    } else {
      // Nothing for this year in the file: show the first year it brought in.
      setYear(years[0]);
    }
  }

  async function importJson(file: File) {
    try {
      applyImport(sanitizeAll(JSON.parse(await file.text())), true);
    } catch {
      track('import_result', { ok: false, years: 0 });
      alert(t('alert.importFailed'));
    }
  }

  // Opened from a "send to another device" link, or one pasted into this tab: import what it carries.
  const linkImport = useRef(applyImport);
  linkImport.current = applyImport;
  useEffect(() => {
    const importLink = (code: string) =>
      decodePlan(code)
        .then((data) => linkImport.current(sanitizeAll(data), false))
        .catch(() => {
          track('import_result', { ok: false, years: 0 });
          alert(t('alert.linkFailed'));
        });
    const code = pendingTransfer();
    if (code) void importLink(code);
    return onTransferLink((next) => void importLink(next));
  }, []);

  // On a computer a JSON file can be dropped anywhere on the page to import it.
  const dropImport = useRef(importJson);
  dropImport.current = busy ? () => Promise.resolve() : importJson;
  useEffect(() => {
    if (narrow) return;
    const withFile = (e: DragEvent) => Boolean(e.dataTransfer?.types.includes('Files'));
    const over = (e: DragEvent) => {
      if (!withFile(e)) return;
      e.preventDefault();
      setDropping(true);
    };
    // Leaving the window has no element to go to.
    const leave = (e: DragEvent) => e.relatedTarget === null && setDropping(false);
    const drop = (e: DragEvent) => {
      if (!withFile(e)) return;
      e.preventDefault();
      setDropping(false);
      const file = e.dataTransfer?.files[0];
      if (file && (file.type === 'application/json' || /\.json$/i.test(file.name))) void dropImport.current(file);
    };
    window.addEventListener('dragover', over);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('dragover', over);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
    };
  }, [narrow]);

  // Export is possible when any year has stays, not just this one.
  const anyStays = stays.length > 0 || YEARS.some((y) => y !== YEAR && loadYearPlan(y).length > 0);

  // The years either side of this one that can be pulled through to on the timeline.
  const neighbour = (dir: 1 | -1) => ((YEARS as readonly number[]).includes(YEAR + dir) ? YEAR + dir : null);
  const holidaySets = allHolidaySets().filter((set) => holidayOn[set.key]);
  const pending = editing && !editing.id ? editing : null;
  // No card mid-drag or behind the editor; it would only get in the way.
  const hoveredStay = stayCard && !dragging && !editing ? stays.find((s) => s.id === stayCard.id) : undefined;
  const ticketStay = ticketCard && !editing ? stays.find((s) => s.id === ticketCard.id) : undefined;
  const editingStay = editing?.id ? stays.find((s) => s.id === editing.id) : undefined;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <h1>
            <PixelNomad />
            {t('app.title')}
          </h1>
          <Tagline />
        </div>
        <Toolbar
          readOnly={narrow}
          canUndo={canUndo}
          canRedo={canRedo}
          hasStays={stays.length > 0}
          canExport={anyStays}
          onHelp={() => setHelpOpen(true)}
          onUndo={undo}
          onRedo={redo}
          onShare={() => {
            track('share_open', {});
            setShareOpen(true);
          }}
          onExport={() => exportJson('menu')}
          onTransfer={() => setTransferOpen(true)}
          onReport={() => setReportOpen(true)}
          onImport={(file) => void importJson(file)}
        />
      </header>

      {backup.remind && <BackupReminder daysSince={backup.daysSince} onExport={() => exportJson('reminder')} onSnooze={backup.snooze} />}

      {narrow ? (
        <>
          <MobileItinerary stays={stays} />
          {/* With nothing planned, all-zero totals and an empty map are just more to scroll past. */}
          {stays.length > 0 && (
            <section className="panels">
              <Summary stays={stays} coords={coords} />
            </section>
          )}
        </>
      ) : (
        <>
          <ViewBar
            mode={view.mode}
            onMode={(mode) => setView((v) => ({ ...v, mode }))}
            all={view.all}
            onAll={(all) => setView((v) => ({ ...v, all }))}
            holidayOn={holidayOn}
            onToggleHoliday={(key) => setHolidayOn((prev) => ({ ...prev, [key]: !prev[key] }))}
            zoom={zoom.zoom}
            onZoom={zoom.stepTo}
          />

          <div
            key={shownMode}
            className={`view${shownMode !== view.mode ? ' leaving' : ''}${entered ? ` year-in-${entered > 0 ? 'next' : 'prev'}` : ''}`}
          >
            {shownMode === 'month' && view.all ? (
              <AllMonths focus={view.month}>
                {MONTH_INDEXES.map((month) => (
                  <MonthView
                    key={month}
                    stacked
                    stays={stays}
                    month={month}
                    onMonth={() => {}}
                    holidaySets={holidaySets}
                    pending={pending}
                    onCreate={(range) => setEditing({ id: null, ...range })}
                    onEdit={edit}
                    onResize={(id, range) => setStays((prev) => pushStays(prev, id, range) ?? prev)}
                    onHover={setStayCard}
                    onSplit={(id, day) => setStays((prev) => splitStay(prev, id, day) ?? prev)}
                  />
                ))}
              </AllMonths>
            ) : shownMode === 'month' ? (
              <MonthView
                stays={stays}
                month={view.month}
                onMonth={(month) => setView((v) => ({ ...v, mode: 'month', month: clamp(month, 0, 11) }))}
                holidaySets={holidaySets}
                pending={pending}
                onCreate={(range) => setEditing({ id: null, ...range })}
                onEdit={edit}
                onResize={(id, range) => setStays((prev) => pushStays(prev, id, range) ?? prev)}
                onHover={setStayCard}
                onSplit={(id, day) => setStays((prev) => splitStay(prev, id, day) ?? prev)}
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
                onOpenMonth={(month) => setView((v) => ({ ...v, mode: 'month', month }))}
                onHoverStay={setStayCard}
                onHoverHoliday={setHolidayCard}
                onDragging={setDragging}
                prevYear={neighbour(-1)}
                nextYear={neighbour(1)}
                onYearEdge={(dir) => setYear(YEAR + dir)}
                startAtEnd={entered === -1}
                onSplit={(id, day) => setStays((prev) => splitStay(prev, id, day) ?? prev)}
              />
            )}
          </div>

          <section className="panels">
            <Summary stays={stays} coords={coords} />
            <StayList
              stays={stays}
              month={view.mode === 'month' && !view.all ? view.month : null}
              onEdit={edit}
              onCreate={(range) => setEditing({ id: null, ...range })}
              ticketCardId={ticketCard?.id ?? null}
              onTicket={setTicketCard}
            />
          </section>
        </>
      )}

      {!(narrow && stays.length === 0) && (
        <section ref={mapRef} className="panel map-panel">
          <h2>{t('map.title')}</h2>
          {mapNear ? (
            <Suspense
              fallback={
                <>
                  <div className="map" />
                  <p className="map-status">{t('map.loading')}</p>
                </>
              }
            >
              <MapView stays={stays} coords={coords} failed={coordsFailed} />
            </Suspense>
          ) : (
            <div className="map" />
          )}
        </section>
      )}

      <Footer />

      {hoveredStay && stayCard && <StayCard stay={hoveredStay} x={stayCard.x} y={stayCard.y} />}
      {ticketStay && ticketCard && <TicketCard stay={ticketStay} x={ticketCard.x} y={ticketCard.y} />}
      {holidayCard && <HolidayCard {...holidayCard} />}

      {helpOpen && <HelpDialog mod={MOD} onClose={() => setHelpOpen(false)} />}
      {shareOpen && <ShareDialog stays={stays} holidaySets={holidaySets} onClose={() => setShareOpen(false)} />}
      {transferOpen && <TransferDialog stays={stays} onClose={() => setTransferOpen(false)} />}
      {reportOpen && <ReportDialog onClose={() => setReportOpen(false)} />}
      {dropping && (
        <div className="drop-overlay" aria-hidden="true">
          <p>{t('import.drop')}</p>
        </div>
      )}

      {editing && !narrow && (
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
