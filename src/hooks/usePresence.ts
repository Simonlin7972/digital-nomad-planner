import { useEffect, useState } from 'react';

// Keeps something on screen for a moment after it is told to go, so it can play an exit animation. `open` is
// whether it should be there; `shown` is whether to render it, and `leaving` is true for the exit, when the
// element gets the .leaving class and its stylesheet plays the animation (styles/base.css, components/Dialog.css).
// How long the exit lasts comes from the --dur-exit token, which the reduced-motion media query sets to zero, so
// there is nothing to keep in sync and no animation event to wait for.
export function usePresence(open: boolean): { shown: boolean; leaving: boolean } {
  // Derived from `open` during render (not in an effect), so the first render after a close already keeps the
  // element mounted instead of unmounting it for a frame.
  const [state, setState] = useState({ open, leaving: false });
  if (state.open !== open) setState({ open, leaving: !open && exitMs() > 0 });
  const leaving = !open && state.leaving;
  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => setState((s) => ({ ...s, leaving: false })), exitMs());
    return () => clearTimeout(timer);
  }, [leaving]);
  return { shown: open || leaving, leaving };
}

// The --dur-exit token in milliseconds; zero when the stylesheet (or reduced motion) says exits are instant.
export function exitMs(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--dur-exit').trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return 0;
  return raw.endsWith('ms') ? n : n * 1000;
}
