import { flushSync } from 'react-dom';

// Runs a plan change as a view transition where the browser has them: the stays carry view-transition-names
// (the timeline blocks, the month bars, the list rows), so after an undo, an edit, a cut or an import they slide
// to where they now are instead of jumping. The change is flushed inside the callback so the new layout is in
// the DOM when the browser takes its second snapshot. Elsewhere, and under reduced motion, the change just runs.
export function withTransition(update: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!doc.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return update();
  const transition = doc.startViewTransition(() => flushSync(update)) as { ready?: Promise<void> };
  // A transition the browser skips (a hidden tab, another one starting) rejects `ready`; the update still ran.
  transition.ready?.catch(() => {});
}

// A view-transition-name is a CSS identifier; stay ids are UUIDs (and the drag's copy id), which are fine, but
// anything imported from an older file could be odd, so unsafe characters are dropped.
export function transitionName(prefix: string, id: string): string {
  return `${prefix}-${id.replace(/[^\w-]/g, '')}`;
}
