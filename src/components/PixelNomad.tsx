import './PixelNomad.css';

const PALETTE: Record<string, string> = {
  K: '#222222', // trousers
  S: '#f2c9a0', // skin
  H: '#5a3b2a', // hair
  C: '#ff5a5f', // shirt
  D: '#444444', // laptop
  B: '#7fc4e8', // screen
  W: '#ffffff', // screen, lit
  T: '#8a5a3a', // trunk
  L: '#3f9b62', // leaves
  Y: '#f5b83d', // sun
  A: '#ead9b0', // sand
};

// 16×16 pixel art, one character per pixel. The second frame only differs in the palm leaves, the typing hand and
// the screen, so the loop reads as a breeze and someone at work.
const FRAME_A = [
  '.YY.......LL....',
  '.YY.....LLLLLL..',
  '.......LL.TL.LL.',
  '......L...T...L.',
  '..........T.....',
  '...HHH....T.....',
  '..HHHH....T.....',
  '..HSSK...T......',
  '..SSSS...T......',
  '..CCC....T......',
  '.CCCCS.D.T......',
  '.CCCCSSDB.T.....',
  '.CCKKKKDDDT.....',
  'AAAAAAAAAAAAAAAA',
  'AAAAAAAAAAAAAAAA',
];
const FRAME_B = [
  '.YY......LL.....',
  '.YY....LLLLLL...',
  '......LL..TLLL..',
  '.....L....T..L..',
  ...FRAME_A.slice(4, 10),
  '.CCCCSSD.T......',
  '.CCCCS.DW.T.....',
  ...FRAME_A.slice(12),
];

// One rect per horizontal run of the same colour, rather than one per pixel.
function rects(frame: string[]) {
  return frame.flatMap((row, y) => {
    const runs = [];
    for (let x = 0; x < row.length; ) {
      let end = x + 1;
      while (end < row.length && row[end] === row[x]) end++;
      const fill = PALETTE[row[x]];
      if (fill) runs.push(<rect key={`${x}-${y}`} x={x} y={y} width={end - x} height={1} fill={fill} />);
      x = end;
    }
    return runs;
  });
}

// The header mascot: someone working on a laptop under a palm tree. Purely decorative.
export function PixelNomad() {
  return (
    <svg className="pixel-nomad" viewBox="0 0 16 15" aria-hidden="true" shapeRendering="crispEdges">
      <g className="frame-a">{rects(FRAME_A)}</g>
      <g className="frame-b">{rects(FRAME_B)}</g>
    </svg>
  );
}
