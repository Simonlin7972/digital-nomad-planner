import { useMemo } from 'react';
import { SIZE, compose, runs, type Avatar as AvatarData, type Pose } from '../lib/avatar';
import './Avatar.css';

type Run = ReturnType<typeof runs>[number];

// One pose as runs of colour, plus the rows that change when the eyes close.
function frames(avatar: AvatarData, pose: Pose) {
  const a = compose(avatar, pose);
  const b = compose(avatar, { ...pose, blink: true });
  const changed = new Set(b.flatMap((row, y) => (row.some((c, x) => c !== a[y][x]) ? [y] : [])));
  return { open: runs(a), blink: runs(b, changed) };
}

// The paper-doll avatar from lib/avatar.ts as an SVG. It blinks now and then (the blink only redraws the rows that
// differ). `animate` adds the idle loop: the figure bobs a pixel and the animals beside it move, on separate beats,
// each pose swapped in CSS. Decorative unless given a label. `crop` shows only a square of the canvas, [x, y, size]
// in pixels, for close-ups.
export function Avatar({
  avatar,
  label,
  className,
  crop = [0, 0, SIZE],
  animate = false,
}: {
  avatar: AvatarData;
  label?: string;
  className?: string;
  crop?: readonly [number, number, number];
  animate?: boolean;
}) {
  const layers = useMemo(() => {
    if (!animate) return [{ className: undefined, ...frames(avatar, {}) }];
    return [
      { className: 'avatar-high', ...frames(avatar, { only: 'figure' }) },
      { className: 'avatar-low', ...frames(avatar, { only: 'figure', dip: true }) },
      { className: 'avatar-still', open: runs(compose(avatar, { only: 'beside' })), blink: [] },
      { className: 'avatar-wag', open: runs(compose(avatar, { only: 'beside', wag: true })), blink: [] },
    ];
  }, [avatar, animate]);
  const rect = (r: Run) => <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />;
  return (
    <svg
      className={`avatar${className ? ` ${className}` : ''}`}
      viewBox={`${crop[0]} ${crop[1]} ${crop[2]} ${crop[2]}`}
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
