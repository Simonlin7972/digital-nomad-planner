import { Suspense, lazy, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { BackupReminder } from './components/BackupReminder';
import { AllMonths, MONTH_INDEXES } from './components/AllMonths';
import { MobileItinerary } from './components/MobileItinerary';
import { ShareDialog } from './components/ShareDialog';
import { SyncConflictDialog } from './components/SyncConflictDialog';
import { SyncPaused } from './components/SyncPaused';
import { TransferDialog } from './components/TransferDialog';
import { ReportDialog } from './components/ReportDialog';
import { Editor, type Editing, type StayDetails } from './components/Editor';
import { changedIds, type Flash } from './components/Flash';
import { Presence } from './components/Presence';
import { Footer } from './components/Footer';
import { HelpDialog } from './components/HelpDialog';
import { HolidayCard, StayCard, TicketCard, type Anchor } from './components/HoverCards';
import MonthView from './components/MonthView';
import { StayList } from './components/StayList';
import { Summary } from './components/Summary';
import { PillNav } from './components/PillNav';
import { PixelNomad } from './components/PixelNomad';
import { Tagline } from './components/Tagline';
import { Toolbar } from './components/Toolbar';
import { ViewBar } from './components/ViewBar';
import YearView from './components/YearView';
import { useBackupReminder } from './hooks/useBackupReminder';
import { useCloudSync, type ConflictChoice } from './hooks/useCloudSync';
import { getProfile } from './lib/profile';
import { markYearBackedUp } from './lib/backup';
import { useCoords } from './hooks/useCoords';
import { useHistory } from './hooks/useHistory';
import { NARROW_QUERY, useNarrow } from './hooks/useNarrow';
import { useNearView } from './hooks/useNearView';
import { useZoom } from './hooks/useZoom';
import { bucket, track, trackActivation } from './lib/analytics';
import { download } from './lib/files';
import { availableHolidaySets, plannedHolidayCountries, type Holiday, type HolidaySet } from './lib/holidays';
import { loadWorldHolidays, subscribeWorldHolidays, worldHolidaysReady } from './lib/worldHolidays';
import { langTag, t, useLocale } from './lib/i18n';
import { loadHolidayToggles, loadView, saveHolidayToggles, saveView } from './lib/prefs';
import { computeEdges, load, pushStays, save, setEdges, type ColorKey, type Stay, loadYearPlan, saveYearPlan, sanitizeAll, serializeAll, splitStay } from './lib/storage';
import { decodePlan, onTransferLink, pendingTransfer } from './lib/transfer';
import { withTransition } from './lib/motion';
import { MOD, clamp } from './lib/util';
import { YEAR, YEARS, dateOfDay, getYear, setYear, subscribeYear, todayIndex, yearDirection, type DayRange } from './lib/weeks';
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

// The month view's month holding a day: the borrowed days at the timeline's ends count with January or December.
function monthOfDay(day: number): number {
  const d = dateOfDay(day);
  return d.getFullYear() < YEAR ? 0 : d.getFullYear() > YEAR ? 11 : d.getMonth();
}
const FLASH_MS = 700; // keep in sync with .flash in styles/base.css

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
  // What the neighbouring years' plans take up at this timeline's ends. They aren't edited while this year is on
  // screen, except by an import, which also changes this year's stays or switches year; so reading them again
  // whenever the stays change keeps this current. Kept where the position logic reads it, before the views run.
  // `cloudRev` counts the times the cloud sync wrote another year or the profile, which nothing else here sees.
  const [cloudRev, setCloudRev] = useState(0);
  const edges = useMemo(() => {
    const next = computeEdges();
    setEdges(next);
    return next;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stays, cloudRev]);
  const ghosts = edges.ghosts;
  // Holidays: the hand-written sets, plus one per other country in the plan (and the neighbouring years' stays on
  // this timeline), from a library that is loaded only once such a country turns up.
  const worldReady = useSyncExternalStore(subscribeWorldHolidays, worldHolidaysReady);
  const needsWorld = plannedHolidayCountries([...stays, ...ghosts]).length > 0;
  useEffect(() => {
    if (needsWorld) loadWorldHolidays();
  }, [needsWorld]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- worldReady and locale change what the sets hold
  const holidayChoices = useMemo(() => availableHolidaySets([...stays, ...ghosts]), [stays, ghosts, worldReady, locale]);
  const backup = useBackupReminder(stays);
  const staysRef = useRef(stays);
  staysRef.current = stays;
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

  // Stays that just changed (edited, dragged, cut, undone, imported) get a ring for a moment, so the change can be
  // seen where it landed. Not on the first render, and not when the plan is set to what it already was.
  const [flash, setFlash] = useState<Flash | null>(null);
  const prevStays = useRef(stays);
  const flashTimer = useRef(0);
  const flashStays = (ids: string[]) => {
    setFlash((f) => ({ ids: new Set(ids), n: (f?.n ?? 0) + 1 }));
    clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlash(null), FLASH_MS);
  };
  useEffect(() => {
    const prev = prevStays.current;
    prevStays.current = stays;
    if (prev === stays) return;
    const ids = changedIds(prev, stays);
    if (ids.length) flashStays(ids);
  }, [stays]);
  useEffect(() => () => clearTimeout(flashTimer.current), []);

  // Plan changes slide the stays into place where the browser can (lib/motion.ts); a drag's own preview already
  // drew its result, so a drop changes nothing on the timeline and only the list rows move.
  const changeStays = (update: Stay[] | ((prev: Stay[]) => Stay[])) => withTransition(() => setStays(update));
  const undoPlan = () => withTransition(undo);
  const redoPlan = () => withTransition(redo);

  // Signed in, the plan and the settings are also kept in the cloud (hooks/useCloudSync.ts). What comes down is
  // applied like an import: this year through setStays (so it can be undone), other years straight to storage.
  const sync = useCloudSync({
    stays,
    readOnly: narrow,
    onPull: (plans) => {
      let others = false;
      for (const [year, next] of plans) {
        if (year === YEAR) changeStays(next);
        else {
          saveYearPlan(year, next);
          others = true;
        }
      }
      if (others) setCloudRev((r) => r + 1);
    },
    onPushed: () => {
      // A copy in the cloud is a backup.
      backup.markBackedUp(staysRef.current);
      const now = Date.now();
      for (const year of YEARS) if (year !== YEAR) markYearBackedUp(year, loadYearPlan(year), now);
    },
    onProfilePulled: () => setCloudRev((r) => r + 1),
    onExportFirst: () => exportJson('conflict'),
  });
  const signedIn = Boolean(sync.session);
  const startSignIn = (source: 'menu' | 'reminder' | 'mobile') => {
    track('sign_in', { source });
    sync.signIn();
  };
  const resolveConflict = (choice: ConflictChoice) => {
    track('sync_conflict', { choice });
    void sync.resolve(choice);
  };
  useEffect(() => {
    if (!sync.signInFailed) return;
    alert(t('account.signInFailed'));
    sync.clearSignInFailed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sync.signInFailed]);

  // From the list: scroll to the stay on the timeline (or its month, in the month view) and ring it.
  function locate(s: Stay) {
    if (view.mode === 'month' && !view.all) {
      const month = monthOfDay(s.startDay);
      if (month !== view.month) setView((v) => ({ ...v, month }));
    }
    flashStays([s.id]);
    requestAnimationFrame(() => {
      document.querySelector(`.view [data-stay="${CSS.escape(s.id)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    });
  }
  useEffect(() => saveHolidayToggles(holidayOn), [holidayOn]);
  useEffect(() => saveView(view), [view]);
  useEffect(() => {
    document.documentElement.lang = langTag(locale);
    document.title = `${t('app.title')} — ${t('app.tagline')}`;
  }, [locale]);

  const busy = Boolean(dragging || editing || helpOpen || shareOpen || transferOpen || reportOpen || sync.conflict);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || busy) return;
      // Leave native text undo alone while typing in a field.
      const el = e.target;
      if (el instanceof Element && el.closest('input:not([type=range]), textarea, [contenteditable]')) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) undoPlan();
      else if ((key === 'z' && e.shiftKey) || (key === 'y' && !e.shiftKey)) redoPlan();
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
    changeStays((prev) =>
      editing.id
        ? prev.map((s) => (s.id === editing.id ? { ...s, ...fields } : s))
        : [...prev, { id: crypto.randomUUID(), ...fields }],
    );
    setEditing(null);
  }

  function deleteEditing() {
    if (!editing?.id) return;
    changeStays((prev) => prev.filter((s) => s.id !== editing.id));
    setEditing(null);
  }

  // Export and import cover every year in one file, so one backup is enough.
  function exportJson(source: 'menu' | 'reminder' | 'conflict') {
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
      changeStays(here);
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
  const holidaySets = holidayChoices.filter((set) => holidayOn[set.key]);
  const pending = editing && !editing.id ? editing : null;
  // No card mid-drag or behind the editor; it would only get in the way.
  const hoveredStay = stayCard && !dragging && !editing ? [...stays, ...ghosts].find((s) => s.id === stayCard.id) : undefined;
  const ticketStay = ticketCard && !editing ? stays.find((s) => s.id === ticketCard.id) : undefined;
  const editingStay = editing?.id ? stays.find((s) => s.id === editing.id) : undefined;

  return (
    <div className="app">
      {/* Folds into a pill on scroll on a computer; a phone's one-row header just scrolls away */}
      <PillNav className="topbar" off={narrow}>
        <div className="brand">
          <h1>
            <PixelNomad />
            {t('app.title')}
          </h1>
          <Tagline />
        </div>
        <Toolbar
          key={cloudRev}
          readOnly={narrow}
          canUndo={canUndo}
          canRedo={canRedo}
          hasStays={stays.length > 0}
          canExport={anyStays}
          onHelp={() => setHelpOpen(true)}
          onUndo={undoPlan}
          onRedo={redoPlan}
          onShare={() => {
            track('share_open', {});
            setShareOpen(true);
          }}
          onExport={() => exportJson('menu')}
          onTransfer={() => setTransferOpen(true)}
          onReport={() => setReportOpen(true)}
          onImport={(file) => void importJson(file)}
          signedIn={signedIn}
          syncStatus={sync.status}
          onSignIn={() => startSignIn('menu')}
        />
      </PillNav>

      <Presence show={backup.remind} className="reminder-slot">
        {backup.remind && (
          <BackupReminder daysSince={backup.daysSince} onExport={() => exportJson('reminder')} onSnooze={backup.snooze} onSignIn={signedIn ? undefined : () => startSignIn('reminder')} />
        )}
      </Presence>
      <Presence show={sync.paused && !sync.conflict} className="reminder-slot">
        {sync.paused && !sync.conflict && <SyncPaused onChoose={sync.resume} />}
      </Presence>

      {narrow ? (
        <>
          <MobileItinerary stays={stays} onSignIn={signedIn ? undefined : () => startSignIn('mobile')} />
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
            holidays={holidayChoices}
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
                    ghosts={ghosts}
                    onOpenYear={setYear}
                    month={month}
                    onMonth={() => {}}
                    holidaySets={holidaySets}
                    pending={pending}
                    onCreate={(range) => setEditing({ id: null, ...range })}
                    onEdit={edit}
                    onResize={(id, range) => changeStays((prev) => pushStays(prev, id, range) ?? prev)}
                    onHover={setStayCard}
                    onSplit={(id, day) => changeStays((prev) => splitStay(prev, id, day) ?? prev)}
                    flash={flash}
                  />
                ))}
              </AllMonths>
            ) : shownMode === 'month' ? (
              <MonthView
                stays={stays}
                ghosts={ghosts}
                onOpenYear={setYear}
                month={view.month}
                onMonth={(month) => setView((v) => ({ ...v, mode: 'month', month: clamp(month, 0, 11) }))}
                holidaySets={holidaySets}
                pending={pending}
                onCreate={(range) => setEditing({ id: null, ...range })}
                onEdit={edit}
                onResize={(id, range) => changeStays((prev) => pushStays(prev, id, range) ?? prev)}
                onHover={setStayCard}
                onSplit={(id, day) => changeStays((prev) => splitStay(prev, id, day) ?? prev)}
                flash={flash}
              />
            ) : (
              <YearView
                stays={stays}
                ghosts={ghosts}
                onOpenYear={setYear}
                zoom={zoom}
                holidaySets={holidaySets}
                pending={pending}
                onCreate={(range) => setEditing({ id: null, ...range })}
                onEdit={edit}
                onChange={changeStays}
                onOpenMonth={(month) => setView((v) => ({ ...v, mode: 'month', month }))}
                onHoverStay={setStayCard}
                onHoverHoliday={setHolidayCard}
                onDragging={setDragging}
                prevYear={neighbour(-1)}
                nextYear={neighbour(1)}
                onYearEdge={(dir) => setYear(YEAR + dir)}
                startAtEnd={entered === -1}
                onSplit={(id, day) => changeStays((prev) => splitStay(prev, id, day) ?? prev)}
                flash={flash}
              />
            )}
          </div>

          <section className="panels">
            <Summary stays={stays} coords={coords} />
            <StayList
              stays={stays}
              month={view.mode === 'month' && !view.all ? view.month : null}
              onEdit={edit}
              onLocate={locate}
              onCreate={(range) => setEditing({ id: null, ...range })}
              ticketCardId={ticketCard?.id ?? null}
              onTicket={setTicketCard}
              flash={flash}
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

      {/* Cards and dialogs leave with a short fade: Presence keeps each mounted for the exit (hooks/usePresence.ts) */}
      <Presence show={Boolean(hoveredStay && stayCard)}>
        {hoveredStay && stayCard && <StayCard stay={hoveredStay} x={stayCard.x} y={stayCard.y} />}
      </Presence>
      <Presence show={Boolean(ticketStay && ticketCard)}>
        {ticketStay && ticketCard && <TicketCard stay={ticketStay} x={ticketCard.x} y={ticketCard.y} />}
      </Presence>
      <Presence show={Boolean(holidayCard)}>{holidayCard && <HolidayCard {...holidayCard} />}</Presence>

      <Presence show={helpOpen}>{helpOpen && <HelpDialog mod={MOD} onClose={() => setHelpOpen(false)} />}</Presence>
      <Presence show={shareOpen}>
        {shareOpen && <ShareDialog stays={stays} holidaySets={holidaySets} onClose={() => setShareOpen(false)} />}
      </Presence>
      <Presence show={transferOpen}>{transferOpen && <TransferDialog stays={stays} onClose={() => setTransferOpen(false)} />}</Presence>
      <Presence show={reportOpen}>{reportOpen && <ReportDialog onClose={() => setReportOpen(false)} />}</Presence>
      <Presence show={Boolean(sync.conflict)}>{sync.conflict && <SyncConflictDialog years={sync.conflict} onChoose={resolveConflict} />}</Presence>
      {dropping && (
        <div className="drop-overlay" aria-hidden="true">
          <p>{t('import.drop')}</p>
        </div>
      )}

      <Presence show={Boolean(editing && !narrow)}>
        {editing && !narrow && (
          <Editor
            key={editing.id ?? `new-${editing.startDay}-${editing.endDay}`}
            editing={editing}
            stay={editingStay}
            others={[...stays.filter((s) => s.id !== editing.id), ...ghosts]}
            onSave={saveEditing}
            onDelete={deleteEditing}
            onClose={() => setEditing(null)}
          />
        )}
      </Presence>
    </div>
  );
}
