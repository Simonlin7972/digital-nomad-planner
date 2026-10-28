import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { planHash } from '../lib/backup';
import * as cloud from '../lib/cloud';
import { loadYearPlan, type Stay } from '../lib/storage';
import { EMPTY_HASH, EMPTY_SYNC, agreed, clearSync, decidePlans, loadSync, markDirty, saveSync, type SyncState } from '../lib/sync';
import { YEAR } from '../lib/weeks';

export type SyncStatus = 'off' | 'synced' | 'syncing' | 'offline' | 'error' | 'paused';
// One year both sides have, differently: what the dialog shows.
export type ConflictYear = { year: number; local: number; cloud: number; cloudUpdatedAt: string };
export type ConflictChoice = 'cloud' | 'local' | 'later';

type Options = {
  stays: Stay[];
  readOnly: boolean; // a phone: pulls only, except on its first sign-in, which may carry a plan up
  onPull: (plans: Map<number, Stay[]>) => void; // years to replace locally; an empty array clears the year
  onPushed: () => void; // a push is a backup
  onProfilePulled: () => void; // the settings came down: anything showing them should read them again
  onExportFirst: () => void; // the cloud is about to replace a differing local plan: keep a file of it
};

const PUSH_DEBOUNCE_MS = 1500;
const ECHO_MS = 3000; // our own writes come back on the change feed; ignore it that long after a push

// Keeps the signed-in person's plans and settings in step with the cloud (lib/cloud.ts), deciding with
// lib/sync.ts. Local changes go up after a short pause; the cloud is read again on sign-in, when the tab comes
// back to the front, when the network returns and when another device writes. A first sign-in that finds two
// different copies hands them to the caller as `conflict` to ask about; `resolve` applies the answer.
export function useCloudSync({ stays, readOnly, onPull, onPushed, onProfilePulled, onExportFirst }: Options) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SyncStatus>('off');
  const [conflict, setConflict] = useState<ConflictYear[] | null>(null);
  const [paused, setPaused] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [signInFailed, setSignInFailed] = useState(false);

  const staysRef = useRef(stays);
  staysRef.current = stays;
  const callbacks = useRef({ onPull, onPushed, onProfilePulled, onExportFirst });
  callbacks.current = { onPull, onPushed, onProfilePulled, onExportFirst };
  const stateRef = useRef<SyncState | null>(null); // null: never synced in this browser
  const rowsRef = useRef<cloud.CloudPlanRow[] | null>(null); // the cloud as last read
  const busy = useRef(false);
  const queued = useRef<0 | 1 | 2>(0); // a sync asked for while one ran: 1 from cache, 2 with a fresh read
  const lastPushAt = useRef(0);
  const timer = useRef(0);

  const commit = (state: SyncState) => {
    stateRef.current = state;
    saveSync(state);
  };

  const reconcile = useCallback(
    async (fetch: boolean, user: Session['user'] | null = session?.user ?? null) => {
      if (!user) return;
      if (busy.current) {
        queued.current = Math.max(queued.current, fetch ? 2 : 1) as 1 | 2;
        return;
      }
      const last = stateRef.current;
      if (last?.paused) {
        setStatus('paused');
        return;
      }
      busy.current = true;
      setStatus('syncing');
      try {
        if (fetch || !rowsRef.current) rowsRef.current = await cloud.fetchPlans();
        const first = last === null;
        let state = last ?? EMPTY_SYNC;
        const local = cloud.localSides({ year: YEAR, stays: staysRef.current });
        const cloudSides = cloud.cloudSides(rowsRef.current);
        const decision = decidePlans(local, cloudSides, last);
        let pushed = false;

        // Up: the year as it is here, an emptied year as an empty row (rows are never deleted by the sync).
        for (const year of decision.push) {
          if (readOnly && !first) continue;
          const plan = year === YEAR ? staysRef.current : loadYearPlan(year);
          const updatedAt = await cloud.upsertPlan(user.id, year, plan);
          state = agreed(state, year, { hash: local.get(year)?.hash ?? EMPTY_HASH, updatedAt });
          rowsRef.current = [...rowsRef.current.filter((r) => r.year !== year), { year, data: null, updatedAt }];
          pushed = true;
        }

        // Down: the row's stays, or nothing for an empty row.
        const plans = new Map<number, Stay[]>();
        for (const year of decision.pull) {
          const row = rowsRef.current.find((r) => r.year === year);
          const side = cloudSides.get(year);
          if (!row || !side) continue;
          plans.set(year, side.count ? cloud.readCloudPlan(row) : []);
          state = agreed(state, year, { hash: side.hash, updatedAt: side.updatedAt });
        }

        const settings = await cloud.reconcileSettings(user.id, state === EMPTY_SYNC && last === null ? null : state, !readOnly || first);
        state = settings.state;

        // Write the record before handing plans over, so the stays effect sees them as already agreed.
        commit(state);
        if (plans.size) callbacks.current.onPull(plans);
        if (settings.pulled) callbacks.current.onProfilePulled();
        if (pushed) {
          lastPushAt.current = Date.now();
          callbacks.current.onPushed();
        }
        setConflict(
          decision.conflict.length
            ? decision.conflict.map((year) => ({ year, local: local.get(year)!.count, cloud: cloudSides.get(year)!.count, cloudUpdatedAt: cloudSides.get(year)!.updatedAt }))
            : null,
        );
        setLastSyncAt(Date.now());
        setStatus(decision.conflict.length ? 'paused' : 'synced');
      } catch {
        setStatus(navigator.onLine ? 'error' : 'offline');
      } finally {
        busy.current = false;
        if (queued.current) {
          const again = queued.current === 2;
          queued.current = 0;
          void reconcile(again, user);
        }
      }
    },
    // readOnly is fixed for a page load (the layout query), session is passed in or read from state
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readOnly, session],
  );

  // The session: now, and whenever it changes. Signing in starts a sync and the change feed; signing out stops them.
  useEffect(() => {
    void cloud.finishSignIn().then((result) => result === 'failed' && setSignInFailed(true));
    let stop: (() => void) | null = null;
    const off = cloud.onSession((next) => {
      setSession((prev) => (prev?.user.id === next?.user.id && prev?.access_token === next?.access_token ? prev : next));
      stop?.();
      stop = null;
      if (!next) {
        stateRef.current = null;
        rowsRef.current = null;
        setConflict(null);
        setPaused(false);
        setStatus('off');
        return;
      }
      stateRef.current = loadSync();
      setPaused(stateRef.current?.paused ?? false);
      rowsRef.current = null;
      void reconcile(true, next.user);
      const fresh = () => void reconcile(true, next.user);
      const onVisible = () => document.visibilityState === 'visible' && fresh();
      const onChange = () => Date.now() - lastPushAt.current > ECHO_MS && fresh();
      const unsubscribe = cloud.onCloudChange(next.user.id, onChange);
      document.addEventListener('visibilitychange', onVisible);
      window.addEventListener('online', fresh);
      stop = () => {
        unsubscribe();
        document.removeEventListener('visibilitychange', onVisible);
        window.removeEventListener('online', fresh);
      };
    });
    return () => {
      off();
      stop?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once; reconcile reads refs
  }, []);

  // A local change: note when the year drifted, then push after a pause. Phones never push from here.
  useEffect(() => {
    const state = stateRef.current;
    if (!session || !state) return;
    const hash = stays.length ? planHash(stays) : EMPTY_HASH;
    if ((state.plans[YEAR]?.hash ?? EMPTY_HASH) === hash) return;
    commit(markDirty(state, YEAR, Date.now()));
    if (readOnly || state.paused) return;
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void reconcile(false), PUSH_DEBOUNCE_MS);
    return () => clearTimeout(timer.current);
  }, [stays, session, readOnly, reconcile]);

  // The answer to "which copy": apply it to the years that differed, then carry on syncing.
  const resolve = useCallback(
    async (choice: ConflictChoice) => {
      const user = session?.user;
      const years = conflict?.map((c) => c.year) ?? [];
      setConflict(null);
      if (!user || !stateRef.current && choice !== 'later') stateRef.current = stateRef.current ?? EMPTY_SYNC;
      let state = stateRef.current ?? EMPTY_SYNC;
      if (choice === 'later') {
        commit({ ...state, paused: true });
        setPaused(true);
        setStatus('paused');
        return;
      }
      if (!user || !rowsRef.current) return;
      try {
        setStatus('syncing');
        const cloudSides = cloud.cloudSides(rowsRef.current);
        if (choice === 'cloud') {
          callbacks.current.onExportFirst();
          const plans = new Map<number, Stay[]>();
          for (const year of years) {
            const row = rowsRef.current.find((r) => r.year === year);
            const side = cloudSides.get(year);
            if (!row || !side) continue;
            plans.set(year, cloud.readCloudPlan(row));
            state = agreed(state, year, { hash: side.hash, updatedAt: side.updatedAt });
          }
          commit({ ...state, paused: false });
          callbacks.current.onPull(plans);
        } else {
          const local = cloud.localSides({ year: YEAR, stays: staysRef.current });
          for (const year of years) {
            const plan = year === YEAR ? staysRef.current : loadYearPlan(year);
            const side = local.get(year);
            if (!plan.length || !side) continue;
            const updatedAt = await cloud.upsertPlan(user.id, year, plan);
            state = agreed(state, year, { hash: side.hash, updatedAt });
            rowsRef.current = [...rowsRef.current.filter((r) => r.year !== year), { year, data: null, updatedAt }];
          }
          lastPushAt.current = Date.now();
          commit({ ...state, paused: false });
          callbacks.current.onPushed();
        }
        setPaused(false);
        setStatus('synced');
        void reconcile(true, user);
      } catch {
        setStatus(navigator.onLine ? 'error' : 'offline');
      }
    },
    [conflict, session, reconcile],
  );

  // "Choose" on the paused strip: look again and ask again.
  const resume = useCallback(() => {
    if (stateRef.current) commit({ ...stateRef.current, paused: false });
    setPaused(false);
    void reconcile(true);
  }, [reconcile]);

  const signOut = useCallback(async () => {
    await cloud.signOut();
    clearSync();
  }, []);

  // Deletes every row, then signs out: staying signed in would only copy the plan up again on the next change.
  const deleteCloud = useCallback(async () => {
    if (!session) return;
    await cloud.deleteCloudData(session.user.id);
    await signOut();
  }, [session, signOut]);

  return {
    session,
    status: session ? (paused ? 'paused' : status) : 'off',
    conflict,
    paused,
    lastSyncAt,
    signInFailed,
    clearSignInFailed: () => setSignInFailed(false),
    signIn: () => void cloud.signIn(),
    signOut,
    deleteCloud,
    resolve,
    resume,
  };
}
