// Simplified, scripted replicas of the planner for the landing page. They reuse the app's colours, flags and place
// names but none of its state: each demo is a fixed little scene that plays while it's on screen.
import type { CSSProperties } from 'react';
import { Cursor } from '@phosphor-icons/react/dist/csr/Cursor';
import { ArrowsHorizontal } from '@phosphor-icons/react/dist/csr/ArrowsHorizontal';
import { Scissors } from '@phosphor-icons/react/dist/csr/Scissors';
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { Question } from '@phosphor-icons/react/dist/csr/Question';
import { ArrowCounterClockwise } from '@phosphor-icons/react/dist/csr/ArrowCounterClockwise';
import { ArrowClockwise } from '@phosphor-icons/react/dist/csr/ArrowClockwise';
import { DotsThree } from '@phosphor-icons/react/dist/csr/DotsThree';
import { Translate } from '@phosphor-icons/react/dist/csr/Translate';
import { CaretDown } from '@phosphor-icons/react/dist/csr/CaretDown';
import { Minus } from '@phosphor-icons/react/dist/csr/Minus';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { PixelNomad } from '../components/PixelNomad';
import { Flag } from '../components/Flag';
import { PALETTE, cityOf, countryOf } from '../lib/storage';
import { monthName, weekdayHeaders } from '../lib/weeks';
import { daysText, t, useLocale } from '../lib/i18n';
import { noteText, seasonOf } from '../lib/seasons';
import { useCountUp, useInView, useSteps } from './motion';
import './Demos.css';

const hex = (key: (typeof PALETTE)[number]['key']) => PALETTE.find((c) => c.key === key)!.hex;
const pct = (n: number, of: number) => `${(n / of) * 100}%`;

type Leg = { country: string; city: string; s: number; e: number; color: string };

// A sample year, in weeks (inclusive), shared by the hero, the map and the phone.
const YEAR_PLAN: Leg[] = [
  { country: 'tw', city: 'Taipei', s: 0, e: 7, color: hex('red') },
  { country: 'th', city: 'Chiang Mai', s: 8, e: 13, color: hex('orange') },
  { country: 'id', city: 'Canggu', s: 14, e: 20, color: hex('teal') },
  { country: 'pt', city: 'Lisbon', s: 21, e: 28, color: hex('blue') },
  { country: 'ge', city: 'Tbilisi', s: 29, e: 33, color: hex('purple') },
  { country: 'mx', city: 'Mexico City', s: 36, e: 44, color: hex('green') },
  { country: 'tw', city: 'Taipei', s: 47, e: 52, color: hex('red') },
];
const WEEKS = 53;

function Block({ leg, style, className = '' }: { leg: Leg; style?: CSSProperties; className?: string }) {
  return (
    <div className={`d-block ${className}`} style={{ background: leg.color, ...style }}>
      <span>{cityOf(leg)}</span>
    </div>
  );
}

/* ---------- Hero: the year timeline filling in ---------- */

export function HeroTimeline() {
  useLocale();
  // Neighbouring stays in the same country share one country bar, as in the app.
  const bars = YEAR_PLAN.reduce<{ country: string; s: number; e: number }[]>((out, leg) => {
    const last = out[out.length - 1];
    if (last && last.country === leg.country && last.e + 1 === leg.s) last.e = leg.e;
    else out.push({ country: leg.country, s: leg.s, e: leg.e });
    return out;
  }, []);
  return (
    <div className="d-window hero-demo" aria-hidden="true">
      <div className="d-chrome">
        <i />
        <i />
        <i />
      </div>
      <div className="hd-body">
        <div className="hd-months">
          {Array.from({ length: 12 }, (_, m) => (
            <span key={m} style={{ left: pct(m, 12) }}>
              {monthName(m)}
            </span>
          ))}
        </div>
        <div className="d-track hd-track" style={{ '--cols': WEEKS } as CSSProperties}>
          {YEAR_PLAN.map((leg, i) => (
            <Block
              key={i}
              leg={leg}
              className="hd-grow"
              style={{ left: pct(leg.s, WEEKS), width: pct(leg.e - leg.s + 1, WEEKS), '--i': i } as CSSProperties}
            />
          ))}
        </div>
        <div className="hd-countries">
          {bars.map((b, i) => (
            <div
              key={i}
              className="hd-country"
              style={{ left: pct(b.s, WEEKS), width: pct(b.e - b.s + 1, WEEKS), '--i': i } as CSSProperties}
            >
              <Flag country={b.country} />
              <span>{countryOf({ country: b.country, city: '' })}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Drag to add, stretch to push ---------- */

const SLOTS = 16;

export function DragDemo() {
  useLocale();
  const [ref, inView] = useInView<HTMLDivElement>();
  // 0 idle · 1 drag-select · 2 stay appears · 3 grab its edge · 4 stretch, pushing the neighbour · 5 hold
  const step = useSteps([800, 1100, 700, 600, 1200, 1800], inView);
  const a: Leg = { country: 'th', city: 'Chiang Mai', s: 2, e: step >= 4 ? 10 : step >= 1 ? 7 : 2, color: hex('orange') };
  const b: Leg = step >= 4 ? { country: 'pt', city: 'Lisbon', s: 11, e: 15, color: hex('blue') } : { country: 'pt', city: 'Lisbon', s: 8, e: 12, color: hex('blue') };
  const cursorX = [2, 7, 7, 7, 10, 10][step];
  return (
    <div ref={ref} className={`d-window d-stage${step === 0 ? ' snap' : ''}`} aria-hidden="true">
      <div className="d-track" style={{ '--cols': SLOTS } as CSSProperties}>
        {step === 1 && <div className="d-select" style={{ left: pct(a.s, SLOTS), width: pct(a.e - a.s, SLOTS) }} />}
        {step >= 2 && (
          <Block leg={a} className="d-pop" style={{ left: pct(a.s, SLOTS), width: pct(a.e - a.s, SLOTS) }} />
        )}
        <Block leg={b} style={{ left: pct(b.s, SLOTS), width: pct(b.e - b.s + 1, SLOTS) }} />
        <div className={`d-cursor${step === 1 ? ' down' : ''}`} style={{ left: pct(cursorX, SLOTS) }}>
          {step >= 3 ? <ArrowsHorizontal weight="bold" /> : <Cursor weight="fill" />}
        </div>
      </div>
    </div>
  );
}

/* ---------- Hold B to cut ---------- */

export function CutDemo() {
  useLocale();
  const [ref, inView] = useInView<HTMLDivElement>();
  // 0 idle · 1 hold B, scissors over the cut · 2 cut · 3 hold
  const step = useSteps([900, 1000, 600, 1800], inView);
  const leg: Leg = { country: 'pt', city: 'Lisbon', s: 1, e: 14, color: hex('blue') };
  const cut = 8;
  return (
    <div ref={ref} className={`d-window d-stage${step === 0 ? ' snap' : ''}`} aria-hidden="true">
      <div className="d-keys">
        <kbd className={step === 1 || step === 2 ? 'held' : ''}>B</kbd>
      </div>
      <div className="d-track" style={{ '--cols': SLOTS } as CSSProperties}>
        {step < 2 ? (
          <Block leg={leg} style={{ left: pct(leg.s, SLOTS), width: pct(leg.e - leg.s + 1, SLOTS) }} />
        ) : (
          <>
            <Block leg={leg} className="d-split-l" style={{ left: pct(leg.s, SLOTS), width: pct(cut - leg.s, SLOTS) }} />
            <Block leg={leg} className="d-split-r" style={{ left: pct(cut, SLOTS), width: pct(leg.e - cut + 1, SLOTS) }} />
          </>
        )}
        {step === 1 && <div className="d-cutline" style={{ left: pct(cut, SLOTS) }} />}
        <div className={`d-cursor${step === 2 ? ' down' : ''}`} style={{ left: pct(step === 0 ? 13 : cut, SLOTS) }}>
          {step === 1 || step === 2 ? <Scissors weight="bold" /> : <Cursor weight="fill" />}
        </div>
      </div>
    </div>
  );
}

/* ---------- Month view: stretch to the exact day ---------- */

// March 2027 starts on a Monday, so day n sits in row n / 7, column n % 7.
const MONTH_DAYS = 31;
const BAR_START = 2;

export function MonthDemo() {
  useLocale();
  const [ref, inView] = useInView<HTMLDivElement>();
  // 0 grab the end · 1–10 stretch one day at a time · 11 hold
  const step = useSteps([1000, ...Array(10).fill(120), 1800], inView);
  const end = 9 + Math.min(step, 10);
  const place = { country: 'jp', city: 'Tokyo' };
  const planned = end - BAR_START + 1;
  return (
    <div ref={ref} className="d-window month-demo" aria-hidden="true">
      <div className="md-head">
        <strong>{monthName(2)}</strong>
        <span>{t('month.stat', { planned: daysText(planned), free: daysText(MONTH_DAYS - planned) })}</span>
      </div>
      <div className="md-week">
        {weekdayHeaders().map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      {Array.from({ length: 5 }, (_, row) => {
        const from = Math.max(BAR_START, row * 7);
        const to = Math.min(end, row * 7 + 6);
        return (
          <div key={row} className="md-row">
            {Array.from({ length: 7 }, (_, col) => {
              const day = row * 7 + col;
              return <span key={col}>{day < MONTH_DAYS ? day + 1 : ''}</span>;
            })}
            {from <= to && (
              <div
                className="d-block md-bar"
                style={{ background: hex('pink'), left: pct(from % 7, 7), width: pct(to - from + 1, 7) }}
              >
                {from === BAR_START && <span>{cityOf(place)}</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Map: the route drawing itself ---------- */

const COORDS: Record<string, [number, number]> = {
  Taipei: [121.5, 25],
  'Chiang Mai': [99, 18.8],
  Canggu: [115.1, -8.6],
  Lisbon: [-9.1, 38.7],
  Tbilisi: [44.8, 41.7],
  'Mexico City': [-99.1, 19.4],
};
// Equirectangular, cropped to the stretch of the world the route covers.
const project = ([lon, lat]: [number, number]) => [((lon + 125) / 265) * 600, ((55 - lat) / 77) * 260] as const;
const ROUTE = YEAR_PLAN.slice(0, 6);

export function MapDemo() {
  useLocale();
  const [ref, inView] = useInView<HTMLDivElement>();
  const step = useSteps([...ROUTE.map(() => 650), 2000], inView);
  const points = ROUTE.map((leg) => project(COORDS[leg.city]));
  return (
    <div ref={ref} className="d-window map-demo" aria-hidden="true">
      <svg viewBox="0 0 600 260">
        <defs>
          <pattern id="map-dots" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="9" cy="9" r="1.4" />
          </pattern>
        </defs>
        <rect width="600" height="260" fill="url(#map-dots)" className="map-grid" />
        {points.slice(1).map(([x, y], i) => {
          const [px, py] = points[i];
          // A gentle arc above the straight line, like a flight path.
          const cx = (px + x) / 2;
          const cy = (py + y) / 2 - Math.hypot(x - px, y - py) * 0.25;
          return (
            <path
              key={i}
              d={`M${px},${py} Q${cx},${cy} ${x},${y}`}
              pathLength={1}
              className={`map-leg${step > i ? ' drawn' : ''}`}
            />
          );
        })}
        {points.map(([x, y], i) => (
          <g key={i} className={`map-stop${step >= i ? ' shown' : ''}`} transform={`translate(${x} ${y})`}>
            <circle r="14" fill={ROUTE[i].color} />
            <text y="5">{i + 1}</text>
            <text className="map-name" y="34">
              {cityOf(ROUTE[i])}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ---------- Stay rules ---------- */

export function SchengenMeter({ label }: { label: (n: number) => string }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.5, true);
  const n = useCountUp(72, inView);
  return (
    <div ref={ref} className="meter" aria-hidden="true">
      <strong>{label(n)}</strong>
      <div className="meter-bar">
        <i style={{ width: pct(n, 90), background: hex('blue') }} />
      </div>
    </div>
  );
}

export function TaiwanMeter({ label }: { label: (n: number) => string }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.5, true);
  const n = useCountUp(121, inView);
  return (
    <div ref={ref} className="meter" aria-hidden="true">
      <strong>{label(n)}</strong>
      <div className="meter-bar">
        <i style={{ width: pct(n, 365), background: hex('red') }} />
        <b style={{ left: pct(183, 365) }} />
      </div>
    </div>
  );
}

export function SeasonStripDemo() {
  useLocale();
  const [ref, inView] = useInView<HTMLDivElement>(0.5, true);
  const place = { country: 'th', city: 'Chiang Mai' };
  const season = seasonOf(place)!;
  const avoid = season.notes.find((n) => n.kind === 'avoid');
  return (
    <div ref={ref} className={`season-demo${inView ? ' shown' : ''}`} aria-hidden="true">
      <div className="sd-cells">
        {season.ratings.map((r, m) => (
          <span key={m} className={`r${r}`} style={{ '--i': m } as CSSProperties}>
            {m + 1}
          </span>
        ))}
      </div>
      <p>
        <Flag country={place.country} /> {cityOf(place)}
        {avoid && <em>{noteText(avoid)}</em>}
      </p>
    </div>
  );
}

/* ---------- Share image ---------- */

export function ShareDemo() {
  useLocale();
  const [ref, inView] = useInView<HTMLDivElement>(0.4, true);
  return (
    <div ref={ref} className={`share-demo${inView ? ' shown' : ''}`} aria-hidden="true">
      <div className="sh-card">
        <p className="sh-title">{t('app.title')}</p>
        <p className="sh-tagline">{t('app.tagline')}</p>
        <div className="sh-track">
          {YEAR_PLAN.map((leg, i) => (
            <i key={i} style={{ left: pct(leg.s, WEEKS), width: pct(leg.e - leg.s + 1, WEEKS), background: leg.color }} />
          ))}
        </div>
        <div className="sh-flags">
          {YEAR_PLAN.slice(0, 6).map((leg, i) => (
            <Flag key={i} country={leg.country} />
          ))}
        </div>
        <div className="sh-lines">
          <i />
          <i />
          <i />
        </div>
      </div>
      <span className="sh-button">
        <DownloadSimple weight="bold" /> {t('share.download')}
      </span>
    </div>
  );
}

/* ---------- Device: the desktop layout shrinking into the phone one ---------- */

// Two states: a tablet-sized frame showing the desktop layout, then the frame shrinks to a phone and the read-only
// phone layout fades in. Loops while on screen; with reduced motion it stays on the phone.
export function DeviceDemo() {
  useLocale();
  const [ref, inView] = useInView<HTMLDivElement>();
  // 0 desktop, year view · 1 desktop, month view · 2 phone
  const step = useSteps([2600, 2600, 5000], inView);
  const phone = step === 2;
  const month = step === 1;
  const cards = YEAR_PLAN.slice(0, 6);
  const card = (leg: Leg, key: string) => (
    <div key={key} className="ph-card" style={{ borderLeftColor: leg.color }}>
      <Flag country={leg.country} />
      <div>
        <strong>{cityOf(leg)}</strong>
        <span>
          {countryOf(leg)} · {daysText((leg.e - leg.s + 1) * 7)}
        </span>
      </div>
    </div>
  );
  return (
    <div ref={ref} className={`device-demo${phone ? ' is-phone' : ''}`} aria-hidden="true">
      <div className="device">
        <div className="dv-camera" />

        {/* A miniature of the desktop app: header and toolbar, view bar, the year or month view, then panels */}
        <div className="dv-desk">
          <div className="dv-head">
            <PixelNomad />
            <strong>{t('app.title')}</strong>
            <div className="dv-tools">
              <span className="dv-pill">
                <Question weight="bold" /> {t('toolbar.help')}
              </span>
              <span className="dv-pill icon">
                <ArrowCounterClockwise weight="bold" />
              </span>
              <span className="dv-pill icon">
                <ArrowClockwise weight="bold" />
              </span>
              <span className="dv-pill icon">
                <DotsThree weight="bold" />
              </span>
              <span className="dv-pill">
                <Translate weight="bold" /> {t('toolbar.language')}
              </span>
            </div>
          </div>

          <div className="dv-viewbar">
            <span className="dv-pill">
              2027 <CaretDown weight="bold" />
            </span>
            <span className="dv-seg">
              <i className={month ? '' : 'on'}>{t('view.year')}</i>
              <i className={month ? 'on' : ''}>{t('view.month')}</i>
            </span>
            <span className="dv-zoom">
              <Minus weight="bold" />
              <b />
              <Plus weight="bold" />
            </span>
          </div>

          <div className="dv-view">
            <div className={`dv-year${month ? ' off' : ''}`}>
              <div className="dv-months">
                {Array.from({ length: 12 }, (_, m) => (
                  <span key={m} style={{ left: pct(m, 12) }}>
                    {monthName(m)}
                  </span>
                ))}
              </div>
              <div className="dv-track">
                {YEAR_PLAN.map((leg, i) => (
                  <i key={i} style={{ left: pct(leg.s, WEEKS), width: pct(leg.e - leg.s + 1, WEEKS), background: leg.color }}>
                    {cityOf(leg)}
                  </i>
                ))}
              </div>
              <div className="dv-flags">
                {YEAR_PLAN.map((leg, i) => (
                  <span key={i} style={{ left: pct(leg.s, WEEKS) }}>
                    <Flag country={leg.country} />
                  </span>
                ))}
              </div>
            </div>
            <div className={`dv-cal${month ? '' : ' off'}`}>
              <div className="dv-calhead">
                {weekdayHeaders().map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              {/* March 2027: the 1st is a Monday. Tokyo from the 3rd to the 19th. */}
              {Array.from({ length: 5 }, (_, row) => {
                const from = Math.max(2, row * 7);
                const to = Math.min(18, row * 7 + 6);
                return (
                  <div key={row} className="dv-calrow">
                    {Array.from({ length: 7 }, (_, col) => (
                      <span key={col}>{row * 7 + col < MONTH_DAYS ? row * 7 + col + 1 : ''}</span>
                    ))}
                    {from <= to && (
                      <i style={{ left: pct(from % 7, 7), width: pct(to - from + 1, 7), background: hex('pink') }}>
                        {from === 2 ? cityOf({ country: 'jp', city: 'Tokyo' }) : ''}
                      </i>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="dv-panels">
            <div className="dv-panel">
              <strong>{t('summary.title')}</strong>
              <b />
              <b />
              <b />
            </div>
            <div className="dv-panel grow">
              <strong>{t('stays.title')}</strong>
              {cards.slice(0, 4).map((leg, i) => (
                <div key={i} className="dv-row">
                  <Flag country={leg.country} />
                  <span className="dv-city">{cityOf(leg)}</span>
                  <em>{daysText((leg.e - leg.s + 1) * 7)}</em>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dv-phone">
          <div className="ph-now">
            <span>{t('mobile.now')}</span>
            <strong>
              <Flag country="pt" /> {cityOf({ country: 'pt', city: 'Lisbon' })}
            </strong>
            <span>
              {t('mobile.next')} · {cityOf({ country: 'ge', city: 'Tbilisi' })}
            </span>
          </div>
          <div className="ph-list">
            {/* Two copies, so the loop can scroll one full list height and start again seamlessly. */}
            <div className="ph-scroll">
              {cards.map((leg, i) => card(leg, `a${i}`))}
              {cards.map((leg, i) => card(leg, `b${i}`))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
