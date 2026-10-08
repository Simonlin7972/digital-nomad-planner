import { QrCodeDataType, encode } from 'uqr';
import { PixelNomad } from './PixelNomad';
import './QrCode.css';

const BORDER = 2;

type Layout = { size: number; modules: string; eyes: [number, number][] };

// The code's modules as one path, leaving out the three finder patterns, which are drawn rounded instead. Medium
// error correction when the text fits, low when only that fits; null when it is more than any QR code holds.
// The modules stay square: round dots and a picture in the middle were tried and stopped dense codes scanning.
export function qrLayout(text: string): Layout | null {
  for (const ecc of ['M', 'L'] as const) {
    try {
      const { size, data, types } = encode(text, { ecc, border: BORDER });
      let modules = '';
      data.forEach((row, y) =>
        row.forEach((on, x) => {
          if (on && types[y][x] !== QrCodeDataType.Position) modules += `M${x} ${y}h1v1h-1z`;
        }),
      );
      const far = size - BORDER - 7;
      return { size, modules, eyes: [[BORDER, BORDER], [far, BORDER], [BORDER, far]] };
    } catch {
      // too long at this level
    }
  }
  return null;
}

// The QR code on a rounded card, with the header's mascot perched on its top edge. The mascot sits outside the
// code, so it can't get in the way of scanning.
export function QrCode({ layout, label, caption }: { layout: Layout; label: string; caption: string }) {
  const { size, modules, eyes } = layout;
  return (
    <figure className="qr-card">
      <PixelNomad />
      <svg className="qr-code" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} shapeRendering="crispEdges">
        <rect width={size} height={size} fill="#fff" />
        <path d={modules} fill="#222" />
        {eyes.map(([x, y]) => (
          <g key={`${x}-${y}`} shapeRendering="geometricPrecision">
            <rect x={x + 0.5} y={y + 0.5} width={6} height={6} rx={2} fill="none" stroke="#222" strokeWidth={1} />
            <rect x={x + 2} y={y + 2} width={3} height={3} rx={1} fill="#222" />
          </g>
        ))}
      </svg>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
