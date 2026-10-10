import { createContext, useContext, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import { Shuffle } from '@phosphor-icons/react/dist/csr/Shuffle';
import { Avatar } from '../components/Avatar';
import {
  BACKS,
  BOTTOMS,
  CLOTH,
  COLOURED,
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
    onPointerEnter: (e: PointerEvent) => e.pointerType === 'mouse' && preview(next),
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
export function AvatarPicker({ value, onChange }: { value: AvatarData; onChange: (next: AvatarData) => void }) {
  const [tab, setTab] = useState<Tab>('presets');
  const [groups, setGroups] = useState<Partial<Record<Tab, Group>>>({});
  const [trying, setTrying] = useState<AvatarData | null>(null);
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
  const colours = <K extends keyof AvatarData>(key: K, list: readonly string[]) => (
    <Swatches colours={list} value={value[key] as number} apply={(i) => ({ ...value, [key]: i })} onChange={onChange} />
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
          <Avatar avatar={shown} animate label={preset ? t(`avatar.preset.${preset}` as Key) : t('profile.avatar')} />
          <button type="button" className="ap-random" onClick={() => onChange(randomAvatar())}>
            <Shuffle size={14} weight="bold" /> {t('avatar.random')}
          </button>
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
  value,
  apply,
  onChange,
}: {
  colours: readonly string[];
  value: number;
  apply: (i: number) => AvatarData;
  onChange: (next: AvatarData) => void;
}) {
  return (
    <div className="ap-swatches" role="radiogroup" aria-label={t('avatar.colours')}>
      {colours.map((c, i) => (
        <Swatch key={c} colour={c} n={i + 1} checked={i === value} next={apply(i)} onClick={() => onChange(apply(i))} />
      ))}
    </div>
  );
}

function Swatch({ colour, n, checked, next, onClick }: { colour: string; n: number; checked: boolean; next: AvatarData; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-label={t('avatar.colour', { n })}
      style={{ background: colour }}
      onClick={onClick}
      {...usePreview(next)}
    />
  );
}
