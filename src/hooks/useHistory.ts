import { useState } from 'react';

type History<T> = { past: T[]; present: T; future: T[] };

// A value with an undo stack. Every change made through `set` can be undone; `limit` caps how far back.
export function useHistory<T>(initial: () => T, limit = 100) {
  const [history, setHistory] = useState<History<T>>(() => ({ past: [], present: initial(), future: [] }));

  const set = (update: T | ((prev: T) => T)) =>
    setHistory((h) => {
      const next = typeof update === 'function' ? (update as (prev: T) => T)(h.present) : update;
      if (next === h.present) return h;
      return { past: [...h.past, h.present].slice(-limit), present: next, future: [] };
    });
  const undo = () =>
    setHistory((h) =>
      h.past.length ? { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] } : h,
    );
  const redo = () =>
    setHistory((h) =>
      h.future.length ? { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) } : h,
    );

  return { present: history.present, set, undo, redo, canUndo: history.past.length > 0, canRedo: history.future.length > 0 };
}
