import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, PointerEvent as ReactPointerEvent } from 'react';
import { colorFor, load, overlaps, sanitize, save, type Stay } from './storage';
import { MONTHS, WEEKS, WEEK_COUNT, YEAR, currentWeekIndex, rangeLabel } from './weeks';

type Drag =
  | { kind: 'select'; anchor: number; startWeek: number; endWeek: number }
  | { kind: 'move'; id: string; grabWeek: number; origStart: number; startWeek: number; endWeek: number; moved: boolean }
  | { kind: 'resize'; id: string; edge: 'l' | 'r'; startWeek: number; endWeek: number; moved: boolean };

type Editing = { id: string | null; startWeek: number; endWeek: number };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const span = (s: { startWeek: number; endWeek: number }) => s.endWeek - s.startWeek + 1;
const col = (s: { startWeek: number; endWeek: number }): CSSProperties => ({
  gridColumn: `${s.startWeek + 1} / ${s.endWeek + 2}`,
});

export default function App() {
  const [stays, setStays] = useState<Stay[]>(load);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const thisWeek = useMemo(() => currentWeekIndex(), []);

  useEffect(() => save(stays), [stays]);

  const sorted = useMemo(() => [...stays].sort((a, b) => a.startWeek - b.startWeek), [stays]);
  const locations = useMemo(() => [...new Set(stays.map((s) => s.location))], [stays]);
  const totals = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of stays) m.set(s.location, (m.get(s.location) ?? 0) + span(s));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [stays]);
  const planned = stays.reduce((n, s) => n + span(s), 0);

  const weekAt = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    return clamp(Math.floor(((clientX - rect.left) / rect.width) * WEEK_COUNT), 0, WEEK_COUNT - 1);
  };
  const isFree = (week: number, exceptId?: string) =>
    !stays.some((s) => s.id !== exceptId && week >= s.startWeek && week <= s.endWeek);

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const week = weekAt(e.clientX);
    const target = e.target as HTMLElement;
    const stayEl = target.closest<HTMLElement>('[data-stay]');
    if (stayEl) {
      const stay = stays.find((s) => s.id === stayEl.dataset.stay);
      if (!stay) return;
      const edge = target.dataset.edge as 'l' | 'r' | undefined;
      const base = { id: stay.id, startWeek: stay.startWeek, endWeek: stay.endWeek, moved: false };
      setDrag(edge ? { kind: 'resize', edge, ...base } : { kind: 'move', grabWeek: week, origStart: stay.startWeek, ...base });
    } else {
      if (!isFree(week)) return;
      setDrag({ kind: 'select', anchor: week, startWeek: week, endWeek: week });
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const week = weekAt(e.clientX);
    if (drag.kind === 'select') {
      // Extend from the anchor toward the pointer, stopping at the first occupied week.
      const dir = week >= drag.anchor ? 1 : -1;
      let reach = drag.anchor;
      while (reach !== week && isFree(reach + dir)) reach += dir;
      setDrag({ ...drag, startWeek: Math.min(drag.anchor, reach), endWeek: Math.max(drag.anchor, reach) });
    } else if (drag.kind === 'move') {
      const len = span(drag);
      const startWeek = clamp(drag.origStart + week - drag.grabWeek, 0, WEEK_COUNT - len);
      const next = { startWeek, endWeek: startWeek + len - 1 };
      if (startWeek === drag.startWeek) return;
      if (stays.some((s) => s.id !== drag.id && overlaps(s, next))) return;
      setDrag({ ...drag, ...next, moved: true });
    } else {
      const others = stays.filter((s) => s.id !== drag.id);
      let { startWeek, endWeek } = drag;
      if (drag.edge === 'l') {
        const min = Math.max(0, ...others.filter((s) => s.endWeek < endWeek).map((s) => s.endWeek + 1));
        startWeek = clamp(week, min, endWeek);
      } else {
        const max = Math.min(WEEK_COUNT - 1, ...others.filter((s) => s.startWeek > startWeek).map((s) => s.startWeek - 1));
        endWeek = clamp(week, startWeek, max);
      }
      if (startWeek === drag.startWeek && endWeek === drag.endWeek) return;
      setDrag({ ...drag, startWeek, endWeek, moved: true });
    }
  }

  function onPointerUp() {
    if (!drag) return;
    setDrag(null);
    if (drag.kind === 'select') {
      setEditing({ id: null, startWeek: drag.startWeek, endWeek: drag.endWeek });
    } else if (drag.moved) {
      setStays((prev) =>
        prev.map((s) => (s.id === drag.id ? { ...s, startWeek: drag.startWeek, endWeek: drag.endWeek } : s)),
      );
    } else if (drag.kind === 'move') {
      setEditing({ id: drag.id, startWeek: drag.startWeek, endWeek: drag.endWeek });
    }
  }

  function saveEditing(location: string, note: string) {
    if (!editing) return;
    const fields = { location, note: note || undefined };
    setStays((prev) =>
      editing.id
        ? prev.map((s) => (s.id === editing.id ? { ...s, ...fields } : s))
        : [...prev, { id: crypto.randomUUID(), startWeek: editing.startWeek, endWeek: editing.endWeek, ...fields }],
    );
    setEditing(null);
  }

  function deleteEditing() {
    if (!editing?.id) return;
    setStays((prev) => prev.filter((s) => s.id !== editing.id));
    setEditing(null);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ year: YEAR, stays: sorted }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nomad-plan-${YEAR}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importJson(file: File) {
    try {
      const next = sanitize(JSON.parse(await file.text()));
      if (next.length === 0) return alert('檔案裡沒有可用的行程。');
      if (stays.length > 0 && !confirm(`匯入會取代目前的 ${stays.length} 段行程，確定嗎？`)) return;
      setStays(next);
    } catch {
      alert('無法讀取這個檔案，請確認是先前匯出的 JSON。');
    }
  }

  function clearAll() {
    if (confirm('確定清空全部行程？這個動作無法復原。')) setStays([]);
  }

  const shown = (s: Stay) => (drag && drag.kind !== 'select' && drag.id === s.id ? { ...s, ...drag } : s);
  const editingStay = editing?.id ? stays.find((s) => s.id === editing.id) : undefined;

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>{YEAR} 游牧年曆</h1>
          <p className="hint">在空格上拖拉選週數，輸入地點。拖色塊可搬移，拉兩端可伸縮，點一下可編輯。</p>
        </div>
        <div className="actions">
          <button onClick={exportJson} disabled={stays.length === 0}>匯出</button>
          <button onClick={() => fileRef.current?.click()}>匯入</button>
          <button onClick={clearAll} disabled={stays.length === 0}>清空</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importJson(file);
              e.target.value = '';
            }}
          />
        </div>
      </header>

      <div className="scroll">
        <div className="timeline" style={{ '--n': WEEK_COUNT } as CSSProperties}>
          <div className="row months">
            {MONTHS.map((m) => (
              <div key={m.month} className="month" style={{ gridColumn: `${m.startIndex + 1} / span ${m.span}` }}>
                {m.month + 1} 月
              </div>
            ))}
          </div>
          <div
            ref={trackRef}
            className={`row track${drag ? ' dragging' : ''}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={() => setDrag(null)}
          >
            {WEEKS.map((w) => (
              <div
                key={w.index}
                className={`cell${w.index === thisWeek ? ' today' : ''}${MONTHS.some((m) => m.startIndex === w.index) ? ' month-start' : ''}`}
                style={{ gridColumn: w.index + 1 }}
                title={rangeLabel(w.index, w.index)}
              >
                <span>{w.start.getDate()}</span>
              </div>
            ))}
            {stays.map((stay) => {
              const s = shown(stay);
              const weeks = span(s);
              return (
                <div
                  key={s.id}
                  data-stay={s.id}
                  className={`stay${s !== stay ? ' active' : ''}`}
                  style={{ ...col(s), background: colorFor(s.location) }}
                  title={`${s.location}｜${rangeLabel(s.startWeek, s.endWeek)}｜${weeks} 週${s.note ? `\n${s.note}` : ''}`}
                >
                  <span className="handle" data-edge="l" />
                  <span className="label">
                    <strong>{s.location}</strong>
                    <small>{weeks} 週{s.note ? ' ・📝' : ''}</small>
                  </span>
                  <span className="handle" data-edge="r" />
                </div>
              );
            })}
            {drag?.kind === 'select' && (
              <div className="selection" style={col(drag)}>
                {span(drag)} 週
              </div>
            )}
            {editing && !editing.id && <div className="selection" style={col(editing)} />}
          </div>
        </div>
      </div>

      <section className="panels">
        <div className="panel">
          <h2>摘要</h2>
          <p className="stat">
            已安排 <b>{planned}</b> 週・未安排 <b>{WEEK_COUNT - planned}</b> 週
          </p>
          <ul className="totals">
            {totals.map(([location, weeks]) => (
              <li key={location}>
                <i style={{ background: colorFor(location) }} />
                {location}
                <span>{weeks} 週</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel grow">
          <h2>行程</h2>
          {sorted.length === 0 ? (
            <p className="empty">還沒有行程。到上面的時間軸拖幾格試試。</p>
          ) : (
            <ol className="stays">
              {sorted.map((s) => (
                <li key={s.id} onClick={() => setEditing({ id: s.id, startWeek: s.startWeek, endWeek: s.endWeek })}>
                  <i style={{ background: colorFor(s.location) }} />
                  <span className="when">{rangeLabel(s.startWeek, s.endWeek)}</span>
                  <strong>{s.location}</strong>
                  <span className="weeks">{span(s)} 週</span>
                  {s.note && <span className="note">{s.note}</span>}
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {editing && (
        <Editor
          key={editing.id ?? `new-${editing.startWeek}-${editing.endWeek}`}
          editing={editing}
          stay={editingStay}
          locations={locations}
          onSave={saveEditing}
          onDelete={deleteEditing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function Editor(props: {
  editing: Editing;
  stay?: Stay;
  locations: string[];
  onSave: (location: string, note: string) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { editing, stay, locations, onSave, onDelete, onClose } = props;
  const [location, setLocation] = useState(stay?.location ?? '');
  const [note, setNote] = useState(stay?.note ?? '');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function submit(e: FormEvent) {
    e.preventDefault();
    const name = location.trim();
    if (name) onSave(name, note.trim());
  }

  return (
    <div className="backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="editor" onSubmit={submit}>
        <h2>{stay ? '編輯行程' : '新增行程'}</h2>
        <p className="range">
          {rangeLabel(editing.startWeek, editing.endWeek)}・{span(editing)} 週
        </p>
        <label>
          地點
          <input
            autoFocus
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="例：清邁"
            list="known-locations"
            maxLength={40}
          />
        </label>
        <datalist id="known-locations">
          {locations.map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
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
          <button type="submit" className="primary" disabled={!location.trim()}>
            儲存
          </button>
        </div>
      </form>
    </div>
  );
}
