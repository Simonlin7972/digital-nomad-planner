// The paper-doll avatar picked on the profile page: a front-facing pixel figure built from layered parts.
//
// The canvas is 32×32; the figure is 16×24 and sits in the middle (8 columns either side, 4 rows above and below).
// Parts are written as rows of characters, one per pixel, like the header mascot. A row's length says how it is
// placed:
//   8 characters  the left half of the figure, mirrored to make the right half (most parts are symmetrical)
//   16 characters the whole figure width, drawn as is (a ponytail, a cup in one hand)
//   32 characters the whole canvas width (a guitar sticking out past the shoulder)
// Row numbers count from the top of the figure, not the canvas (so -4 is the canvas top). Things standing beside
// the figure are 8 columns wide, drawn for the left side and mirrored for the right, standing on the floor.
// Characters are colour codes, resolved per avatar, so a shape is drawn once and recoloured: S skin, s skin shade,
// H hair, h hair shade, C top, c top shade, P top pattern, K bottom, k bottom shade, and X, x for the part's own
// colour (hats, bags, shoes, things beside the figure); the rest are fixed (see FIXED). '.' is transparent.

export const SIZE = 32;
const FIG_W = 16;
const FIG_H = 24;
const OX = (SIZE - FIG_W) / 2;
const OY = (SIZE - FIG_H) / 2;
const SIDE_W = 8;
const FLOOR = FIG_H - 1; // the figure row the soles and the things beside it stand on

// Head to chest, [x, y, size] on the canvas: a bust for small round places like the toolbar.
export const FACE_CROP = [8, 4, 16] as const;

type Layer = { y: number; rows: string[] };
const at = (y: number, rows: string[]): Layer => ({ y, rows });

// Frame b differs only where the eyes close, for a blink.
const BODY_A = at(3, [
  '....SSSS',
  '....SSSS',
  '...sSSSS',
  '...sSESS', // eyes
  '...sSSSS',
  '....SSSM', // mouth
  '.....SSS',
  '.......s', // neck
  '...SSSSS', // shoulders
  '..SSSSSS',
  '..SSSSSS',
  '..SSSSSS',
  '..SSSSSS',
  '..SSSSSS',
  '..SS.SSS', // hands and hips
  '....SSS.',
  '....SSS.',
  '....SSS.',
  '....SSS.',
  '....SSS.',
]);
const BODY_B = at(3, BODY_A.rows.map((r, i) => (i === 3 ? '...sSsSS' : r)));

export const HAIRS = ['short', 'buzz', 'long', 'bun', 'pony', 'curly', 'bob', 'pigtails', 'afro', 'mohawk'] as const;
export const TOPS = ['tee', 'hoodie', 'aloha', 'tank', 'blazer'] as const;
export const BOTTOMS = ['pants', 'shorts', 'skirt'] as const;
export const SHOES = ['sneakers', 'sandals', 'boots'] as const;
export const HEADS = ['none', 'cap', 'beanie', 'bucket', 'straw', 'conical', 'cowboy', 'bandana', 'headband', 'flowers', 'bunny'] as const;
export const EYES = ['none', 'glasses', 'eyepatch', 'sunglasses', 'hearts', 'sleepmask'] as const;
export const LOWERS = ['none', 'moustache', 'beard', 'mask', 'freckles', 'blush'] as const;
export const NECKS = ['none', 'headphones', 'camera', 'scarf', 'pillow', 'necklace', 'lei', 'tie', 'bowtie', 'badge', 'lanyard'] as const;
export const BACKS = ['none', 'backpack', 'hiking', 'messenger', 'guitar', 'ukulele', 'skateboard', 'tripod', 'cape', 'wings'] as const;
export const HANDS = ['none', 'coffee', 'bubbletea', 'coconut', 'icecream', 'phone', 'passport', 'book', 'umbrella', 'laptop'] as const;
export const SIDES = ['none', 'suitcase', 'surfboard', 'yogamat', 'tent', 'plant', 'cactus', 'cat', 'dog', 'rabbit'] as const;

export type Hair = (typeof HAIRS)[number];
export type Top = (typeof TOPS)[number];
export type Bottom = (typeof BOTTOMS)[number];
export type Shoes = (typeof SHOES)[number];
export type Head = (typeof HEADS)[number];
export type Eyes = (typeof EYES)[number];
export type Lower = (typeof LOWERS)[number];
export type Neck = (typeof NECKS)[number];
export type Back = (typeof BACKS)[number];
export type Hand = (typeof HANDS)[number];
export type Side = (typeof SIDES)[number];

// Held in both hands: picking one for either hand fills both.
export const TWO_HANDED: readonly Hand[] = ['laptop'];

// Hair in two layers: what falls behind the body and what lies over the face.
const HAIR_SHAPES: Record<Hair, { back?: Layer; front: Layer }> = {
  short: { front: at(1, ['.....HHH', '....HHHH', '...HHHHH', '...HHHhH', '...H....']) },
  buzz: { front: at(2, ['.....hhh', '....hhhh', '...h....']) },
  long: {
    back: at(3, ['..HHHHHH', '..HHHHHH', '..HHHHHH', '..HHHHHH', '..HHHHHH', '..HHHHHH', '..hHHHHH', '..hhHHHH', '..hh....', '..hh....']),
    front: at(1, ['.....HHH', '....HHHH', '...HHHHH', '...HHHHH', '...H....', '...H....', '...H....']),
  },
  bun: { front: at(0, ['......hh', '.....HHH', '....HHHH', '...HHHHH', '...HHHHH', '...H....']) },
  pony: {
    back: at(3, ['..........HHH...', '...........HHH..', '...........hHH..', '............hH..', '............hH..', '.............h..']),
    front: at(1, ['.....HHH', '....HHHH', '...HHHHH', '...HHHHH', '...H....']),
  },
  curly: { front: at(0, ['.....H.H', '...HHHHH', '..HHhHHH', '..HHHHHH', '..HhHHhH', '..HH....', '..hH....', '..Hh....', '..h.....']) },
  bob: { front: at(1, ['.....HHH', '...HHHHH', '..HHHHHH', '..HHHHHH', '..HH....', '..HH....', '..HH....', '..HH....', '..hH....']) },
  pigtails: { front: at(1, ['.....HHH', '....HHHH', '...HHHHH', '...HHHHH', '.hhH....', 'HHH.....', 'HHH.....', '.HH.....', '..h.....']) },
  afro: { front: at(-1, ['....HHHH', '..HHHHHH', '.HHHHhHH', '.HHHHHHH', '.HhHHHHH', '.HHHHHHH', '.HHH....', '.HhH....', '.HHH....', '..HH....']) },
  mohawk: { front: at(-2, ['.......H', '.......H', '......HH', '......HH', '.....hHH', '....hhHH', '...h....']) },
};

const TOP_SHAPES: Record<Top, Layer> = {
  tee: at(11, ['..cCCCCC', '..cCCCCC', '....CCCC', '....CCCC', '....CCCC', '....cCCC']),
  hoodie: at(10, ['....cc..', '..cCCCCC', '..cCCCCW', '..cCCCCC', '..cCCCCC', '..cCcccc', '..cCCCCC']),
  aloha: at(11, ['..cCPCC.', '..cCCCPC', '....PCCC', '....CCPC', '....CPCC', '....cCCC']),
  tank: at(11, ['.....C..', '....CC..', '....CCCC', '....CCCC', '....CCCC', '....cCCC']),
  blazer: at(11, ['..cCCCWW', '..cCCCCW', '..cCCCCW', '..cCCCCW', '..cCCCCW', '..cCCCCC']),
};

const BOTTOM_SHAPES: Record<Bottom, Layer> = {
  pants: at(17, ['....KKKK', '....KKK.', '....KKK.', '....KKK.', '....kKK.']),
  shorts: at(17, ['....KKKK', '....KKK.', '....kKK.']),
  skirt: at(17, ['....KKKK', '...KKKKK', '...kKKKK']),
};

const SHOE_SHAPES: Record<Shoes, Layer> = {
  sneakers: at(22, ['...XXXX.', '...WWWW.']),
  sandals: at(22, ['...SXSS.', '...xxxx.']),
  boots: at(20, ['....XXX.', '....XXX.', '...XXXX.', '...xxxx.']),
};

const HEAD_SHAPES: Record<Head, Layer | null> = {
  none: null,
  cap: at(1, ['.....XXX', '....XXXX', '...XXXXX', '..xxxxxx']),
  beanie: at(0, ['.......X', '....XXXX', '...XXXXX', '...xxxxx']),
  bucket: at(1, ['.....XXX', '....XXXX', '...XXXXX', '..xxxxxx', '..x.....']),
  straw: at(1, ['.....ZZZ', '....ZZZZ', '....DDDD', '.zZZZZZZ']),
  conical: at(-1, ['.......Z', '......ZZ', '.....ZZZ', '....ZZZZ', '...ZZZZZ', '.zzzzzzz']),
  cowboy: at(0, ['.....XXX', '....XXXX', '.x..xxxx', '.xxxxxxx']),
  bandana: at(1, ['.....XXX', '....XWXX', '...XXXXX', '...x....']),
  headband: at(3, ['...XXXXX']),
  flowers: at(2, ['...FqfqF']),
  bunny: at(-3, ['....XX..', '....iX..', '....iX..', '....iX..', '....XX..', '...XXXXX']),
};
// These sit on the hair instead of covering the top of the head.
const OVER_HAIR: readonly Head[] = ['headband', 'flowers', 'bunny'];
// A hat covers the top of the head: hair above this figure row is not drawn under it.
const HAT_LINE = 4;

const EYES_SHAPES: Record<Eyes, Layer | null> = {
  none: null,
  glasses: at(5, ['....GGG.', '...GgEgG', '....GGG.']),
  // Lopsided: the patch over the eye on the right of the picture, its strap across the brow to the other ear.
  eyepatch: at(5, ['....DD...DDD....', '...D.....DDD....', '..........D.....']),
  sunglasses: at(6, ['...GDDGG', '....DD..']),
  hearts: at(5, ['....I.I.', '....IIII', '.....I..']),
  sleepmask: at(4, ['...xXXXX', '....XXX.']),
};
const LOWER_SHAPES: Record<Lower, Layer | null> = {
  none: null,
  moustache: at(7, ['.....hhh']),
  beard: at(7, ['...H....', '...HHHH.', '....HHHH', '......HH']),
  mask: at(7, ['...xXXXX', '....XXXX', '.....XXX']),
  freckles: at(7, ['...d.d..', '....d...']),
  blush: at(7, ['....rr..']),
};

const NECK_SHAPES: Record<Neck, Layer | null> = {
  none: null,
  headphones: at(0, ['.....DDD', '....D...', '...D....', '...D....', '...D....', '..DD....', '..DD....']),
  camera: at(11, ['...D....', '....D...', '.....D..', '.....DDD', '.....DDA', '......DD']),
  scarf: at(10, ['.....XXX', '...XXXXX', '......xX', '......x.']),
  pillow: at(9, ['...XX...', '...XXXX.', '....xXXX']),
  necklace: at(11, ['......Y.', '.......Y']),
  lei: at(10, ['....FfqF', '.....qFf', '......fF']),
  tie: at(10, ['.......x', '.......X', '.......X', '.......X', '.......X', '.......x']),
  bowtie: at(10, ['.....XXx']),
  badge: at(10, ['.....D..', '.....D..', '......D.', '......DD', '.....WWW', '.....WBB', '.....WWW']),
  lanyard: at(11, ['....X...........', '.....X..........', '......X.........', '.......X........', '........XDD.....', '.........DB.....', '..........DD....']),
};

// Things on the back in two layers: what is behind the body, and the straps (or ties) over the clothes.
const STRAP = at(11, ['...........D....', '.........DD.....', '........D.......', '......DD........', '.....D..........', '....D...........']);
const BACK_SHAPES: Record<Back, { behind?: Layer; front?: Layer } | null> = {
  none: null,
  backpack: {
    behind: at(10, ['.XXX....', 'xX......', 'xX......', 'xX......', 'xX......', 'xX......', 'xX......']),
    front: at(11, ['.....x..', '.....x..', '.....x..', '.....x..', '.....x..']),
  },
  hiking: {
    behind: at(-2, [
      '....RRRR', '...XXXXX', '...xXXXX', '...XXXXX', '...XXXXX', '...XXXXX', '...XXXXX', '...XXXXX', '...XXXXX',
      'xXXXXXXX', 'xXXXXXXX', 'xXX.....', 'xXX.....', 'xXX.....', 'xXX.....', 'xXX.....', 'xXX.....', 'xxx.....',
    ]),
    front: at(11, ['.....x..', '.....x..', '.....xxx', '.....x..', '.....x..']),
  },
  // Lopsided: the neck up past the right shoulder, the body out by the right leg, the strap across the chest.
  guitar: {
    behind: at(-2, [
      '.......................DD.......',
      '.......................DD.......',
      '.......................D........',
      ...Array<string>(13).fill('.......................n........'),
      '......................www.......',
      '.....................wwwww......',
      '.....................wwDww......',
      '.....................wwwww......',
      '......................www.......',
      '.....................wwwww......',
      '....................wwwwwv......',
      '.....................wwwv.......',
    ]),
    front: STRAP,
  },
  // A bag worn across the body: the strap from the right shoulder, the bag at the left hip.
  messenger: {
    front: at(11, ['...........x....', '..........x.....', '.........x......', '........x.......', '.......x........', '..xxxxx.........', '..XXXXX.........', '..XXXXX.........', '..xxxxx.........']),
  },
  ukulele: {
    behind: at(4, [
      '......................D.........',
      '......................D.........',
      '......................n.........',
      '......................n.........',
      '......................n.........',
      '......................n.........',
      '......................n.........',
      '......................n.........',
      '......................n.........',
      '......................n.........',
      '.....................ww.........',
      '....................wwww........',
      '....................wDww........',
      '....................wwww........',
      '.....................ww.........',
      '....................wwwv........',
    ]),
    front: STRAP,
  },
  skateboard: {
    behind: at(-1, [
      '.....................Xx.........',
      '....................DXxD........',
      '....................DXxD........',
      '.....................Xx.........',
      '.....................Xx.........',
      '.....................Xx.........',
      '.....................Xx.........',
      '.....................Xx.........',
      '.....................Xx.........',
      '.....................Xx.........',
      '.....................Xx.........',
      '.....................Xx.........',
      '.....................Xx.........',
      '.....................Xx.........',
      '.....................Xx.........',
      '.....................Xx.........',
      '.....................Xx.........',
      '....................DXxD........',
      '....................DXxD........',
      '.....................Xx.........',
    ]),
    front: at(11, ['.....D..', '.....D..', '.....D..', '.....D..', '.....D..']),
  },
  tripod: {
    behind: at(-3, [
      '........DDDD....................',
      '.........DL.....................',
      '.........DL.....................',
      '.........DL.....................',
      '.........DL.....................',
      '.........DL.....................',
      '.........DL.....................',
      '.........DL.....................',
      '.........DL.....................',
      '.........DL.....................',
      '.........DL.....................',
      '.........DL.....................',
      '.........DL.....................',
      '.........DL.....................',
      '.........DL.....................',
      '.........DL.....................',
      '.........DL.....................',
      '.........DL.....................',
    ]),
    front: at(11, STRAP.rows.map((r) => [...r].reverse().join(''))),
  },
  cape: {
    behind: at(11, ['..XXXXXX', '.XXXXXXX', '.XXXXXXX', 'xXXXXXXX', 'xXXXXXXX', 'xXXXXXXX', 'xXXXXXXX', 'xXXXXXXX', 'xxXXXXXX', '.xxXXXXX']),
    front: at(10, ['......xx']),
  },
  wings: {
    behind: at(7, ['.y......', 'yWy.....', 'yWWy....', 'yWWWy...', '.yWWW...', '..yWW...', '...yW...', '....y...']),
  },
};

// Things in the hand on the right of the picture; the left hand mirrors them.
const HAND_SHAPES: Record<Hand, Layer | null> = {
  none: null,
  coffee: at(14, ['..............A.', '............AAAA', '............UUUU', '............AAAU', '............UUUU']),
  phone: at(15, ['............DD..', '............DB..', '............DD..']),
  passport: at(15, ['............VV..', '............VY..', '............VV..']),
  bubbletea: at(12, ['.............D..', '.............D..', '............WWWW', '............QQQQ', '............QQQQ', '............EQEQ', '............QEQE']),
  coconut: at(13, ['.............i..', '............qqi.', '...........qqqqq', '...........qqqqq', '............qqq.']),
  icecream: at(12, ['.............FF.', '............FFFF', '............FFFF', '.............zz.', '.............zz.', '..............z.']),
  book: at(14, ['............XXX.', '............XWX.', '............XWX.', '............XXX.']),
  umbrella: at(-3, [
    '...........XX...',
    '.........XXXXXX.',
    '........XXXXXXXX',
    '........x.x.x.x.',
    '.............D..',
    '.............D..',
    '.............D..',
    '.............D..',
    '.............D..',
    '.............D..',
    '.............D..',
    '.............D..',
    '.............D..',
    '.............D..',
    '.............D..',
    '.............D..',
    '.............D..',
    '.............D..',
    '.............D..',
    '.............D..',
    '............DD..',
  ]),
  laptop: at(14, ['...LLLLL', '...LLLLW', '..SLLLLL']), // both hands
};

// Things standing beside the figure, drawn on the left; bottom row on the floor. Animals have a second frame (`b`):
// the cat flicks its tail, the dog pricks its ears and pants, the rabbit twitches its ears.
type SideShape = { a: string[]; b?: string[] };
const SIDE_SHAPES: Record<Side, SideShape | null> = {
  none: null,
  suitcase: { a: ['..DDDD..', '..D..D..', '.XXXXXX.', '.XxXXxX.', '.XxXXxX.', '.XxXXxX.', '.XxXXxX.', '.XxXXxX.', '.XXXXXX.', '.xxxxxx.', '..D..D..'] },
  surfboard: { a: ['...XX...', '..XXXX..', '..XXXX..', ...Array<string>(15).fill('.XXxxXX.'), '..XxxX..', '..XXXX..', '...xx...'] },
  yogamat: { a: ['..XXXX..', '.XxxxxX.', '.XXXXXX.', '.XXXXXX.', '.DDDDDD.', '.XXXXXX.', '.XXXXXX.', '.XXXXXX.', '.XXXXXX.', '.DDDDDD.', '.XXXXXX.', '..XXXX..'] },
  plant: { a: ['...L.L..', '..LL.LL.', '.LLLLL..', '..LlLLL.', '.LLLlL..', '...LL...', '..TTTT..', '.tTTTTT.', '..TTTT..', '..tTTT..', '...TT...'] },
  cat: {
    a: ['.o....o.', '.Oo..oO.', '.OOOOOO.', '.OEOOEO.', '..OiiO..', '..OOOO..', '.OOOOOO.', '.OOOOOOo', '.OO..OOo'],
    b: ['.o....o.', '.Oo..oO.', '.OOOOOO.', '.OEOOEO.', '..OiiO..', '..OOOO.o', '.OOOOOOo', '.OOOOOO.', '.OO..OO.'],
  },
  dog: {
    a: ['bb....bb', 'bbBBBBbb', '.BEBBEB.', '..BBBB..', '..BEEB..', '.BBBBBB.', '.BWWWWB.', '.BBBBBB.', '.BB..BB.'],
    b: ['.b....b.', 'bbBBBBbb', '.BEBBEB.', '..BBBB..', '..BEEB..', '.BBiiBB.', '.BWWWWB.', '.BBBBBB.', '.BB..BB.'],
  },
  tent: { a: ['...XX...', '..XXXX..', '..XXXX..', '.XXDDXX.', '.XXDDXX.', 'XXXDDXXX', 'XXXDDXXX', 'xxxxxxxx'] },
  cactus: { a: ['...q....', '.q.q....', '.qqq.q..', '...qqq..', '...q....', '..TTTT..', '..tTTT..', '...TT...'] },
  rabbit: {
    a: ['..u..u..', '..ui.iu.', '..uuuu..', '.uEuuEu.', '..uiiu..', '..uuuu..', '.uuuuuuW', '.uu..uu.'],
    b: ['.u....u.', '..ui.iu.', '..uuuu..', '.uEuuEu.', '..uiiu..', '..uuuu..', '.uuuuuuW', '.uu..uu.'],
  },
};

// Which choices take a colour from the cloth palette; the rest have fixed colours.
export const COLOURED = {
  head: ['cap', 'beanie', 'bucket', 'cowboy', 'bandana', 'headband', 'bunny'] as readonly Head[],
  eyes: ['sleepmask'] as readonly Eyes[],
  lower: ['mask'] as readonly Lower[],
  neck: ['scarf', 'pillow', 'tie', 'bowtie', 'lanyard'] as readonly Neck[],
  back: ['backpack', 'hiking', 'messenger', 'skateboard', 'cape'] as readonly Back[],
  hand: ['book', 'umbrella'] as readonly Hand[],
  side: ['suitcase', 'surfboard', 'yogamat', 'tent'] as readonly Side[],
};

// [colour, shade] pairs. Six skin tones, then four for fun (green, blue, lavender, zombie grey).
export const SKIN_TONES = [
  ['#f8dcc2', '#e9bf9c'],
  ['#eab88e', '#d49b6e'],
  ['#c98a55', '#a96e3e'],
  ['#8c5733', '#6e4224'],
  ['#dcb98c', '#c49e6e'],
  ['#5e3b24', '#472b19'],
  ['#9fd49a', '#7fb87a'],
  ['#8fb8ea', '#6f98cc'],
  ['#c7abe9', '#a98dcc'],
  ['#b9c2b4', '#99a294'],
] as const;
// The fun colours are for picking on purpose; a random nomad gets one of the first six.
const REAL_SKIN_TONES = 6;
export const HAIR_COLOURS = [
  ['#2b2420', '#161210'],
  ['#6b4226', '#4e2f1a'],
  ['#e3b75a', '#c2953c'],
  ['#f28fab', '#d56f8c'],
  ['#c4c4c4', '#9a9a9a'],
] as const;
// Clothes, hats, bags, shoes and the coloured things beside the figure share one palette; shades are derived.
export const CLOTH = [
  '#ff5a5f', // red
  '#f5b83d', // yellow
  '#3fa58f', // teal
  '#3f6b5a', // forest
  '#6f8f4e', // olive
  '#7fc4e8', // sky
  '#5a7fb0', // denim
  '#2f3a4f', // navy
  '#9b7fd1', // lavender
  '#4a3b6b', // plum
  '#c2a878', // khaki
  '#ead9b0', // sand
  '#f2efe9', // cream
  '#6b7280', // grey
  '#3a3a3a', // charcoal
  '#232323', // black
] as const;
const YELLOW = 1;
const FIXED: Record<string, string> = {
  E: '#222222', // eyes, animals' eyes and noses
  M: '#b5524a', // mouth
  W: '#ffffff', // shirt, drawstring, soles, dog's chest
  G: '#222222', // glasses frame
  g: '#dfeaf2', // lenses
  D: '#333333', // headphones, camera, phone, straps, handles
  B: '#7fc4e8', // phone screen
  A: '#7a5236', // coffee, lens
  U: '#e9dcc6', // cup
  L: '#c9ced6', // laptop
  V: '#2b3f73', // passport
  Y: '#e3b75a', // passport crest
  R: '#ead9b0', // sleeping roll
  w: '#b07a45', // guitar
  v: '#8a5a30', // guitar shade
  n: '#d9b27a', // guitar neck
  T: '#c7714a', // pot
  t: '#a85a38', // pot shade
  O: '#f0a050', // cat
  o: '#d4823a', // cat shade
  i: '#f08aa6', // cat's nose, ears' insides
  Z: '#e8c872', // straw
  z: '#c9a650', // straw shade
  F: '#ff7aa8', // flowers
  f: '#ffd166', // flowers
  q: '#4caf6a', // flowers' leaves
  I: '#ff5a8a', // heart sunglasses
  d: '#9a5a36', // freckles
  r: '#f4a3a3', // blush
  l: '#2f7a4a', // leaf shade
  b: '#6e4a26', // dog's ears
  Q: '#c99a6a', // milk tea
  u: '#bba58c', // rabbit
  y: '#b9bec6', // wing edges
};
// Beside the figure, L and B mean leaves and the dog instead of the laptop and the phone screen.
const LEAF = '#3f9b62';
const DOG = '#a8743f';

export type Avatar = {
  skin: number;
  hair: Hair;
  hairColour: number;
  top: Top;
  topColour: number;
  bottom: Bottom;
  bottomColour: number;
  shoes: Shoes;
  shoesColour: number;
  head: Head;
  headColour: number;
  eyes: Eyes;
  eyesColour: number;
  lower: Lower;
  lowerColour: number;
  neck: Neck;
  neckColour: number;
  back: Back;
  backColour: number;
  handL: Hand;
  handLColour: number;
  handR: Hand;
  handRColour: number;
  sideL: Side;
  sideLColour: number;
  sideR: Side;
  sideRColour: number;
};

const BASE: Avatar = {
  skin: 1, hair: 'short', hairColour: 0, top: 'tee', topColour: 5, bottom: 'pants', bottomColour: 14,
  shoes: 'sneakers', shoesColour: 15, head: 'none', headColour: 0, eyes: 'none', eyesColour: 0, lower: 'none', lowerColour: 12, neck: 'none', neckColour: 0,
  back: 'none', backColour: 0, handL: 'none', handLColour: 0, handR: 'none', handRColour: 0, sideL: 'none', sideLColour: 0, sideR: 'none', sideRColour: 0,
};
const av = (a: Partial<Avatar>): Avatar => ({ ...BASE, ...a });

// Ready-made nomads; their names are `avatar.preset.<id>` in the dictionaries.
export const PRESETS = [
  { id: 'engineer', avatar: av({ hair: 'short', top: 'hoodie', topColour: 3, bottomColour: 7, eyes: 'glasses', back: 'backpack', backColour: 0, handL: 'laptop', handR: 'laptop' }) },
  { id: 'designer', avatar: av({ skin: 0, hair: 'bun', hairColour: 3, top: 'blazer', topColour: 15, bottom: 'skirt', bottomColour: 15, shoes: 'boots', handR: 'coffee', sideL: 'plant' }) },
  { id: 'creator', avatar: av({ skin: 2, hair: 'long', hairColour: 1, top: 'tee', topColour: 1, bottom: 'shorts', bottomColour: 6, shoesColour: 5, neck: 'camera' }) },
  { id: 'surfer', avatar: av({ skin: 2, hair: 'curly', hairColour: 2, top: 'aloha', topColour: 2, bottom: 'shorts', bottomColour: 11, shoes: 'sandals', shoesColour: 2, sideR: 'surfboard', sideRColour: 1 }) },
  { id: 'backpacker', avatar: av({ skin: 3, hair: 'pony', top: 'tank', topColour: 4, bottomColour: 10, shoes: 'boots', shoesColour: 14, head: 'cap', headColour: 0, back: 'hiking', backColour: 7, sideL: 'dog' }) },
  { id: 'silver', avatar: av({ skin: 0, hair: 'short', hairColour: 4, top: 'tee', topColour: 6, bottomColour: 10, shoesColour: 7, eyes: 'glasses', handL: 'passport', sideR: 'suitcase', sideRColour: 0 }) },
  { id: 'yogi', avatar: av({ skin: 2, hair: 'bun', top: 'tank', topColour: 8, bottomColour: 9, shoes: 'sandals', shoesColour: 9, sideL: 'plant', sideR: 'yogamat', sideRColour: 2 }) },
  { id: 'manager', avatar: av({ hair: 'short', hairColour: 1, top: 'blazer', topColour: 7, bottomColour: 13, neck: 'headphones', handL: 'laptop', handR: 'laptop' }) },
  { id: 'gapyear', avatar: av({ skin: 0, hair: 'long', hairColour: 2, top: 'hoodie', topColour: 0, bottom: 'shorts', bottomColour: 6, shoesColour: 5, head: 'beanie', headColour: 1, back: 'guitar', sideL: 'cat' }) },
  { id: 'cafe', avatar: av({ hair: 'buzz', top: 'tee', topColour: 12, bottomColour: 14, shoesColour: 0, neck: 'headphones', handL: 'phone', handR: 'coffee' }) },
] as const;
export type PresetId = (typeof PRESETS)[number]['id'];

export const DEFAULT_AVATAR: Avatar = PRESETS[0].avatar;

export const sameAvatar = (a: Avatar, b: Avatar) => (Object.keys(a) as (keyof Avatar)[]).every((k) => a[k] === b[k]);
export const presetOf = (a: Avatar): PresetId | undefined => PRESETS.find((p) => sameAvatar(p.avatar, a))?.id;

// Putting something in one hand. A two-handed thing fills both; anything else frees the other hand from one.
export function withHand(a: Avatar, side: 'handL' | 'handR', hand: Hand): Avatar {
  const other = side === 'handL' ? 'handR' : 'handL';
  if (TWO_HANDED.includes(hand)) return { ...a, handL: hand, handR: hand };
  return { ...a, [side]: hand, [other]: TWO_HANDED.includes(a[other]) ? 'none' : a[other] };
}

const pick = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];
const index = (list: readonly unknown[]) => Math.floor(Math.random() * list.length);
// Extras turn up about a third of the time each, so a random nomad isn't buried in things.
const maybe = <T>(list: readonly T[]): T => (Math.random() < 0.35 ? pick(list.slice(1)) : list[0]);
export function randomAvatar(): Avatar {
  const a: Avatar = {
    skin: Math.floor(Math.random() * REAL_SKIN_TONES),
    hair: pick(HAIRS),
    hairColour: index(HAIR_COLOURS),
    top: pick(TOPS),
    topColour: index(CLOTH),
    bottom: pick(BOTTOMS),
    bottomColour: index(CLOTH),
    shoes: pick(SHOES),
    shoesColour: index(CLOTH),
    head: maybe(HEADS),
    headColour: index(CLOTH),
    eyes: maybe(EYES),
    eyesColour: index(CLOTH),
    lower: maybe(LOWERS),
    lowerColour: index(CLOTH),
    neck: maybe(NECKS),
    neckColour: index(CLOTH),
    back: maybe(BACKS),
    backColour: index(CLOTH),
    handL: 'none',
    handLColour: index(CLOTH),
    handR: 'none',
    handRColour: index(CLOTH),
    sideL: maybe(SIDES),
    sideLColour: index(CLOTH),
    sideR: maybe(SIDES),
    sideRColour: index(CLOTH),
  };
  return withHand(withHand(a, 'handL', maybe(HANDS)), 'handR', maybe(HANDS));
}

// Whatever was stored, an avatar every field of which is valid; unknown parts fall back to the default's.
export function sanitizeAvatar(raw: unknown): Avatar {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_AVATAR;
  const of = <T>(list: readonly T[], k: keyof Avatar): T => (list.includes(r[k] as T) ? (r[k] as T) : (d[k] as T));
  const num = (list: readonly unknown[], k: keyof Avatar): number => {
    const v = r[k];
    return Number.isInteger(v) && (v as number) >= 0 && (v as number) < list.length ? (v as number) : (d[k] as number);
  };
  const a: Avatar = {
    skin: num(SKIN_TONES, 'skin'),
    hair: of(HAIRS, 'hair'),
    hairColour: num(HAIR_COLOURS, 'hairColour'),
    top: of(TOPS, 'top'),
    topColour: num(CLOTH, 'topColour'),
    bottom: of(BOTTOMS, 'bottom'),
    bottomColour: num(CLOTH, 'bottomColour'),
    shoes: of(SHOES, 'shoes'),
    shoesColour: num(CLOTH, 'shoesColour'),
    head: of(HEADS, 'head'),
    headColour: num(CLOTH, 'headColour'),
    eyes: of(EYES, 'eyes'),
    eyesColour: num(CLOTH, 'eyesColour'),
    lower: of(LOWERS, 'lower'),
    lowerColour: num(CLOTH, 'lowerColour'),
    neck: of(NECKS, 'neck'),
    neckColour: num(CLOTH, 'neckColour'),
    back: of(BACKS, 'back'),
    backColour: num(CLOTH, 'backColour'),
    handL: of(HANDS, 'handL'),
    handLColour: num(CLOTH, 'handLColour'),
    handR: of(HANDS, 'handR'),
    handRColour: num(CLOTH, 'handRColour'),
    sideL: of(SIDES, 'sideL'),
    sideLColour: num(CLOTH, 'sideLColour'),
    sideR: of(SIDES, 'sideR'),
    sideRColour: num(CLOTH, 'sideRColour'),
  };
  // A two-handed thing is in both hands or neither.
  const both = TWO_HANDED.find((h) => a.handL === h || a.handR === h);
  return both && a.handL !== a.handR ? withHand(a, a.handL === both ? 'handL' : 'handR', both) : a;
}

// A colour darkened by a fraction, for the shade of a cloth colour.
function shade(hex: string, by = 0.18) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.round(((n >> s) & 255) * (1 - by)).toString(16).padStart(2, '0');
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}
// The X / x pair for a part coloured from the cloth palette.
const own = (i: number) => ({ X: CLOTH[i], x: shade(CLOTH[i]) });

export type Pixels = (string | null)[][]; // [row][column] → colour, null where transparent

// The figure row where the shoes start: on a dip, everything above it sinks a pixel and the legs get shorter.
const ANKLE = 22;

export type Pose = {
  blink?: boolean; // eyes closed
  dip?: boolean; // the low half of the idle bob: the figure sinks a pixel, its shoes stay on the floor
  wag?: boolean; // the animals beside the figure in their second frame
  only?: 'figure' | 'beside'; // draw just the figure (with what it wears and carries) or just what stands beside it
};

// One pose of the avatar as a SIZE×SIZE grid of colours. With no pose: eyes open, standing still, everything drawn.
export function compose(a: Avatar, { blink = false, dip = false, wag = false, only }: Pose = {}): Pixels {
  const grid: Pixels = Array.from({ length: SIZE }, () => Array<string | null>(SIZE).fill(null));
  const top = CLOTH[a.topColour];
  const bottom = CLOTH[a.bottomColour];
  const base: Record<string, string> = {
    ...FIXED,
    S: SKIN_TONES[a.skin][0],
    s: SKIN_TONES[a.skin][1],
    H: HAIR_COLOURS[a.hairColour][0],
    h: HAIR_COLOURS[a.hairColour][1],
    C: top,
    c: shade(top),
    P: a.topColour === YELLOW ? '#ffffff' : '#ffd166',
    K: bottom,
    k: shade(bottom),
  };
  const put = (x: number, y: number, ch: string, pal: Record<string, string>) => {
    const colour = pal[ch];
    if (colour && y >= 0 && y < SIZE && x >= 0 && x < SIZE) grid[y][x] = colour;
  };
  const draw = (layer: Layer | null | undefined, pal = base, opts: { from?: number; flip?: boolean; planted?: boolean } = {}) => {
    layer?.rows.forEach((row, i) => {
      const y0 = layer.y + i;
      if (opts.from !== undefined && y0 < opts.from) return;
      const y = dip && !opts.planted && y0 < ANKLE ? y0 + 1 : y0;
      const wide = row.length === SIZE;
      let line = wide || row.length === FIG_W ? row : row + [...row].reverse().join('');
      if (opts.flip) line = [...line].reverse().join('');
      const x0 = wide ? 0 : OX;
      for (let x = 0; x < line.length; x++) put(x + x0, y + OY, line[x], pal);
    });
  };
  const drawSide = (side: Side, colour: number, right: boolean) => {
    const shape = SIDE_SHAPES[side];
    if (!shape) return;
    const rows = (wag && shape.b) || shape.a;
    const pal = { ...base, ...own(colour), L: LEAF, B: DOG };
    rows.forEach((row, i) => {
      const y = FLOOR - (rows.length - 1 - i) + OY;
      for (let x = 0; x < SIDE_W; x++) put(right ? SIZE - 1 - x : x, y, row[x], pal);
    });
  };

  if (only !== 'beside') {
    const hair = HAIR_SHAPES[a.hair];
    const bag = BACK_SHAPES[a.back];
    const bagPal = { ...base, ...own(a.backColour) };
    draw(bag?.behind, bagPal);
    draw(hair.back);
    draw(blink ? BODY_B : BODY_A);
    draw(BOTTOM_SHAPES[a.bottom]);
    draw(SHOE_SHAPES[a.shoes], { ...base, ...own(a.shoesColour) }, { planted: true });
    draw(TOP_SHAPES[a.top]);
    draw(bag?.front, bagPal);
    draw(hair.front, base, a.head === 'none' || OVER_HAIR.includes(a.head) ? {} : { from: HAT_LINE });
    draw(LOWER_SHAPES[a.lower], { ...base, ...own(a.lowerColour) });
    draw(HEAD_SHAPES[a.head], { ...base, ...own(a.headColour) });
    draw(EYES_SHAPES[a.eyes], { ...base, ...own(a.eyesColour) });
    draw(NECK_SHAPES[a.neck], { ...base, ...own(a.neckColour) }); // headphones go over hats
    if (TWO_HANDED.includes(a.handR)) draw(HAND_SHAPES[a.handR]);
    else {
      draw(HAND_SHAPES[a.handR], { ...base, ...own(a.handRColour) });
      draw(HAND_SHAPES[a.handL], { ...base, ...own(a.handLColour) }, { flip: true });
    }
  }
  if (only !== 'figure') {
    drawSide(a.sideL, a.sideLColour, false);
    drawSide(a.sideR, a.sideRColour, true);
  }
  return grid;
}

// Runs of one colour along a row, so the SVG needs one rect per run instead of one per pixel.
export function runs(pixels: Pixels, rows?: Set<number>) {
  const out: { x: number; y: number; w: number; fill: string }[] = [];
  pixels.forEach((row, y) => {
    if (rows && !rows.has(y)) return;
    for (let x = 0; x < row.length; ) {
      let end = x + 1;
      while (end < row.length && row[end] === row[x]) end++;
      const fill = row[x];
      if (fill) out.push({ x, y, w: end - x, fill });
      x = end;
    }
  });
  return out;
}
