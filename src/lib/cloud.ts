// The cloud copy: Google sign-in and the two tables in the `nomad` schema of a Supabase project shared with
// Wordrobe (docs/nomad-schema.sql). Signed out, nothing here is called and nothing leaves the browser; signed in,
// each year's plan is one row holding the export form (`serialize`), and the profile is one row holding
// `Profile`. localStorage stays the working copy either way: this is a second copy, not a replacement.
//
// The anon key is a public key by design (Supabase's publishable key); row level security is what keeps one
// person's rows from another. Keeping it here, like the report address in report.ts, saves a build secret.
//
// supabase-js is loaded on demand (`client()`), never statically: it is a large library and most visitors never
// sign in. Only a type is imported here, which the build erases.

import type { Session } from '@supabase/supabase-js';
import { fnv1a, planHash } from './backup';
import { DEFAULT_PROFILE, getProfile, sanitizeProfile, saveProfile, type Profile } from './profile';
import { loadYearPlan, sanitize, serialize, type Stay } from './storage';
import { YEARS, inYear } from './weeks';
import { EMPTY_HASH, EMPTY_SYNC, agreedSettings, decideSettings, type CloudSide, type LocalSide, type SyncState } from './sync';

const SUPABASE_REF = 'qdjungqzeovpdnrijyls';
const SUPABASE_URL = `https://${SUPABASE_REF}.supabase.co`;
// Where supabase-js keeps the session: this key (chunked as `.0`, `.1`… when large). Its PKCE code verifier is
// `<key>-code-verifier`, which a sign-in that never came back leaves behind, so that one doesn't count.
const AUTH_KEY = `sb-${SUPABASE_REF}-auth-token`;
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkanVuZ3F6ZW92cGRucmlqeWxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3Njk0MjEsImV4cCI6MjA1OTM0NTQyMX0.p55IfEzshqh3awQFN7DLTncLueh1WdtEb9wBzmlLe18';

// The code that Google's redirect brought back, taken out of the address before anything else reads it.
let pendingCode: string | null = null;
let pendingError: string | null = null;

// Runs before analytics (main.tsx, profile/main.tsx): the sign-in code in `?code=` must be out of the address
// before the page view is recorded, for the same reason the transfer link's plan is. The client below is told
// not to look at the address itself; `finishSignIn` exchanges the code.
export function takeAuthCode() {
  const url = new URL(location.href);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  if (!code && !error) return;
  pendingCode = code;
  pendingError = error ? url.searchParams.get('error_description') ?? error : null;
  for (const key of ['code', 'error', 'error_code', 'error_description', 'state']) url.searchParams.delete(key);
  history.replaceState(history.state, '', url.toString());
}

// Cheap and synchronous: is there anything that could turn into a session? A stored session (possibly expired:
// the library decides that), or a sign-in code just brought back from Google. When neither, the library is
// never loaded.
function mightBeSignedIn(): boolean {
  if (pendingCode) return true;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key === AUTH_KEY || key.startsWith(`${AUTH_KEY}.`))) return true;
    }
  } catch {
    // storage blocked: treat as signed out
  }
  return false;
}

type Supabase = typeof import('@supabase/supabase-js');

// One client for the page, made the first time something needs it. Every query is against the nomad schema; the
// session lives in localStorage under the project's own key (AUTH_KEY), apart from the plan.
function makeClient({ createClient }: Supabase) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    db: { schema: 'nomad' },
    auth: { flowType: 'pkce', detectSessionInUrl: false },
  });
}
type Client = ReturnType<typeof makeClient>;

let clientPromise: Promise<Client> | null = null;
function client(): Promise<Client> {
  clientPromise ??= import('@supabase/supabase-js').then(makeClient);
  return clientPromise;
}

// Completes a sign-in that `takeAuthCode` found in the address: null when there was none.
export async function finishSignIn(): Promise<'ok' | 'failed' | null> {
  if (pendingError) {
    pendingError = null;
    return 'failed';
  }
  if (!pendingCode) return null;
  const code = pendingCode;
  // The code stays pending until the library is here: the hooks call `onSession` right after this, and it must
  // still see a reason to load.
  const supabase = await client();
  pendingCode = null;
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return error ? 'failed' : 'ok';
}

// Leaves for Google; the browser comes back to this same page (/app/ or /profile/), which must be on the
// project's redirect list. This is where a signed-out visitor first loads the library.
export async function signIn() {
  const supabase = await client();
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${location.origin}${location.pathname}` },
  });
}

// This device only: the other devices stay signed in.
export async function signOut() {
  const supabase = await client();
  return supabase.auth.signOut({ scope: 'local' });
}

// The current session now, then every change. Returns the unsubscribe. With nothing in storage and no sign-in
// code, the answer is null at once and the library stays unloaded (a later `signIn` reloads the page through
// Google, so this subscription never has to learn about it).
export function onSession(cb: (session: Session | null) => void): () => void {
  if (!mightBeSignedIn()) {
    cb(null);
    return () => {};
  }
  let off: (() => void) | null = null;
  let stopped = false;
  void client().then((supabase) => {
    if (stopped) return;
    void supabase.auth.getSession().then(({ data }) => !stopped && cb(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
    off = () => data.subscription.unsubscribe();
  });
  return () => {
    stopped = true;
    off?.();
  };
}

export type CloudPlanRow = { year: number; data: unknown; updatedAt: string };

export async function fetchPlans(): Promise<CloudPlanRow[]> {
  const supabase = await client();
  const { data, error } = await supabase.from('plans').select('year, data, updated_at');
  if (error) throw error;
  return (data ?? []).map((r) => ({ year: r.year as number, data: r.data, updatedAt: r.updated_at as string }));
}

// Writes one year and returns the row's updated_at. The export form is built with that year's date model.
export async function upsertPlan(userId: string, year: number, stays: Stay[]): Promise<string> {
  const data = inYear(year, () => serialize([...stays].sort((a, b) => a.startDay - b.startDay)));
  const supabase = await client();
  const { data: row, error } = await supabase
    .from('plans')
    .upsert({ user_id: userId, year, data }, { onConflict: 'user_id,year' })
    .select('updated_at')
    .single();
  if (error) throw error;
  return row.updated_at as string;
}

export type CloudSettingsRow = { data: unknown; updatedAt: string };

export async function fetchSettings(): Promise<CloudSettingsRow | null> {
  const supabase = await client();
  const { data, error } = await supabase.from('settings').select('data, updated_at').maybeSingle();
  if (error) throw error;
  return data ? { data: data.data, updatedAt: data.updated_at as string } : null;
}

export async function upsertSettings(userId: string, profile: Profile): Promise<string> {
  const supabase = await client();
  const { data: row, error } = await supabase
    .from('settings')
    .upsert({ user_id: userId, data: profile }, { onConflict: 'user_id' })
    .select('updated_at')
    .single();
  if (error) throw error;
  return row.updated_at as string;
}

// Everything this person has in the cloud (RLS limits it to their own rows), then every device's session, so no
// other device puts its copy back up.
export async function deleteCloudData(userId: string) {
  const supabase = await client();
  const plans = await supabase.from('plans').delete().eq('user_id', userId);
  if (plans.error) throw plans.error;
  const settings = await supabase.from('settings').delete().eq('user_id', userId);
  if (settings.error) throw settings.error;
  await supabase.auth.signOut({ scope: 'global' });
}

// Calls back whenever one of this person's rows changes on the server (another device wrote). Returns the
// unsubscribe. Only called with a session, so the library is already loaded; the await is for the type.
export function onCloudChange(userId: string, cb: () => void): () => void {
  let off: (() => void) | null = null;
  let stopped = false;
  void client().then((supabase) => {
    if (stopped) return;
    const channel = supabase
      .channel(`nomad-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'nomad', table: 'plans', filter: `user_id=eq.${userId}` }, cb)
      .on('postgres_changes', { event: '*', schema: 'nomad', table: 'settings', filter: `user_id=eq.${userId}` }, cb)
      .subscribe();
    off = () => void supabase.removeChannel(channel);
  });
  return () => {
    stopped = true;
    off?.();
  };
}

// A year's fingerprint on either side: '' with no stays, else over the export form.
export const yearHash = (year: number, stays: Stay[]) => (stays.length ? inYear(year, () => planHash(stays)) : EMPTY_HASH);

// The two sides of every year, in the form `decidePlans` compares. The year on screen is passed in, since its
// latest state is in App rather than in storage. Years with no stays are left out (that is what empty means).
export function localSides(current: { year: number; stays: Stay[] }): Map<number, LocalSide> {
  const out = new Map<number, LocalSide>();
  for (const year of YEARS) {
    const stays = year === current.year ? current.stays : loadYearPlan(year);
    if (stays.length) out.set(year, { hash: yearHash(year, stays), count: stays.length });
  }
  return out;
}

// A cloud row read back as stays, cleaned the way a file import is, and fingerprinted the same way as a local
// plan so identical copies compare equal.
export function readCloudPlan(row: CloudPlanRow): Stay[] {
  return inYear(row.year, () => sanitize(row.data));
}

// Every row, including empty ones (an emptied year), so the row's updated_at can be compared.
export function cloudSides(rows: CloudPlanRow[]): Map<number, CloudSide> {
  const out = new Map<number, CloudSide>();
  for (const row of rows) {
    if (!(YEARS as readonly number[]).includes(row.year)) continue;
    const stays = readCloudPlan(row);
    out.set(row.year, { hash: yearHash(row.year, stays), count: stays.length, updatedAt: row.updatedAt });
  }
  return out;
}

// The profile's fingerprint, over its cleaned form so field order can't make two equal profiles differ.
export const profileHash = (profile: Profile) => fnv1a(JSON.stringify(sanitizeProfile(profile)));
export const localProfileHash = () => profileHash(getProfile());
export const cloudProfile = (row: CloudSettingsRow) => sanitizeProfile(row.data);

// Brings the settings row and this browser's profile into step: the planner does it on every sync, the settings
// page on load. A pull writes the profile to storage and returns it, so the page can show it; a push needs
// `canPush` (phones only push on their first sign-in). Returns the state to keep.
export async function reconcileSettings(
  userId: string,
  last: SyncState | null,
  canPush: boolean,
): Promise<{ state: SyncState; pulled: Profile | null }> {
  const state = last ?? EMPTY_SYNC;
  const row = await fetchSettings();
  const local = getProfile();
  const localHash = profileHash(local);
  // Nothing saved anywhere yet: no row to make.
  if (!row && localHash === profileHash(DEFAULT_PROFILE)) return { state, pulled: null };
  const cloud = row ? { hash: profileHash(cloudProfile(row)), updatedAt: row.updatedAt } : null;
  const decision = decideSettings(localHash, cloud, last);
  if (decision === 'pull' && row && cloud) {
    const profile = cloudProfile(row);
    saveProfile(profile);
    return { state: agreedSettings(state, cloud), pulled: profile };
  }
  if (decision === 'push' && canPush) {
    const updatedAt = await upsertSettings(userId, local);
    return { state: agreedSettings(state, { hash: localHash, updatedAt }), pulled: null };
  }
  if (decision === 'none' && cloud) return { state: agreedSettings(state, cloud), pulled: null };
  return { state, pulled: null };
}
