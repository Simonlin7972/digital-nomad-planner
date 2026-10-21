import { useEffect, useRef, useState } from 'react';

// A number that rolls to each new value over `ms` instead of jumping: the totals in the summary. The first value
// shows at once, and so does every value when the system asks for reduced motion.
export function useTween(value: number, ms = 350): number {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const shownRef = useRef(shown);
  shownRef.current = shown;
  useEffect(() => {
    if (value === from.current) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const base = from.current;
    let frame = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      const eased = 1 - (1 - p) * (1 - p) * (1 - p); // ease-out cubic
      const next = base + (value - base) * eased;
      setShown(p < 1 ? next : value);
      if (p < 1) frame = requestAnimationFrame(step);
      else from.current = value;
    };
    frame = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frame);
      // Interrupted midway: carry on from where the roll had got to.
      from.current = shownRef.current;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `ms` is fixed per call site
  }, [value]);
  return shown;
}
