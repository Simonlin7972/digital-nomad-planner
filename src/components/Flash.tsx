import type { Stay } from '../lib/storage';

// Which stays just changed, so the views can draw a ring on them for a moment (.flash in styles/base.css). `n`
// counts flashes: it keys the ring element, so a second change to the same stay restarts the animation.
export type Flash = { ids: Set<string>; n: number };

// The ring itself: an empty element over the stay's box, or nothing when this stay didn't change.
export function FlashRing({ flash, id }: { flash: Flash | null | undefined; id: string }) {
  if (!flash?.ids.has(id)) return null;
  return <i key={flash.n} className="flash" aria-hidden="true" />;
}

// The ids in `next` that are new or differ from `prev` in anything the user can see or edit.
export function changedIds(prev: Stay[], next: Stay[]): string[] {
  const before = new Map(prev.map((s) => [s.id, stayKey(s)]));
  return next.filter((s) => before.get(s.id) !== stayKey(s)).map((s) => s.id);
}

function stayKey(s: Stay): string {
  return JSON.stringify([s.startDay, s.endDay, s.country, s.city, s.color ?? null, s.companions ?? null, s.note ?? null, s.ticket ?? null]);
}
