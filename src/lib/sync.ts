// The cloud sync's bookkeeping and decisions, with no network and no React in them (that is lib/cloud.ts and
// hooks/useCloudSync.ts). What this browser last agreed with the cloud on is kept in `dnp-sync`: per year the
// plan's fingerprint and the row's updated_at, the same for the settings, and whether the person put off
// choosing between two different copies. From that and the two current sides, `decidePlans` says what to push,
// pull or ask about; `decideSettings` does the same for the one settings row.

export type SyncRecord = {
  hash: string; // fingerprint of the content both sides had
  updatedAt: string; // the cloud row's updated_at at that moment
};

export type SyncState = {
  plans: Record<string, SyncRecord>; // by year
  settings: SyncRecord | null;
  // When this browser's copy first drifted from the record, per year: the local side of last-write-wins.
  dirtySince: Record<string, number>;
  settingsDirtySince: number | null;
  paused: boolean; // a first sign-in found two different copies and the person chose "later"
};

const KEY = 'dnp-sync';

export const EMPTY_SYNC: SyncState = { plans: {}, settings: null, dirtySince: {}, settingsDirtySince: null, paused: false };

// null when this browser has never synced: a first sign-in.
export function loadSync(): SyncState | null {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<SyncState> | null;
    if (!raw || typeof raw !== 'object') return null;
    return {
      plans: raw.plans && typeof raw.plans === 'object' ? raw.plans : {},
      settings: raw.settings && typeof raw.settings === 'object' ? raw.settings : null,
      dirtySince: raw.dirtySince && typeof raw.dirtySince === 'object' ? raw.dirtySince : {},
      settingsDirtySince: typeof raw.settingsDirtySince === 'number' ? raw.settingsDirtySince : null,
      paused: raw.paused === true,
    };
  } catch {
    return null;
  }
}

export function saveSync(state: SyncState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage unavailable: the next sign-in is treated as the first again, which only means one more check
  }
}

export function clearSync() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}

// One side of a year. Locally, nothing means the year has no stays. In the cloud a row stays once made (an
// emptied year is an empty row, hash '', so the emptying reaches other devices); a row that is gone altogether
// means the cloud data was deleted, and that never takes a plan away from a device.
export type LocalSide = { hash: string; count: number } | null;
export type CloudSide = { hash: string; count: number; updatedAt: string } | null;

export const EMPTY_HASH = ''; // a year with no stays, on either side

export type PlanDecision = {
  push: number[]; // this browser's copy goes up (an empty local year writes an empty row)
  pull: number[]; // the cloud's copy comes down (an empty row clears the local year)
  conflict: number[]; // both have a plan, they differ, and nothing says which is right: ask
};

// `local` and `cloud` hold every year either side knows about. `last` is the record from the previous sync, or
// null on a first sign-in.
export function decidePlans(local: Map<number, LocalSide>, cloud: Map<number, CloudSide>, last: SyncState | null): PlanDecision {
  const out: PlanDecision = { push: [], pull: [], conflict: [] };
  const years = new Set([...local.keys(), ...cloud.keys()]);
  for (const year of [...years].sort()) {
    const l = local.get(year) ?? null;
    const c = cloud.get(year) ?? null;
    const lh = l?.hash ?? EMPTY_HASH;
    const ch = c?.hash ?? EMPTY_HASH;
    if (lh === ch) continue; // same content, or both empty
    const record = last?.plans[year];
    if (!record) {
      // Never agreed on this year before: one side having it is a copy, both having it is a question.
      if (lh !== EMPTY_HASH && ch !== EMPTY_HASH) out.conflict.push(year);
      else if (lh !== EMPTY_HASH) out.push.push(year);
      else out.pull.push(year);
      continue;
    }
    if (!c) {
      // The row is gone (cloud data deleted elsewhere): put this copy back rather than lose it.
      if (lh !== EMPTY_HASH) out.push.push(year);
      continue;
    }
    const localChanged = lh !== record.hash;
    const cloudChanged = c.updatedAt !== record.updatedAt;
    if (localChanged && !cloudChanged) out.push.push(year);
    else if (!localChanged && cloudChanged) out.pull.push(year);
    else {
      // Both moved on since the record. The later change wins; with no local timestamp the cloud does.
      const since = last?.dirtySince[year];
      if (since !== undefined && since > Date.parse(c.updatedAt)) out.push.push(year);
      else out.pull.push(year);
    }
  }
  return out;
}

export type SettingsDecision = 'push' | 'pull' | 'none';

// The settings never ask: on a first sign-in the cloud's copy wins when there is one, since it was saved on
// purpose on some device; afterwards the later change wins like a plan.
export function decideSettings(localHash: string, cloud: { hash: string; updatedAt: string } | null, last: SyncState | null): SettingsDecision {
  if (cloud && cloud.hash === localHash) return 'none';
  const record = last?.settings;
  if (!record) return cloud ? 'pull' : 'push';
  const localChanged = localHash !== record.hash;
  const cloudChanged = (cloud?.updatedAt ?? null) !== record.updatedAt;
  if (localChanged && !cloudChanged) return 'push';
  if (!localChanged && cloudChanged) return cloud ? 'pull' : 'push';
  if (!localChanged && !cloudChanged) return 'none';
  const since = last?.settingsDirtySince;
  return cloud && !(since !== null && since !== undefined && since > Date.parse(cloud.updatedAt)) ? 'pull' : 'push';
}

// Notes that a year's local copy differs from the record, keeping the first time that was seen.
export function markDirty(state: SyncState, year: number, now: number): SyncState {
  if (state.dirtySince[year] !== undefined) return state;
  return { ...state, dirtySince: { ...state.dirtySince, [year]: now } };
}

// Records that a year matches the cloud row with this updated_at (after a push or a pull); null forgets the year.
export function agreed(state: SyncState, year: number, record: SyncRecord | null): SyncState {
  const plans = { ...state.plans };
  if (record) plans[year] = record;
  else delete plans[year];
  const dirtySince = { ...state.dirtySince };
  delete dirtySince[year];
  return { ...state, plans, dirtySince };
}

export function agreedSettings(state: SyncState, record: SyncRecord | null): SyncState {
  return { ...state, settings: record, settingsDirtySince: null };
}
