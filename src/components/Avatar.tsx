import { useMemo } from 'react';
import { SIZE, compose, runs, type Avatar as AvatarData, type Pose, type Slot } from '../lib/avatar';
import './Avatar.css';

type Run = ReturnType<typeof runs>[number];
type View = NonNullable<Pose['view']>;

// One pose as runs of colour, plus the rows that change when the eyes close.
function frames(avatar: AvatarData, pose: Pose) {
  const a = compose(avatar, pose);
  const b = compose(avatar, { ...pose, blink: true });
  const changed = new Set(b.flatMap((row, y) => (row.some((c, x) => c !== a[y][x]) ? [y] : [])));
  return { open: runs(a), blink: runs(b, changed) };
}

// The layers of a normal (unfocused) avatar: one still, or the four poses of the idle loop.
function still(avatar: AvatarData, animate: boolean, view: View) {
  if (!animate) return [{ className: undefined as string | undefined, ...frames(avatar, { view }) }];
  return [
    { className: 'avatar-high', ...frames(avatar, { only: 'figure', view }) },
    { className: 'avatar-low', ...frames(avatar, { only: 'figure', dip: true, view }) },
    { className: 'avatar-still', open: runs(compose(avatar, { only: 'beside', view })), blink: [] as Run[] },
    { className: 'avatar-wag', open: runs(compose(avatar, { only: 'beside', wag: true, view })), blink: [] as Run[] },
  ];
}

// The paper-doll avatar from lib/avatar.ts as an SVG. It blinks now and then (the blink only redraws the rows that
// differ). `focus` shows one slot in colour on a grey silhouette, for picker tiles. `animate` adds the idle loop:
// the figure bobs a pixel and the animals beside it move, on separate beats, each pose swapped in CSS. Decorative
// unless given a label. `crop` shows only a square of the canvas, [x, y, size] in pixels, for close-ups.
export function Avatar({
  avatar,
  label,
  className,
  crop = [0, 0, SIZE],
  animate = false,
  focus,
  bare = false,
  view = 'front',
}: {
  avatar: AvatarData;
  label?: string;
  className?: string;
  crop?: readonly [number, number, number];
  animate?: boolean;
  focus?: Slot; // one slot in colour, the rest a grey silhouette (never animated)
  bare?: boolean; // with `focus`: nothing else drawn, and the view tightens to the part itself
  view?: View; // from the front, or turned around
}) {
  const { layers, box } = useMemo(() => {
    if (focus) {
      const px = compose(avatar, { focus, bare, view });
      const open = runs(px);
      let box: readonly [number, number, number] | undefined;
      if (bare && open.length) {
        // The smallest square around what was drawn, 2px of air around it, never under 12px.
        const xs = open.flatMap((r) => [r.x, r.x + r.w - 1]);
        const ys = open.map((r) => r.y);
        const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        const size = Math.max(12, x1 - x0 + 1, y1 - y0 + 1) + 4;
        box = [Math.round((x0 + x1 + 1) / 2 - size / 2), Math.round((y0 + y1 + 1) / 2 - size / 2), size];
      }
      return { layers: [{ className: undefined, open, blink: [] }], box };
    }
    return { layers: still(avatar, animate, view), box: undefined };
  }, [avatar, animate, focus, bare, view]);
  const vb = box ?? crop;
  const rect = (r: Run) => <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />;
  return (
    <svg
      className={`avatar${focus && bare && !layers[0].open.length ? ' empty' : ''}${className ? ` ${className}` : ''}`}
      viewBox={`${vb[0]} ${vb[1]} ${vb[2]} ${vb[2]}`}
      shapeRendering="crispEdges"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {layers.map((l, i) => (
        <g key={i} className={l.className}>
          {l.open.map(rect)}
          {l.blink.length > 0 && <g className="avatar-blink">{l.blink.map(rect)}</g>}
        </g>
      ))}
    </svg>
  );
}
