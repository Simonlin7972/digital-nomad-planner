import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import * as cloud from '../lib/cloud';
import type { Profile } from '../lib/profile';
import { EMPTY_SYNC, clearSync, loadSync, saveSync, type SyncState } from '../lib/sync';

export type SettingsSyncStatus = 'off' | 'synced' | 'syncing' | 'error';

const PUSH_DEBOUNCE_MS = 600;

// The settings page's side of the cloud sync: sign in and out, bring the settings row and this browser's profile
// into step on load, and push each change. Plans are the planner's business (useCloudSync); this hook only
// touches the settings part of the shared `dnp-sync` record, re-reading the rest so a planner tab's bookkeeping
// isn't overwritten.
export function useSettingsSync(onPulled: (profile: Profile) => void) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SettingsSyncStatus>('off');
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [signInFailed, setSignInFailed] = useState(false);
  const stateRef = useRef<SyncState | null>(null);
  const pulled = useRef(onPulled);
  pulled.current = onPulled;
  const timer = useRef(0);

  const commit = (state: SyncState) => {
    stateRef.current = state;
    const current = loadSync() ?? EMPTY_SYNC;
    saveSync({ ...current, settings: state.settings, settingsDirtySince: state.settingsDirtySince });
  };

  const reconcile = useCallback(async (user: Session['user']) => {
    setStatus('syncing');
    try {
      const result = await cloud.reconcileSettings(user.id, stateRef.current, true);
      commit(result.state);
      if (result.pulled) pulled.current(result.pulled);
      setLastSyncAt(Date.now());
      setStatus('synced');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void cloud.finishSignIn().then((result) => result === 'failed' && setSignInFailed(true));
    return cloud.onSession((next) => {
      setSession((prev) => (prev?.user.id === next?.user.id && prev?.access_token === next?.access_token ? prev : next));
      if (!next) {
        stateRef.current = null;
        setStatus('off');
        return;
      }
      stateRef.current = loadSync();
      void reconcile(next.user);
    });
  }, [reconcile]);

  // After a change was saved locally: push it once the typing pauses.
  const push = useCallback(() => {
    const user = session?.user;
    if (!user) return;
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void reconcile(user), PUSH_DEBOUNCE_MS);
  }, [session, reconcile]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const signOut = useCallback(async () => {
    await cloud.signOut();
    clearSync();
  }, []);

  const deleteCloud = useCallback(async () => {
    if (!session) return;
    await cloud.deleteCloudData(session.user.id);
    await signOut();
  }, [session, signOut]);

  return {
    session,
    status: session ? status : 'off',
    lastSyncAt,
    signInFailed,
    clearSignInFailed: () => setSignInFailed(false),
    signIn: () => void cloud.signIn(),
    signOut,
    deleteCloud,
    push,
  };
}
