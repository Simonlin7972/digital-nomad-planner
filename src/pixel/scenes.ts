// City scenes for the pixel guide (dev only): Sydney by day and Tokyo at dusk, 21:9 on a 224×96 canvas, at the same
// pixel size as the avatar, which stands in them 1:1. Each scene draws two frames for its idle loop (waves, a ferry,
// neon, falling petals; the people breathe and the pets fidget on the same beat).
//
// Scenes are drawn with a few primitives (flat rectangles, lines, character-row sprites) rather than one big
// character map, so landmarks can be moved and tuned. Every colour is flat: no gradients, one shade per colour.

import { PRESETS, SIZE, compose, type Avatar, type Pixels } from '../lib/avatar';

export const SCENE_W = 224;
export const SCENE_H = 96;

type Pal = Record<string, string>;

function painter() {
  const g: Pixels = Array.from({ length: SCENE_H }, () => Array<string | null>(SCENE_W).fill(null));
  const dot = (x: number, y: number, c: string | null | undefined) => {
    if (c && x >= 0 && x < SCENE_W && y >= 0 && y < SCENE_H) g[y][x] = c;
  };
  const rect = (x: number, y: number, w: number, h: number, c: string) => {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) dot(i, j, c);
  };
  // A sprite from character rows; '.' is transparent. `flip` mirrors it.
  const sprite = (x: number, y: number, rows: string[], pal: Pal, flip = false) => {
    rows.forEach((row, j) => [...(flip ? [...row].reverse().join('') : row)].forEach((ch, i) => ch !== '.' && dot(x + i, y + j, pal[ch])));
  };
  // A 32×32 avatar placed so its soles stand on `floor`.
  const person = (x: number, floor: number, a: Avatar, low: boolean) => {
    const px = compose(a, { dip: low, wag: low });
    px.forEach((row, j) => row.forEach((c, i) => dot(x + i, floor - 27 + j, c)));
  };
  return { g, dot, rect, sprite, person };
}

const preset = (id: string) => PRESETS.find((p) => p.id === id)!.avatar;

// An Opera House shell: the tip at the top right, the back (left) edge a convex curve down to the base, the front
// edge falling nearly straight. The back third is in shade, with a lit rim along the curve.
function sail(w: number, h: number): string[] {
  return Array.from({ length: h }, (_, i) => {
    const t = (i + 1) / h;
    const left = Math.round((w - 4) * (1 - Math.pow(t, 0.55))); // convex back, bulging out fast below the tip
    const right = w - 1 - Math.round(3 * Math.pow(t, 1.4)); // the front leans back under the tip: an overhang
    const shadeTo = left + Math.max(1, Math.round((right - left) * 0.4));
    return Array.from({ length: w }, (_, x) => (x < left || x > right ? '.' : x === left || x === right ? 'W' : x < shadeTo ? 's' : 'W')).join('');
  });
}

// ---------------------------------------------------------------------------------------------------------------
// Sydney: the harbour on a clear morning.
export function sydney(low: boolean): Pixels {
  const { g, dot, rect, sprite, person } = painter();
  const C = {
    sky: ['#86c6ea', '#93cdee', '#a3d4f0', '#b1daf2', '#bfe0f4', '#cde7f6', '#dbeef8', '#e6f3fa'],
    cloud: '#ffffff', cloudS: '#e3f0f7',
    sun: '#f5b83d',
    far: '#9fbdd2', farS: '#8fb0c7', farWin: '#c3d7e4',
    tower: '#8ea9bd', gold: '#e3b75a',
    steel: '#5f7182', steelS: '#4d5d6c', stone: '#d9c3a0', stoneS: '#bfa682',
    water: '#3b8cc2', waterS: '#2f77a9', wave: '#7cc0e6',
    sailW: '#f7f5ee', sailS: '#d8d3c4', podium: '#cdb48d', podiumS: '#b39a73',
    pave: '#ddd5c4', paveL: '#cbc2ae', rail: '#5a5a5a', railL: '#8a8a8a',
    ferryG: '#2f6b3a', ferryC: '#efe6c8', ferryY: '#f2c230', ferryW: '#3a3a3a',
    bird: '#ffffff', birdD: '#3a3a3a', ibis: '#efefea', ibisD: '#2b2b2b', lamp: '#4a4a4a', lampL: '#ffe7a3',
  };

  // Sky in flat bands, lighter towards the horizon
  C.sky.forEach((c, i) => rect(0, i * 7, SCENE_W, 7, c));
  rect(0, 56, SCENE_W, 3, C.sky[7]);
  // Sun and clouds
  sprite(18, 7, ['..YYYY..', '.YYYYYY.', 'YYYYYYYY', 'YYYYYYYY', 'YYYYYYYY', 'YYYYYYYY', '.YYYYYY.', '..YYYY..'], { Y: C.sun });
  const cloud = ['....WWWW......', '..WWWWWWWW.WW.', '.WWWWWWWWWWWWW', 'SSSSSSSSSSSSSS'];
  sprite(46, 12, cloud, { W: C.cloud, S: C.cloudS });
  sprite(low ? 133 : 132, 6, cloud.map((r) => r.slice(2)), { W: C.cloud, S: C.cloudS });

  // City skyline behind the harbour: one colour, a shade on the right faces, faint windows
  const towers: [number, number, number][] = [
    [70, 34, 8], [78, 28, 7], [85, 38, 6], [91, 30, 9], [100, 24, 7], [107, 33, 8], [115, 27, 6], [121, 36, 7],
  ];
  towers.forEach(([x, y, w]) => {
    rect(x, y, w, 59 - y, C.far);
    rect(x + w - 2, y, 2, 59 - y, C.farS);
    for (let j = y + 3; j < 56; j += 4) for (let i = x + 1; i < x + w - 3; i += 2) dot(i, j, C.farWin);
  });
  // Sydney Tower: a shaft with its cables, the golden turret, the spire
  rect(96, 14, 3, 45, C.tower);
  dot(97, 14, C.farS);
  for (let y = 16; y < 56; y += 2) { dot(95, y, C.farS); dot(99, y, C.farS); }
  sprite(92, 4, [
    '....TT....', '....TT....', '...GGGG...', '..GGGGGG..', '.GGGGGGGG.', '.TTTTTTTT.', '.GGGGGGGG.', '..GGGGGG..', '...TTTT...', '....TT....',
  ], { T: C.tower, G: C.gold });
  rect(97, 0, 1, 4, C.tower);

  // Harbour Bridge: two arches, hangers down to the deck, sandstone pylons at both ends
  const archY = (x: number, top: number) => Math.round(top + Math.pow(x - 176, 2) * 0.0105);
  for (let x = 130; x <= 222; x++) {
    const a = archY(x, 26), b = archY(x, 31);
    rect(x, a, 1, 2, C.steel);
    dot(x, b, C.steelS);
    if (x % 3 === 0) for (let y = b + 1; y < 52; y++) dot(x, y, C.steelS);
    if (x % 6 === 0) for (let y = a + 2; y < b; y++) dot(x, y, C.steelS);
  }
  rect(124, 51, SCENE_W - 124, 2, C.steel);
  rect(124, 53, SCENE_W - 124, 1, C.steelS);
  for (const px of [126, 212]) {
    rect(px, 38, 10, 16, C.stone);
    rect(px + 7, 38, 3, 16, C.stoneS);
    rect(px - 1, 37, 12, 1, C.stoneS);
    rect(px + 3, 42, 4, 5, C.stoneS);
  }

  // Water, with short light dashes that shift between frames
  rect(0, 59, SCENE_W, 18, C.water);
  rect(0, 59, SCENE_W, 1, C.waterS);
  for (let y = 62; y < 76; y += 3) {
    const shift = (y * 7 + (low ? 3 : 0)) % 11;
    for (let x = -shift; x < SCENE_W; x += 11) rect(x, y, 3, 1, C.wave);
  }

  // Opera House on its podium, sails in two groups
  rect(14, 60, 74, 5, C.podium);
  rect(14, 64, 74, 1, C.podiumS);
  for (let x = 16; x < 86; x += 4) dot(x, 61, C.podiumS);
  // Two halls of shells, each shell taller than the one before it, drawn back to front so the tips overlap
  const sails: [number, number, number][] = [
    [14, 13, 14], [21, 15, 19], [30, 17, 24], [41, 19, 28], // main hall, rising
    [62, 11, 12], [68, 13, 16], [76, 12, 14], // the smaller hall
  ];
  sails.forEach(([x, w, h]) => sprite(x, 60 - h, sail(w, h), { W: C.sailW, s: C.sailS }));
  // dark glass under each overhang
  sails.forEach(([x, w, h]) => rect(x + w - 6, 60 - Math.round(h * 0.3), 3, Math.round(h * 0.3), C.steelS));
  rect(10, 62, 4, 1, C.podiumS);
  rect(8, 63, 6, 1, C.podiumS);

  // A green-and-cream ferry, nudging along
  const fx = low ? 101 : 100;
  sprite(fx, 63, [
    '.......YYYYYYYYYY.......',
    '......CCCCCCCCCCCC......',
    '.....CDCDCDCDCDCDCC.....',
    'GGGGGGGGGGGGGGGGGGGGGGGG',
    '.GGGGGGGGGGGGGGGGGGGGGG.',
    '..YYYYYYYYYYYYYYYYYYYY..',
  ], { Y: C.ferryY, C: C.ferryC, D: C.ferryW, G: C.ferryG });

  // A sailboat under the bridge, heeling a little between frames
  sprite(150, 50, low ? ['....W....', '...WW....', '..WWW....', '.WWWW....', 'WWWWW....', '....D....', 'HHHHHHHH.'] : ['....W....', '....WW...', '....WWW..', '....WWWW.', '....WWWWW', '....D....', '.HHHHHHHH'], { W: C.sailW, D: C.steelS, H: '#2b2b2b' });
  // Gulls: wings up, then down
  const gull = low ? ['W...W', '.W.W.', '..D..'] : ['.....', 'WW.WW', '..D..'];
  sprite(150, 14, gull, { W: C.bird, D: C.birdD });
  sprite(170, 20, gull, { W: C.bird, D: C.birdD }, true);
  sprite(60, 22, gull, { W: C.bird, D: C.birdD });

  // Promenade: railing, paving, a lamp post
  rect(0, 77, SCENE_W, 1, C.rail);
  rect(0, 81, SCENE_W, 1, C.railL);
  for (let x = 2; x < SCENE_W; x += 7) rect(x, 77, 1, 6, C.rail);
  rect(0, 83, SCENE_W, 13, C.pave);
  for (let x = 0; x < SCENE_W; x += 12) rect(x, 83, 1, 13, C.paveL);
  rect(0, 89, SCENE_W, 1, C.paveL);
  rect(196, 58, 2, 30, C.lamp);
  sprite(193, 54, ['.LLLLLL.', 'LYYYYYYL', '.LLLLLL.'], { L: C.lamp, Y: C.lampL });
  // A bench, a bin and two Norfolk pines along the quay
  sprite(20, 84, ['DDDDDDDDDDDD', 'D..........D', 'DDDDDDDDDDDD', 'D..........D', 'D..........D'], { D: '#6b5a48' });
  sprite(40, 84, ['.DDDD.', 'DDDDDD', 'DDDDDD', 'DDDDDD', 'DDDDDD', '.DDDD.'], { D: '#3f6b5a' });
  for (const px of [184, 214]) {
    rect(px + 3, 60, 1, 24, '#5a3b2a');
    [[3, 60, 1], [2, 62, 3], [1, 65, 5], [2, 68, 3], [0, 71, 7], [1, 74, 5], [0, 77, 7]].forEach(([dx, dy, w]) => rect(px + dx, dy, w, 1, '#3f9b62'));
  }

  // People: a surfer heading for the water, a backpacker with the dog
  person(120, 93, { ...preset('surfer'), sideR: 'surfboard', sideRColour: 0 }, low);
  person(150, 93, preset('backpacker'), low);
  // An ibis on the railing post, as Sydney has
  sprite(60, 75, low ? ['........', 'DD......', '.DDWWW..', '...WWWW.', '....WWWW', '....D.D.'] : ['DD......', '.DD.....', '..DWWW..', '...WWWW.', '....WWWW', '....D.D.'], { D: C.ibisD, W: C.ibis });

  return g;
}

// ---------------------------------------------------------------------------------------------------------------
// Tokyo: dusk, the tower lit, a street corner under a cherry tree.
export function tokyo(low: boolean): Pixels {
  const { g, dot, rect, sprite, person } = painter();
  const C = {
    sky: ['#3f3f78', '#56508c', '#7a5f9c', '#a8709e', '#d4849a', '#f0a284'],
    star: '#ffffff',
    fuji: '#7c6fa4', fujiS: '#6b5f92', snow: '#f4f1f8',
    far: '#4b4a7a', farS: '#403f6b',
    bld: '#2f3352', bldS: '#262a45', win: '#ffd98a', winOff: '#3d4266',
    red: '#e8542f', redS: '#c4401f', white: '#f5f3ec', deck: '#ffd98a',
    pink: '#ff5a8a', cyan: '#5ad8e6', yellow: '#ffd166',
    road: '#45465a', stripe: '#e9e7f0', walk: '#b7b0a8', walkS: '#a29a91', kerb: '#d6d0c8',
    trunk: '#5a3b2a', blossom: '#f7b6c8', blossomS: '#e48fa8', petal: '#fbd3df',
    vend: '#e04b3c', vendS: '#b83a2d', panel: '#cfe9f2', lit: '#fff3c4',
  };

  // Dusk sky in bands, darkest at the top; a few stars
  C.sky.forEach((c, i) => rect(0, i * 9, SCENE_W, 9, c));
  rect(0, 54, SCENE_W, 10, C.sky[5]);
  for (const [x, y] of [[12, 3], [40, 6], [77, 2], [131, 5], [170, 3], [205, 7], [25, 10], [96, 8], [148, 12], [190, 1]]) dot(x, y, C.star);
  // A crescent moon
  sprite(196, 8, ['..WW', '.W..', 'W...', 'W...', '.W..', '..WW'], { W: '#fff3c4' });

  // Mount Fuji, far away on the left
  for (let i = 0; i < 30; i++) {
    const w = 8 + i * 3;
    rect(42 - Math.floor(w / 2), 30 + i, w, 1, i < 7 ? C.snow : C.fuji);
    if (i >= 7) rect(42 + Math.floor(w / 2) - Math.ceil(w / 6), 30 + i, Math.ceil(w / 6), 1, C.fujiS);
  }
  for (const x of [34, 38, 42, 46, 50]) rect(x, 37, 1, 2, C.snow);
  for (const x of [36, 44, 48]) rect(x, 38, 1, 2, C.snow);

  // Far skyline
  [[0, 44, 14], [14, 40, 10], [60, 42, 12], [72, 36, 9], [118, 38, 11], [129, 33, 8], [150, 41, 10], [186, 35, 12], [198, 42, 10], [208, 38, 16]].forEach(
    ([x, y, w]) => {
      rect(x, y, w, 64 - y, C.far);
      rect(x + w - 2, y, 2, 64 - y, C.farS);
    },
  );

  // Tokyo Tower: red and white bands, two decks, a lattice suggested by a gap down the middle
  const towerX = 168;
  for (let y = 6; y < 66; y++) {
    const half = y < 20 ? 1 : y < 34 ? 2 + Math.floor((y - 20) / 7) : 4 + Math.floor((y - 34) / 4);
    const band = Math.floor((y - 6) / 6) % 2 === 0 ? C.red : C.white;
    rect(towerX - half, y, half * 2, 1, band);
    if (half >= 4) rect(towerX - 1, y, 2, 1, y > 50 ? C.sky[5] : band === C.red ? C.redS : C.white);
    if (half >= 6) {
      dot(towerX - half + 2, y, C.sky[5]);
      dot(towerX + half - 3, y, C.sky[5]);
    }
  }
  // Decks: a ring of lit windows one pixel wider than the tower at that height
  for (const [dy, half] of [[36, 5], [20, 2]] as const) {
    rect(towerX - half - 1, dy, half * 2 + 2, 1, C.redS);
    for (let i = -half - 1; i <= half; i++) dot(towerX + i, dy + 1, (i + half) % 2 ? C.deck : C.redS);
    rect(towerX - half - 1, dy + 2, half * 2 + 2, 1, C.redS);
  }
  // Legs splaying under the lowest band
  for (let y = 60; y < 70; y++) { dot(towerX - 9 - Math.floor((y - 60) / 3), y, C.red); dot(towerX + 8 + Math.floor((y - 60) / 3), y, C.red); }
  rect(towerX, 0, 1, 6, C.white);
  dot(towerX, 0, C.red);

  // Office towers with lit windows; a few windows change between frames
  const blocks: [number, number, number][] = [[86, 22, 18], [104, 30, 14], [190, 26, 16], [206, 32, 18], [130, 44, 16]];
  blocks.forEach(([x, y, w], b) => {
    rect(x, y, w, 70 - y, C.bld);
    rect(x + w - 3, y, 3, 70 - y, C.bldS);
    for (let j = y + 3; j < 66; j += 3)
      for (let i = x + 2; i < x + w - 4; i += 3) {
        const on = (i * 13 + j * 7 + b * 5) % 5 !== 0;
        const flick = (i * 3 + j) % 17 === 0;
        dot(i, j, on !== (flick && low) ? C.win : C.winOff);
        dot(i + 1, j, on !== (flick && low) ? C.win : C.winOff);
      }
  });
  // Neon signs: vertical boards that blink in turn
  const neon = (x: number, y: number, h: number, c: string, on: boolean) => {
    rect(x, y, 4, h, C.bldS);
    for (let j = y + 1; j < y + h - 1; j += 2) rect(x + 1, j, 2, 1, on ? c : C.winOff);
  };
  neon(100, 40, 16, C.pink, !low);
  neon(124, 46, 12, C.cyan, low);
  neon(202, 42, 14, C.yellow, true);

  // Street: pavement, kerb, road with a zebra crossing
  rect(0, 70, SCENE_W, 10, C.walk);
  for (let x = 0; x < SCENE_W; x += 8) rect(x, 70, 1, 10, C.walkS);
  rect(0, 80, SCENE_W, 1, C.kerb);
  rect(0, 81, SCENE_W, 15, C.road);
  for (let x = 128; x < 200; x += 6) rect(x, 83, 3, 11, C.stripe);

  // A taxi on the road, creeping along
  const tx = low ? 150 : 149;
  sprite(tx, 84, ['.....DDDDDD.....', '....DWWWWWWD....', '...DDDDDDDDDD...', 'YYYYYYYYYYYYYYYY', 'YYYYYYYYYYYYYYYY', 'YLLYYYYYYYYYYLLY', '..DD........DD..'], { D: '#2b2b2b', W: '#bfe3f0', Y: C.yellow, L: C.lit });
  // A crossing signal on the kerb and a string of shop lanterns
  rect(126, 56, 1, 24, '#2b2b2b');
  sprite(124, 52, ['DDDDD', 'DGGGD', 'DDDDD'], { D: '#2b2b2b', G: low ? '#3fa58f' : '#2b2b2b' });
  for (const lx of [186, 192, 198, 204, 210, 216]) sprite(lx, 58, ['.D.', 'RRR', 'RRR', 'RLR', 'RRR', '.y.'], { D: '#2b2b2b', R: C.red, L: C.lit, y: C.yellow });
  // A vending machine on the pavement
  sprite(10, 50, [
    'VVVVVVVVVVVV',
    'VPPPPPPPPPPV',
    'VPLPLPLPLPPV',
    'VPPPPPPPPPPV',
    'VPLPLPLPLPPV',
    'VPPPPPPPPPPV',
    'VPLPLPLPLPPV',
    'VPPPPPPPPPPV',
    'VVVVVVVVVVVV',
    'VSSSSSSSSSVV',
    'VSYYYYYYYSVV',
    'VSSSSSSSSSVV',
    'VVVVVVVVVVVV',
    'VVVVVVVVVVSV',
    'VVVVDDDDVVSV',
    'VVVVVVVVVVSV',
    'VVVVVVVVVVSV',
    'VVVVVVVVVVVV',
    'VVVVVVVVVVVV',
    'SSSSSSSSSSSS',
  ], { V: C.vend, S: C.vendS, P: C.panel, L: C.yellow, Y: C.lit, D: '#2b2b2b' });

  // Cherry tree: trunk, a cloud of blossom, petals drifting
  rect(54, 52, 3, 18, C.trunk);
  rect(50, 54, 4, 1, C.trunk);
  rect(49, 53, 1, 1, C.trunk);
  rect(57, 51, 4, 1, C.trunk);
  rect(61, 50, 1, 1, C.trunk);
  const crown = [
    '.........BBBBBBBB.........',
    '......BBBBBBBBBBBBBB......',
    '....BBBBBbBBBBBBBBBBBB....',
    '..BBBBBBBBBBBBBbBBBBBBBB..',
    '.BBBbBBBBBBBBBBBBBBBBBbBB.',
    'BBBBBBBBBBBbBBBBBBBBBBBBBB',
    'BBBBBBbBBBBBBBBBBBbBBBBBBB',
    'bBBBBBBBBBBBBBBBBBBBBBBBBb',
    '.bBBBBBbBBBBBBBBBBBBbBBBb.',
    '..bbBBBBBBBbBBBBBBBBBBbb..',
    '....bbBBBBBBBBBBBBBBbb....',
    '......bbbbBBBBBBbbbb......',
    '..........bbbbbb..........',
  ];
  sprite(42, 40, crown, { B: C.blossom, b: C.blossomS });
  const petals = low ? [[40, 56], [66, 58], [46, 63], [70, 66], [36, 68]] : [[41, 54], [67, 56], [47, 61], [71, 64], [37, 66]];
  petals.forEach(([x, y]) => dot(x, y, C.petal));

  // People on the corner: the designer with her coffee, the café regular, and a cat by the tree
  person(80, 78, { ...preset('designer'), sideL: 'none' }, low);
  person(108, 78, { ...preset('cafe'), handL: 'none', handR: 'bubbletea' }, low);
  person(34, 78, { ...preset('gapyear'), back: 'none', head: 'none', hair: 'pigtails', hairColour: 0, top: 'tee', topColour: 8, sideL: 'cat' }, low);

  return g;
}

// ---------------------------------------------------------------------------------------------------------------
// Taipei: early evening by a night market, 101 behind the arcade.
export function taipei(low: boolean): Pixels {
  const { g, dot, rect, sprite, person } = painter();
  const C = {
    sky: ['#2f3f6e', '#3d4f82', '#5a6396', '#8a73a0', '#c08596', '#e69a84', '#f3b27a'],
    hill: '#3f6b5a', hillS: '#2f5446', far: '#55597a', farS: '#484c6a',
    glass: '#4f9a9a', glassS: '#3f7f80', glassL: '#7fc4c4', spire: '#c9ced6', gold: '#e3b75a',
    bld: '#8a7f78', bldS: '#746a63', bldB: '#c2a878', bldBS: '#a38c5e', win: '#ffd98a', winOff: '#5a5450',
    sign: '#ff5a5f', signB: '#3fa58f', signY: '#ffd166', signW: '#ffffff',
    roofR: '#c4401f', roofRS: '#9c2f14', pillar: '#d9d2c4', pillarS: '#b8b0a2', arcade: '#efe8da',
    walk: '#b9b2a6', walkS: '#a39b8e', road: '#4a4a52', stripe: '#e9e7f0',
    awning: '#ffd166', awningS: '#d9a822', stall: '#8a5a3a', steam: '#ffffff', lantern: '#e8542f', lanternL: '#fff3c4',
    scooter: '#3a3a3a', scooterB: '#5a7fb0',
  };

  C.sky.forEach((c, i) => rect(0, i * 8, SCENE_W, 8, c));
  rect(0, 56, SCENE_W, 8, C.sky[6]);
  for (const [x, y] of [[20, 2], [58, 5], [120, 3], [200, 6], [88, 9]]) dot(x, y, '#ffffff');

  // Hills behind the city (Elephant Mountain side), two ridges
  for (let x = 0; x < SCENE_W; x++) {
    const r1 = 44 + Math.round(6 * Math.sin(x / 23) + 3 * Math.sin(x / 7));
    rect(x, r1, 1, 64 - r1, C.hill);
    if (x % 5 === 0) dot(x, r1 + 1, C.hillS);
  }
  for (let x = 60; x < 200; x++) {
    const r2 = 50 + Math.round(4 * Math.sin(x / 15 + 2));
    rect(x, r2, 1, 64 - r2, C.hillS);
  }

  // Far blocks under the hills
  [[0, 50, 12], [14, 46, 9], [26, 52, 10], [96, 48, 10], [108, 44, 8], [184, 47, 12], [198, 51, 10], [210, 45, 14]].forEach(([x, y, w]) => {
    rect(x, y, w, 70 - y, C.far);
    rect(x + w - 2, y, 2, 70 - y, C.farS);
  });

  // Taipei 101: a pedestal, eight segments that flare out towards their tops, and the spire
  const tx = 150;
  rect(tx - 9, 62, 18, 8, C.glassS);
  rect(tx - 9, 62, 18, 1, C.glassL);
  for (let k = 0; k < 8; k++) {
    const top = 58 - k * 5;
    rect(tx - 5, top + 4, 10, 1, '#2f5f60'); // the seam under each segment
    for (let r = 0; r < 4; r++) {
      const half = r < 1 ? 7 : r < 3 ? 6 : 5;
      rect(tx - half, top + r, half * 2, 1, C.glass);
      rect(tx + half - 2, top + r, 2, 1, C.glassS);
      if (r === 0) rect(tx - half, top, half * 2, 1, C.glassL);
      if (r % 2 === 1) for (let i = -half + 1; i < half - 2; i += 3) dot(tx + i, top + r, low && (i + k) % 4 === 0 ? C.winOff : C.win);
    }
    // the ruyi ornament on each corner
    dot(tx - 8, top + 1, C.gold);
    dot(tx + 7, top + 1, C.gold);
  }
  rect(tx - 3, 14, 6, 4, C.glass);
  rect(tx - 2, 10, 4, 4, C.glassS);
  rect(tx, 2, 1, 8, C.spire);
  rect(tx - 1, 6, 3, 1, C.spire);
  dot(tx, 1, low ? C.sign : C.spire);

  // Mid-ground blocks: tiled Taipei apartments with rooftop water tanks and signs
  const flats: [number, number, number, string, string][] = [[40, 36, 22, C.bld, C.bldS], [66, 42, 18, C.bldB, C.bldBS], [176, 38, 20, C.bld, C.bldS], [200, 44, 24, C.bldB, C.bldBS]];
  flats.forEach(([x, y, w, c, cs], b) => {
    rect(x, y, w, 70 - y, c);
    rect(x + w - 2, y, 2, 70 - y, cs);
    for (let j = y + 3; j < 66; j += 4) for (let i = x + 2; i < x + w - 4; i += 4) {
      const on = (i * 7 + j * 3 + b) % 4 !== 0;
      rect(i, j, 2, 1, on ? C.win : C.winOff);
    }
    // water tank and a rail on the roof
    sprite(x + 3, y - 4, ['.SS.', 'SSSS', 'SSSS', '.DD.'], { S: '#d9d2c4', D: '#5a5a5a' });
    for (let i = x; i < x + w; i += 2) dot(i, y - 1, cs);
  });
  // Vertical shop signs hanging off the flats
  const vsign = (x: number, y: number, h: number, c: string, on: boolean) => {
    rect(x, y, 5, h, c);
    for (let j = y + 1; j < y + h - 1; j += 2) rect(x + 1, j, 3, 1, on ? C.signW : c);
  };
  vsign(44, 46, 18, C.sign, true);
  vsign(80, 50, 14, C.signB, !low);
  vsign(180, 48, 16, C.signY, true);
  vsign(212, 52, 12, C.sign, low);

  // A temple roof corner on the far left, red with upturned eaves
  sprite(0, 40, [
    '..............G...',
    '...........RRRRR..',
    '.......RRRRRRRRRR.',
    '...RRRRRRRRRRRRRRR',
    'RRRRRRRRRRRRRRRRRR',
    'SSSSSSSSSSSSSSSSSS',
    '.YYYYYYYYYYYYYYYY.',
    '.Y..Y..Y..Y..Y..Y.',
  ], { R: C.roofR, S: C.roofRS, G: C.gold, Y: C.gold });

  // The arcade (騎樓): a covered walk with pillars, lanterns strung along it
  rect(0, 60, SCENE_W, 10, C.arcade);
  rect(0, 60, SCENE_W, 1, C.pillarS);
  for (let x = 6; x < SCENE_W; x += 28) { rect(x, 60, 4, 20, C.pillar); rect(x + 3, 60, 1, 20, C.pillarS); }
  for (let x = 12; x < SCENE_W; x += 10) {
    const lit = low ? x % 20 === 2 : x % 20 === 12;
    sprite(x, 61, ['.D.', 'RRR', 'RLR', 'RRR', '.D.'], { D: '#2b2b2b', R: C.lantern, L: lit ? C.lanternL : C.lantern });
  }
  rect(0, 80, SCENE_W, 1, C.pillarS);
  rect(0, 81, SCENE_W, 6, C.walk);
  for (let x = 0; x < SCENE_W; x += 8) rect(x, 81, 1, 6, C.walkS);
  rect(0, 87, SCENE_W, 9, C.road);
  for (let x = 4; x < SCENE_W; x += 12) rect(x, 91, 6, 1, C.stripe);

  // A night-market stall with a yellow awning, steam rising off the pot
  sprite(96, 62, [
    'YYYYYYYYYYYYYYYYYY',
    'SYSYSYSYSYSYSYSYSY',
    'B................B',
    'B................B',
    'B.OO..WWWW..GG...B',
    'BBBBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBBBB',
    'B.RR..RR..RR..RR.B',
    'B................B',
  ], { Y: C.awning, S: C.awningS, B: C.stall, W: C.signW, O: '#f0a050', G: '#4caf6a', R: C.sign });
  sprite(102, low ? 56 : 57, ['.W..W.', 'W..W..'], { W: C.steam });
  sprite(118, 68, ['DDDD', 'DWWD', 'DWWD', 'DDDD'], { D: '#2b2b2b', W: C.lanternL }); // the stall's lamp

  // A parked scooter at the kerb
  sprite(28, 80, ['......BB....', '....BBBBB...', '...SBBBBBS..', 'SSSSSSSSSSSS', '.DD......DD.', '.DD......DD.'], { B: C.scooterB, S: C.scooter, D: '#2b2b2b' });

  // People: the engineer with bubble tea, the yoga teacher, the creator shooting the tower
  person(50, 86, { ...preset('engineer'), handL: 'none', handR: 'bubbletea', back: 'none' }, low);
  person(130, 86, { ...preset('yogi'), sideL: 'none', sideR: 'none' }, low);
  person(172, 86, { ...preset('creator'), handR: 'phone' }, low);

  return g;
}

export const SCENES = [
  { id: 'sydney', name: '雪梨 · 港灣早晨', draw: sydney },
  { id: 'tokyo', name: '東京 · 黃昏街角', draw: tokyo },
  { id: 'taipei', name: '台北 · 夜市傍晚', draw: taipei },
] as const;

export { SIZE };
