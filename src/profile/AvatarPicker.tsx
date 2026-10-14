import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { ArrowsClockwise } from '@phosphor-icons/react/dist/csr/ArrowsClockwise';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { Shuffle } from '@phosphor-icons/react/dist/csr/Shuffle';
import { Avatar } from '../components/Avatar';
import {
  BACKS,
  BOTTOMS,
  CLOTH,
  COLOURED,
  CUSTOM_PALETTE,
  clothHex,
  isHex,
  EYES,
  HAIRS,
  HAIR_COLOURS,
  HANDS,
  HEADS,
  LOWERS,
  NECKS,
  PRESETS,
  SHOES,
  SIDES,
  SKIN_TONES,
  TOPS,
  presetOf,
  randomAvatar,
  withOption,
  type Avatar as AvatarData,
  type Colour,
  type Slot,
} from '../lib/avatar';
import { t, type Key } from '../lib/i18n';
import './AvatarPicker.css';

type Crop = readonly [number, number, number];
// Close-ups of the 32×32 canvas, [x, y, size], so each choice shows the part it changes.
const HEAD: Crop = [8, 2, 16];
const BODY: Crop = [8, 12, 16];
const CHEST: Crop = [8, 6, 16];
// Wide enough for both hands and an umbrella held up over the head.
const HANDS_VIEW: Crop = [6, 1, 24];
const LEGS: Crop = [8, 17, 16];
const FULL: Crop = [0, 0, 32];
// The side close-ups reach 2 pixels past the canvas edge, so the thing there isn't flush with the tile.
const LEFT: Crop = [-2, 6, 26];
const RIGHT: Crop = [8, 6, 26];

// Pointing at a choice with a mouse tries it on: the large figure (and the other tiles) show it until the pointer
// leaves. Touch screens have no hover, so a tap simply picks.
const Preview = createContext<(next: AvatarData | null) => void>(() => {});
function usePreview(next: AvatarData) {
  const preview = useContext(Preview);
  return {
    onPointerEnter: (e: ReactPointerEvent) => e.pointerType === 'mouse' && preview(next),
    onPointerLeave: () => preview(null),
  };
}

type Tab = 'presets' | 'skin' | 'hair' | 'clothes' | 'extras' | 'carry';
type Group = 'top' | 'bottom' | 'shoes' | 'head' | 'eyes' | 'lower' | 'neck' | 'back' | 'handL' | 'handR' | 'sideL' | 'sideR';
const TABS: { id: Tab; label: Key; groups?: Group[] }[] = [
  { id: 'presets', label: 'avatar.presets' },
  { id: 'skin', label: 'avatar.skin' },
  { id: 'hair', label: 'avatar.hair' },
  { id: 'clothes', label: 'avatar.tab.clothes', groups: ['top', 'bottom', 'shoes'] },
  { id: 'extras', label: 'avatar.tab.extras', groups: ['head', 'eyes', 'lower', 'neck'] },
  { id: 'carry', label: 'avatar.tab.carry', groups: ['back', 'handL', 'handR', 'sideL', 'sideR'] },
];
// Groups that hold something optional, marked with a dot on their chip once something is in them.
const OPTIONAL: Group[] = ['head', 'eyes', 'lower', 'neck', 'back', 'handL', 'handR', 'sideL', 'sideR'];

// The paper doll on the profile page: the figure large on the left, and on the right one tab per part, some split
// into smaller groups. Every choice is a small picture of the figure wearing it. Picks go to onChange; saving is up
// to the page.
// `onDownload`, when given, puts a download button over the large figure (shown on hover); the page passes it only
// while the character on screen is the saved one.
export function AvatarPicker({ value, onChange, onDownload }: { value: AvatarData; onChange: (next: AvatarData) => void; onDownload?: () => void }) {
  const [tab, setTab] = useState<Tab>('presets');
  const [groups, setGroups] = useState<Partial<Record<Tab, Group>>>({});
  const [trying, setTrying] = useState<AvatarData | null>(null);
  const [view, setView] = useState<'front' | 'back'>('front');
  const shown = trying ?? value;
  const preset = presetOf(value);
  const current = TABS.find((x) => x.id === tab)!;
  const group = current.groups ? (groups[tab] ?? current.groups[0]) : undefined;

  // One tile per option: just that part, so the eye compares the parts and not ten near-identical people; the
  // large figure on the left shows the whole. Parts of the face keep a grey silhouette of the head for position;
  // everything else is drawn alone and the tile zooms to it.
  const WITH_HEAD: Slot[] = ['skin', 'hair', 'head', 'eyes', 'lower'];
  const tiles = <T extends string | number>(
    slot: Slot,
    options: readonly T[],
    apply: (a: AvatarData, o: T) => AvatarData,
    isOn: (o: T) => boolean,
    crop: Crop,
    label: (o: T, i: number) => string,
    showLabel = true,
  ) => (
    <Tiles>
      {options.map((o, i) => (
        <Tile key={String(o)} checked={isOn(o)} label={label(o, i)} showLabel={showLabel} next={apply(value, o)} onClick={() => onChange(apply(value, o))}>
          <Avatar avatar={apply(shown, o)} crop={crop} focus={slot} bare={!WITH_HEAD.includes(slot)} />
        </Tile>
      ))}
    </Tiles>
  );
  // The common case: one field, its options named `avatar.<prefix>.<option>`. An extra arrives in its own default
  // colour (withOption); clothes keep the colour already chosen.
  const field = <K extends keyof AvatarData & Slot>(key: K, options: readonly AvatarData[K][], crop: Crop, prefix: string = key) =>
    tiles(key, options, (a, o) => withOption(a, key, o), (o) => value[key] === o, crop, (o) => t(`avatar.${prefix}.${o}` as Key));
  // Cloth colours also take a custom hex (the "+" swatch); hair colours are the fixed list only.
  const colours = <K extends keyof AvatarData>(key: K, list: readonly string[], custom = list === CLOTH) => (
    <Swatches colours={list} custom={custom} value={value[key] as Colour} apply={(c) => ({ ...value, [key]: c })} onChange={onChange} />
  );
  const hand = (side: 'handL' | 'handR') => (
    <>
      {tiles(side, HANDS, (a, o) => withOption(a, side, o), (o) => value[side] === o, HANDS_VIEW, (o) => t(`avatar.hand.${o}` as Key))}
      {COLOURED.hand.includes(value[side]) && colours(side === 'handL' ? 'handLColour' : 'handRColour', CLOTH)}
    </>
  );
  const side = (key: 'sideL' | 'sideR') => (
    <>
      {field(key, SIDES, key === 'sideL' ? LEFT : RIGHT, 'side')}
      {COLOURED.side.includes(value[key]) && colours(key === 'sideL' ? 'sideLColour' : 'sideRColour', CLOTH)}
    </>
  );

  const body: Record<Group, () => ReactNode> = {
    top: () => (
      <>
        {field('top', TOPS, BODY)}
        {colours('topColour', CLOTH)}
      </>
    ),
    bottom: () => (
      <>
        {field('bottom', BOTTOMS, LEGS)}
        {colours('bottomColour', CLOTH)}
      </>
    ),
    shoes: () => (
      <>
        {field('shoes', SHOES, LEGS)}
        {colours('shoesColour', CLOTH)}
      </>
    ),
    head: () => (
      <>
        {field('head', HEADS, HEAD)}
        {COLOURED.head.includes(value.head) && colours('headColour', CLOTH)}
      </>
    ),
    eyes: () => (
      <>
        {field('eyes', EYES, HEAD)}
        {COLOURED.eyes.includes(value.eyes) && colours('eyesColour', CLOTH)}
      </>
    ),
    lower: () => (
      <>
        {field('lower', LOWERS, HEAD)}
        {COLOURED.lower.includes(value.lower) && colours('lowerColour', CLOTH)}
      </>
    ),
    neck: () => (
      <>
        {field('neck', NECKS, CHEST)}
        {COLOURED.neck.includes(value.neck) && colours('neckColour', CLOTH)}
      </>
    ),
    back: () => (
      <>
        {field('back', BACKS, FULL)}
        {COLOURED.back.includes(value.back) && colours('backColour', CLOTH)}
      </>
    ),
    handL: () => hand('handL'),
    handR: () => hand('handR'),
    sideL: () => side('sideL'),
    sideR: () => side('sideR'),
  };

  return (
    <Preview.Provider value={setTrying}>
      <div className="ap">
        <div className="ap-stage">
          <div className="ap-figure">
            <Avatar avatar={shown} animate view={view} label={preset ? t(`avatar.preset.${preset}` as Key) : t('profile.avatar')} />
            {onDownload && (
              <button type="button" className="ap-download" aria-label={t('avatar.download')} title={t('avatar.download')} onClick={onDownload}>
                <DownloadSimple size={16} weight="bold" />
              </button>
            )}
          </div>
          <div className="ap-actions">
            <button type="button" className="ap-turn" aria-pressed={view === 'back'} aria-label={t('avatar.turn')} title={t('avatar.turn')} onClick={() => setView(view === 'front' ? 'back' : 'front')}>
              <ArrowsClockwise size={16} weight="bold" />
            </button>
            <button type="button" className="ap-random" onClick={() => onChange(randomAvatar())}>
              <Shuffle size={14} weight="bold" /> {t('avatar.random')}
            </button>
          </div>
        </div>

        <div className="ap-panel">
          <div className="ap-tabs" role="tablist">
            {TABS.map((x) => (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={tab === x.id}
                onClick={() => {
                  setTab(x.id);
                  setTrying(null);
                }}
              >
                {t(x.label)}
              </button>
            ))}
          </div>

          <div className="ap-body" role="tabpanel">
            {current.groups && (
              <div className="ap-groups" role="tablist">
                {current.groups.map((g) => (
                  <button
                    key={g}
                    type="button"
                    role="tab"
                    aria-selected={g === group}
                    onClick={() => {
                      setGroups({ ...groups, [tab]: g });
                      setTrying(null);
                    }}
                  >
                    {OPTIONAL.includes(g) && value[g as keyof AvatarData] !== 'none' && <span className="ap-dot" aria-hidden />}
                    {t(`avatar.${g}` as Key)}
                  </button>
                ))}
              </div>
            )}
            {tab === 'presets' && (
              <Tiles>
                {PRESETS.map((p) => (
                  <Tile key={p.id} checked={p.id === preset} label={t(`avatar.preset.${p.id}` as Key)} showLabel next={p.avatar} onClick={() => onChange(p.avatar)}>
                    <Avatar avatar={p.avatar} />
                  </Tile>
                ))}
              </Tiles>
            )}
            {tab === 'skin' &&
              tiles('skin', SKIN_TONES.map((_, i) => i), (a, i) => ({ ...a, skin: i }), (i) => value.skin === i, HEAD, (_, i) => t('avatar.colour', { n: i + 1 }), false)}
            {tab === 'hair' && (
              <>
                {field('hair', HAIRS, HEAD)}
                {colours('hairColour', HAIR_COLOURS.map((c) => c[0]))}
              </>
            )}
            {group && body[group]()}
          </div>
        </div>
      </div>
    </Preview.Provider>
  );
}

function Tiles({ children }: { children: ReactNode }) {
  return (
    <div className="ap-tiles" role="radiogroup">
      {children}
    </div>
  );
}

function Tile({
  checked,
  label,
  showLabel,
  next,
  onClick,
  children,
}: {
  checked: boolean;
  label: string;
  showLabel?: boolean;
  next: AvatarData;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" role="radio" aria-checked={checked} aria-label={label} title={label} onClick={onClick} {...usePreview(next)}>
      {children}
      {showLabel && <span aria-hidden>{label}</span>}
    </button>
  );
}

function Swatches({
  colours,
  custom = false,
  value,
  apply,
  onChange,
}: {
  colours: readonly string[];
  custom?: boolean;
  value: Colour;
  apply: (c: Colour) => AvatarData;
  onChange: (next: AvatarData) => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  // The palette closes on a click outside it or on Escape
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', key);
    };
  }, [open]);
  const hex = isHex(value) ? value : undefined;
  return (
    <div className="ap-swatches" role="radiogroup" aria-label={t('avatar.colours')}>
      {colours.map((c, i) => (
        <Swatch key={c} colour={c} label={t('avatar.colour', { n: i + 1 })} checked={i === value} next={apply(i)} onClick={() => onChange(apply(i))} />
      ))}
      {custom && (
        <div className="ap-custom" ref={box}>
          {/* The "+" swatch: a rainbow ring, filled with the custom colour once one is chosen */}
          <button
            type="button"
            role="radio"
            aria-checked={!!hex}
            aria-expanded={open}
            aria-label={t('avatar.custom')}
            title={t('avatar.custom')}
            className={`ap-plus${hex ? ' has' : ''}`}
            style={hex ? ({ '--c': hex } as CSSProperties) : undefined}
            onClick={() => setOpen(!open)}
          >
            {!hex && <Plus size={12} weight="bold" />}
          </button>
          {open && (
            <div className="ap-palette" role="dialog" aria-label={t('avatar.custom')}>
              <div className="ap-grid" role="radiogroup">
                {CUSTOM_PALETTE.flatMap((rowOf, r) =>
                  rowOf.map((c, i) => (
                    <Swatch key={c} colour={c} label={t('avatar.colour', { n: r * rowOf.length + i + 1 })} checked={hex === c} next={apply(c)} onClick={() => onChange(apply(c))} square />
                  )),
                )}
              </div>
              <div className="ap-hex">
                <span className="ap-pair" aria-hidden><i style={{ background: clothHex(value) }} /><i style={{ background: shadeOf(clothHex(value)) }} /></span>
                <HexInput value={clothHex(value)} onChange={(c) => onChange(apply(c))} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const shadeOf = (hex: string, by = 0.18) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.round(((n >> s) & 255) * (1 - by)).toString(16).padStart(2, '0');
  return `#${ch(16)}${ch(8)}${ch(0)}`;
};

// A hex field that applies as soon as it holds six valid digits, and shows the current colour otherwise.
function HexInput({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <input
      className="ap-hexfield"
      value={text}
      maxLength={7}
      spellCheck={false}
      aria-label={t('avatar.hex')}
      onChange={(e) => {
        const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
        setText(v);
        if (isHex(v)) onChange(v.toLowerCase());
      }}
    />
  );
}

function Swatch({ colour, label, checked, next, onClick, square }: { colour: string; label: string; checked: boolean; next: AvatarData; onClick: () => void; square?: boolean }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={label}
      className={square ? 'square' : undefined}
      style={{ background: colour }}
      onClick={onClick}
      {...usePreview(next)}
    />
  );
}
