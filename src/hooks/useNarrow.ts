import { useSyncExternalStore } from 'react';

// Phone-sized screens get the read-only layout: narrow ones, and touch screens too short to be anything but a
// phone on its side (a large phone held sideways is wider than 720px). The narrow-screen CSS uses the same query.
export const NARROW_QUERY = '(max-width: 720px), (pointer: coarse) and (max-height: 500px)';

export function useNarrow(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(NARROW_QUERY);
      mq.addEventListener('change', notify);
      return () => mq.removeEventListener('change', notify);
    },
    () => window.matchMedia(NARROW_QUERY).matches,
  );
}
