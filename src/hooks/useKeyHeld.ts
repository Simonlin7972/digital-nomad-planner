import { useEffect, useState } from 'react';

// Whether a letter key is being held down, for hold-to-use tools (B to cut). Not while typing in a field, and not
// as part of a shortcut with ⌘ / Ctrl / Alt. Released on key-up or when the window loses focus.
export function useKeyHeld(key: string): boolean {
  const [held, setHeld] = useState(false);
  useEffect(() => {
    const typing = (e: KeyboardEvent) =>
      e.target instanceof Element && Boolean(e.target.closest('input, textarea, select, [contenteditable]'));
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== key || e.metaKey || e.ctrlKey || e.altKey || typing(e)) return;
      setHeld(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === key) setHeld(false);
    };
    const release = () => setHeld(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', release);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', release);
    };
  }, [key]);
  return held;
}
