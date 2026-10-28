// Remembers what was last exported, so the page can nudge when the plan has gone a while without a backup.
// Kept per browser like the other preferences; it is not part of the plan, the export or the undo history.
import { serialize, type Stay } from './storage';
import { getProfile } from './profile';
import { YEAR, inYear } from './weeks';

export const SNOOZE_DAYS = 3;
const DAY_MS = 86_400_000;
// One record per year, like the plans. 2027's record predates multiple years and kept the plain key.
const key = () => (YEAR === 2027 ? 'dnp-backup' : `dnp-backup-${YEAR}`);

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
    const raw = JSON.parse(localStorage.getItem(key()) ?? 'null') as Record<string, unknown> | null;
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
    localStorage.setItem(key(), JSON.stringify(state));
  } catch {
    // storage unavailable: the reminder just won't remember
  }
}

// A short fingerprint of some text (FNV-1a), for telling "the same" from "changed" without keeping a copy.
export function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

// A short fingerprint of the plan's content (over the export form), independent of stay order. The cloud sync
// compares plans by it too, so it must only depend on what `serialize` writes.
export const planHash = (stays: Stay[]): string => fnv1a(JSON.stringify(serialize([...stays].sort((a, b) => a.startDay - b.startDay))));

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

// Records another year's plan as backed up (the current year's goes through useBackupReminder).
export const markYearBackedUp = (year: number, stays: Stay[], now: number) => inYear(year, () => saveBackup(backedUp(stays, now)));

export const snoozed = (state: BackupState, now: number): BackupState => ({ ...state, snoozeUntil: now + SNOOZE_DAYS * DAY_MS });

export function shouldRemind(state: BackupState, now: number): boolean {
  if (state.dirtySince === null) return false;
  if (state.snoozeUntil !== null && now < state.snoozeUntil) return false;
  // How old unbacked changes must be, from the profile (7 days unless changed); 0 turns the reminder off.
  const after = getProfile().backupDays;
  return after > 0 && now - state.dirtySince >= after * DAY_MS;
}

// Whole days since the last backup, or null if there has never been one.
export const daysSinceBackup = (state: BackupState, now: number) =>
  state.at === null ? null : Math.max(0, Math.floor((now - state.at) / DAY_MS));
