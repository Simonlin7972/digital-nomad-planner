import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent, PointerEvent as ReactPointerEvent } from 'react';
import { renderPng } from './exportPng';
import { colorFor, load, overlaps, sanitize, save, serialize, type Stay } from './storage';
import {
  MONTHS,
  SLOTS,
  TOTAL_DAYS,
  WEEKS,
  YEAR,
  currentWeekIndex,
  dayOfBoundary,
  dayOfIso,
  daysOf,
  isoOfDay,
  rangeLabel,
  slotsOf,
  weeksLabel,
  type DayRange,
} from './weeks';

type Drag =
  | { kind: 'select'; anchor: number; lo: number; hi: number } // slots, inclusive
  | (DayRange & { kind: 'move'; id: string; grabSlot: number; orig: DayRange; moved: boolean })
  | (DayRange & { kind: 'resize'; id: string; edge: 'l' | 'r'; grabSlot: number; moved: boolean });

type Editing = DayRange & { id: string | null };

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const slotCol = (s: number, e: number): CSSProperties => ({ gridColumn: `${s + 1} / ${e + 1}` });
const stayCol = (r: DayRange) => {
  const { s, e } = slotsOf(r);
  return slotCol(s, e);
};

export default function App() {
  const [stays, setStays] = useState<Stay[]>(load);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const thisWeek = useMemo(() => currentWeekIndex(), []);

  useEffect(() => save(stays), [stays]);

  const sorted = useMemo(() => [...stays].sort((a, b) => a.startDay - b.startDay), [stays]);
  const locations = useMemo(() => [...new Set(stays.map((s) => s.location))], [stays]);
  const totals = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of stays) m.set(s.location, (m.get(s.location) ?? 0) + daysOf(s));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [stays]);
  const plannedDays = stays.reduce((n, s) => n + daysOf(s), 0);

  const slotAt = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    return clamp(Math.floor(((clientX - rect.left) / rect.width) * SLOTS), 0, SLOTS - 1);
  };
  const slotFree = (slot: number) =>
    slot >= 0 &&
    slot < SLOTS &&
    !stays.some((st) => {
      const { s, e } = slotsOf(st);
      return slot >= s && slot < e;
    });
  // Trims a day range so it doesn't run into neighbouring stays; null if nothing is left.
  const fit = (range: DayRange): DayRange | null => {
    let { startDay, endDay } = range;
    for (const o of sorted) {
      if (o.endDay < startDay || o.startDay > endDay) continue;
      if (o.startDay <= startDay) startDay = o.endDay + 1;
      else endDay = Math.min(endDay, o.startDay - 1);
    }
    return startDay <= endDay ? { startDay, endDay } : null;
  };

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const slot = slotAt(e.clientX);
    const target = e.target as HTMLElement;
    const stayEl = target.closest<HTMLElement>('[data-stay]');
    if (stayEl) {
      const stay = stays.find((s) => s.id === stayEl.dataset.stay);
      if (!stay) return;
      const edge = target.dataset.edge as 'l' | 'r' | undefined;
      const range = { startDay: stay.startDay, endDay: stay.endDay };
      const base = { id: stay.id, grabSlot: slot, moved: false, ...range };
      setDrag(edge ? { kind: 'resize', edge, ...base } : { kind: 'move', orig: range, ...base });
    } else {
      if (!slotFree(slot)) return;
      setDrag({ kind: 'select', anchor: slot, lo: slot, hi: slot });
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const slot = slotAt(e.clientX);
    if (drag.kind === 'select') {
      // Extend from the anchor toward the pointer, stopping at the first occupied slot.
      const dir = slot >= drag.anchor ? 1 : -1;
      let reach = drag.anchor;
      while (reach !== slot && slotFree(reach + dir)) reach += dir;
      setDrag({ ...drag, lo: Math.min(drag.anchor, reach), hi: Math.max(drag.anchor, reach) });
      return;
    }
    const others = stays.filter((s) => s.id !== drag.id);
    if (drag.kind === 'move') {
      const delta = slot - drag.grabSlot;
      const len = daysOf(drag.orig);
      // Whole-week moves keep the exact dates; half-week moves snap the start to a slot boundary.
      const raw =
        delta % 2 === 0
          ? drag.orig.startDay + (delta / 2) * 7
          : dayOfBoundary(clamp(slotsOf(drag.orig).s + delta, 0, SLOTS - 1));
      const startDay = clamp(raw, 0, TOTAL_DAYS - len);
      const next = { startDay, endDay: startDay + len - 1 };
      if (startDay === drag.startDay) return;
      if (others.some((s) => overlaps(s, next))) return;
      setDrag({ ...drag, ...next, moved: true });
    } else {
      if (!drag.moved && slot === drag.grabSlot) return;
      let { startDay, endDay } = drag;
      if (drag.edge === 'l') {
        const prevEnd = Math.max(-1, ...others.filter((s) => s.endDay < endDay).map((s) => s.endDay));
        startDay = Math.max(Math.min(dayOfBoundary(slot), endDay), prevEnd + 1);
      } else {
        const nextStart = Math.min(TOTAL_DAYS, ...others.filter((s) => s.startDay > startDay).map((s) => s.startDay));
        endDay = Math.min(Math.max(dayOfBoundary(slot + 1) - 1, startDay), nextStart - 1);
      }
      if (startDay === drag.startDay && endDay === drag.endDay) return;
      setDrag({ ...drag, startDay, endDay, moved: true });
    }
  }

  function onPointerUp() {
    if (!drag) return;
    setDrag(null);
    if (drag.kind === 'select') {
      const range = fit({ startDay: dayOfBoundary(drag.lo), endDay: dayOfBoundary(drag.hi + 1) - 1 });
      if (range) setEditing({ id: null, ...range });
    } else if (drag.moved) {
      setStays((prev) => prev.map((s) => (s.id === drag.id ? { ...s, startDay: drag.startDay, endDay: drag.endDay } : s)));
    } else if (drag.kind === 'move') {
      setEditing({ id: drag.id, startDay: drag.startDay, endDay: drag.endDay });
    }
  }

  function saveEditing(location: string, note: string, range: DayRange) {
    if (!editing) return;
    const fields = { location, note: note || undefined, ...range };
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

  function download(blob: Blob, ext: string) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `nomad-plan-${YEAR}.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportJson() {
    download(new Blob([JSON.stringify(serialize(sorted), null, 2)], { type: 'application/json' }), 'json');
  }

  async function savePng() {
    try {
      download(await renderPng(stays), 'png');
    } catch {
      alert('無法產生 PNG，請再試一次。');
    }
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

  const shown = (s: Stay): Stay =>
    drag && drag.kind !== 'select' && drag.id === s.id ? { ...s, startDay: drag.startDay, endDay: drag.endDay } : s;
  const editingStay = editing?.id ? stays.find((s) => s.id === editing.id) : undefined;

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>{YEAR} 游牧年曆</h1>
          <p className="hint">在空格上拖拉（以半週為單位）選時段，輸入地點。拖色塊可搬移，拉兩端可伸縮，點一下可編輯並設定確切日期。</p>
        </div>
        <div className="actions">
          <button onClick={() => void savePng()} disabled={stays.length === 0}>保存 PNG</button>
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
        <div className="timeline" style={{ '--n': SLOTS } as CSSProperties}>
          <div className="row months">
            {MONTHS.map((m) => (
              <div key={m.month} className="month" style={{ gridColumn: `${m.startIndex * 2 + 1} / span ${m.span * 2}` }}>
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
                style={{ gridColumn: `${w.index * 2 + 1} / span 2` }}
                title={rangeLabel({ startDay: w.index * 7, endDay: w.index * 7 + 6 })}
              >
                <span>{w.start.getDate()}</span>
              </div>
            ))}
            {stays.map((stay) => {
              const s = shown(stay);
              const weeks = weeksLabel(daysOf(s));
              return (
                <div
                  key={s.id}
                  data-stay={s.id}
                  className={`stay${s !== stay ? ' active' : ''}`}
                  style={{ ...stayCol(s), background: colorFor(s.location) }}
                  title={`${s.location}｜${rangeLabel(s)}｜${weeks}${s.note ? `\n${s.note}` : ''}`}
                >
                  <span className="handle" data-edge="l" />
                  <span className="label">
                    <strong>{s.location}</strong>
                    <small>{s !== stay ? rangeLabel(s) : `${weeks}${s.note ? ' ・📝' : ''}`}</small>
                  </span>
                  <span className="handle" data-edge="r" />
                </div>
              );
            })}
            {drag?.kind === 'select' && (
              <div className="selection" style={slotCol(drag.lo, drag.hi + 1)}>
                {(drag.hi - drag.lo + 1) / 2} 週
              </div>
            )}
            {editing && !editing.id && <div className="selection" style={stayCol(editing)} />}
          </div>
        </div>
      </div>

      <section className="panels">
        <div className="panel">
          <h2>摘要</h2>
          <p className="stat">
            已安排 <b>{weeksLabel(plannedDays)}</b>・未安排 <b>{weeksLabel(TOTAL_DAYS - plannedDays)}</b>
          </p>
          <ul className="totals">
            {totals.map(([location, days]) => (
              <li key={location}>
                <i style={{ background: colorFor(location) }} />
                {location}
                <span>{weeksLabel(days)}</span>
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
                <li key={s.id} onClick={() => setEditing({ id: s.id, startDay: s.startDay, endDay: s.endDay })}>
                  <i style={{ background: colorFor(s.location) }} />
                  <span className="when">{rangeLabel(s)}</span>
                  <strong>{s.location}</strong>
                  <span className="weeks">{weeksLabel(daysOf(s))}・{daysOf(s)} 天</span>
                  {s.note && <span className="note">{s.note}</span>}
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {editing && (
        <Editor
          key={editing.id ?? `new-${editing.startDay}-${editing.endDay}`}
          editing={editing}
          stay={editingStay}
          others={stays.filter((s) => s.id !== editing.id)}
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
  others: Stay[];
  locations: string[];
  onSave: (location: string, note: string, range: DayRange) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { editing, stay, others, locations, onSave, onDelete, onClose } = props;
  const [location, setLocation] = useState(stay?.location ?? '');
  const [note, setNote] = useState(stay?.note ?? '');
  const [start, setStart] = useState(isoOfDay(editing.startDay));
  const [end, setEnd] = useState(isoOfDay(editing.endDay));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const startDay = dayOfIso(start);
  const endDay = dayOfIso(end);
  let range: DayRange | null = null;
  let error = '';
  if (startDay === null || endDay === null) {
    error = `日期需在 ${isoOfDay(0)} 到 ${isoOfDay(TOTAL_DAYS - 1)} 之間。`;
  } else if (startDay > endDay) {
    error = '結束日不能早於開始日。';
  } else {
    range = { startDay, endDay };
    const clash = others.find((o) => overlaps(o, range!));
    if (clash) {
      error = `與「${clash.location}」（${rangeLabel(clash)}）重疊。`;
      range = null;
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const name = location.trim();
    if (name && range) onSave(name, note.trim(), range);
  }

  return (
    <div className="backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="editor" onSubmit={submit}>
        <h2>{stay ? '編輯行程' : '新增行程'}</h2>
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
        <div className="dates">
          <label>
            開始日
            <input type="date" value={start} min={isoOfDay(0)} max={isoOfDay(TOTAL_DAYS - 1)} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label>
            結束日
            <input type="date" value={end} min={isoOfDay(0)} max={isoOfDay(TOTAL_DAYS - 1)} onChange={(e) => setEnd(e.target.value)} />
          </label>
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
          <button type="submit" className="primary" disabled={!location.trim() || !range}>
            儲存
          </button>
        </div>
      </form>
    </div>
  );
}
