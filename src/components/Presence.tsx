import { useRef, type ReactNode } from 'react';
import { usePresence } from '../hooks/usePresence';

// Wraps something rendered conditionally (a dialog, a hover card, the backup reminder) so it can leave with an
// animation: while `show` is false it keeps rendering the last children it was given, inside a wrapper carrying
// .leaving, until the exit is over. The wrapper is a box-less `display: contents` div unless given a class.
export function Presence({ show, className, children }: { show: boolean; className?: string; children: ReactNode }) {
  const { shown, leaving } = usePresence(show);
  const last = useRef(children);
  if (show) last.current = children;
  if (!shown) return null;
  return <div className={`${className ?? 'presence'}${leaving ? ' leaving' : ''}`}>{last.current}</div>;
}
