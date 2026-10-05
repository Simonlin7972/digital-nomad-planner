// Remembers what was last exported, so the page can nudge when the plan has gone a while without a backup.
// Kept per browser like the other preferences; it is not part of the plan, the export or the undo history.
import { serialize, type Stay } from './storage';

export const REMIND_AFTER_DAYS = 7; // unbacked changes this old bring up the reminder
export const SNOOZE_DAYS = 3;
const DAY_MS = 86_400_000;
const KEY = 'dnp-backup';

export type BackupState = {
  hash: string | null; // fingerprint of the plan as last exported or imported
  at: number | null; // when that was
  dirtySince: number | null; // when the plan first differed from it
  snoozeUntil: number | null;
};

const EMPTY: BackupState = { hash: null, at: null, dirtySince: null, snoozeUntil: null };
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

export function loadBackup(): BackupState {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Record<string, unknown> | null;
    if (!raw || typeof raw !== 'object') return EMPTY;
    return {
      hash: typeof raw.hash === 'string' ? raw.hash : null,
      at: num(raw.at),
      dirtySince: num(raw.dirtySince),
      snoozeUntil: num(raw.snoozeUntil),
    };
  } catch {
    return EMPTY;
  }
}

export function saveBackup(state: BackupState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage unavailable: the reminder just won't remember
  }
}

// A short fingerprint of the plan's content (FNV-1a over the export form), independent of stay order.
export function planHash(stays: Stay[]): string {
  const text = JSON.stringify(serialize([...stays].sort((a, b) => a.startDay - b.startDay)));
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

// Brings the record up to date with the current plan: starts or stops the "changed since backup" clock.
export function track(state: BackupState, stays: Stay[], now: number): BackupState {
  const dirty = stays.length > 0 && planHash(stays) !== state.hash;
  if (!dirty) return state.dirtySince === null ? state : { ...state, dirtySince: null };
  return state.dirtySince === null ? { ...state, dirtySince: now } : state;
}

export const backedUp = (stays: Stay[], now: number): BackupState => ({
  hash: planHash(stays),
  at: now,
  dirtySince: null,
  snoozeUntil: null,
});

export const snoozed = (state: BackupState, now: number): BackupState => ({ ...state, snoozeUntil: now + SNOOZE_DAYS * DAY_MS });

export function shouldRemind(state: BackupState, now: number): boolean {
  if (state.dirtySince === null) return false;
  if (state.snoozeUntil !== null && now < state.snoozeUntil) return false;
  return now - state.dirtySince >= REMIND_AFTER_DAYS * DAY_MS;
}

// Whole days since the last backup, or null if there has never been one.
export const daysSinceBackup = (state: BackupState, now: number) =>
  state.at === null ? null : Math.max(0, Math.floor((now - state.at) / DAY_MS));
