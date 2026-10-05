import { useSyncExternalStore } from 'react';

// Phone-width screens get the read-only layout. Same breakpoint as the narrow-screen CSS.
const QUERY = '(max-width: 720px)';

export function useNarrow(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(QUERY);
      mq.addEventListener('change', notify);
      return () => mq.removeEventListener('change', notify);
    },
    () => window.matchMedia(QUERY).matches,
  );
}
