// The landing page. Its look is the planner's own (dot-grid paper, ink, white panels; colour only from the stays,
// flags and pixel art) and every demo is the real component, running on a sample plan in sandbox.tsx, so what a
// visitor tries here is exactly what the planner does. Section labels are drawn as stay blocks, and a bar across
// the top fills with a year of stays as the page scrolls.
import { Suspense, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { ArrowDown } from '@phosphor-icons/react/dist/csr/ArrowDown';
import { Check } from '@phosphor-icons/react/dist/csr/Check';
import { Plus } from '@phosphor-icons/react/dist/csr/Plus';
import { ShareNetwork } from '@phosphor-icons/react/dist/csr/ShareNetwork';
import { QrCode } from '@phosphor-icons/react/dist/csr/QrCode';
import { WifiSlash } from '@phosphor-icons/react/dist/csr/WifiSlash';
import { LockSimple } from '@phosphor-icons/react/dist/csr/LockSimple';
import { HandPointing } from '@phosphor-icons/react/dist/csr/HandPointing';
import { Translate } from '@phosphor-icons/react/dist/csr/Translate';
import { PixelNomad } from '../components/PixelNomad';
import { PillNav } from '../components/PillNav';
import { Avatar } from '../components/Avatar';
import { Flag } from '../components/Flag';
import { Tagline } from '../components/Tagline';
import { SeasonStrip } from '../components/SeasonStrip';
import { Summary } from '../components/Summary';
import { StayList } from '../components/StayList';
import { MobileItinerary } from '../components/MobileItinerary';
import YearView from '../components/YearView';
import MonthView from '../components/MonthView';
import { FACE_CROP, PRESETS, runs, type Pixels } from '../lib/avatar';
import { sydney, taipei, tokyo } from '../pixel/scenes';
import { NOMAD_CITIES } from '../lib/nomadCities';
import { seasonOf } from '../lib/seasons';
import { PALETTE, cityOf, countryOf } from '../lib/storage';
import { trackLink } from '../lib/analytics';
import { langTag, nextLocale, setLocale, t, tr, useLocale } from '../lib/i18n';
import type { Key } from '../lib/i18n';
import { useNarrow } from '../hooks/useNarrow';
import { useInView } from './motion';
import { MapView, ResetButton, SAMPLE_COORDS, SandboxBar, SandboxProvider, useSandbox } from './sandbox';
import './Landing.css';

const APP_URL = './app/';
const CITIES_URL = './cities/';
const MAC = /Mac|iPhone|iPad/.test(navigator.platform);

type ColourKey = (typeof PALETTE)[number]['key'];
type PresetId = (typeof PRESETS)[number]['id'];
const hex = (key: ColourKey) => PALETTE.find((c) => c.key === key)!.hex;
const preset = (id: PresetId) => PRESETS.find((p) => p.id === id)!.avatar;
const br = <br />;

/* ---------- Small pieces ---------- */

// Fades a block up the first time it scrolls into view.
function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.12, true);
  return (
    <div ref={ref} className={`l-reveal${inView ? ' in' : ''} ${className}`}>
      {children}
    </div>
  );
}

// A section label drawn as a stay block, in the stays' colours.
function Chip({ color, n, children }: { color: ColourKey; n?: string; children: ReactNode }) {
  return (
    <span className="l-chip" style={{ background: hex(color) }}>
      {n && <b>{n}</b>}
      {children}
    </span>
  );
}

function Px({ pixels }: { pixels: Pixels }) {
  return (
    <svg viewBox={`0 0 ${pixels[0].length} ${pixels.length}`} shapeRendering="crispEdges" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      {runs(pixels).map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
      ))}
    </svg>
  );
}

// One of the pixel guide's city scenes, its two frames swapped on a beat. Decorative.
function Scene({ draw, className = '' }: { draw: (low: boolean) => Pixels; className?: string }) {
  return (
    <div className={`l-scene ${className}`} aria-hidden="true">
      <div className="f1">
        <Px pixels={draw(false)} />
      </div>
      <div className="f2">
        <Px pixels={draw(true)} />
      </div>
    </div>
  );
}

function Ticks({ items }: { items: ReactNode[] }) {
  return (
    <ul className="l-ticks">
      {items.map((item, i) => (
        <li key={i}>
          <Check weight="bold" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// A thin bar across the top that fills as the page scrolls, striped like the sample's year of stays.
function YearProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => setP(scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight));
    on();
    addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, []);
  return (
    <div className="l-progress" aria-hidden="true">
      <i style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}

/* ---------- Live pieces: real components on the sandbox plan ---------- */

function LiveMonthView() {
  const sb = useSandbox();
  return (
    <MonthView
      stays={sb.stays}
      ghosts={[]}
      onOpenYear={() => {}}
      month={sb.month}
      onMonth={sb.setMonth}
      holidaySets={sb.holidaySets}
      pending={sb.pending}
      onCreate={sb.create}
      onEdit={sb.edit}
      onResize={sb.resize}
      onHover={sb.hoverStay}
      onSplit={sb.split}
    />
  );
}

function LiveYear() {
  const sb = useSandbox();
  const [mode, setMode] = useState<'year' | 'month'>('year');
  return (
    <div className="l-window">
      <SandboxBar mode={mode} onMode={setMode} />
      <div className="view" key={mode}>
        {mode === 'year' ? (
          <YearView
            stays={sb.stays}
            ghosts={[]}
            onOpenYear={() => {}}
            zoom={sb.zoom}
            holidaySets={sb.holidaySets}
            pending={sb.pending}
            onCreate={sb.create}
            onEdit={sb.edit}
            onChange={sb.change}
            onOpenMonth={(m) => {
              sb.setMonth(m);
              setMode('month');
            }}
            onHoverStay={sb.hoverStay}
            onHoverHoliday={sb.hoverHoliday}
            onDragging={sb.setDragging}
            prevYear={null}
            nextYear={null}
            onYearEdge={() => {}}
            startAtEnd={false}
            onSplit={sb.split}
          />
        ) : (
          <LiveMonthView />
        )}
      </div>
    </div>
  );
}

function LivePanels() {
  const sb = useSandbox();
  return (
    <section className="panels l-panels">
      <Summary stays={sb.stays} coords={SAMPLE_COORDS} />
      <StayList
        stays={sb.stays}
        month={null}
        onEdit={sb.edit}
        onLocate={() => document.getElementById('try')?.scrollIntoView({ behavior: 'smooth' })}
        onCreate={sb.create}
        ticketCardId={sb.ticketId}
        onTicket={sb.ticket}
      />
    </section>
  );
}

// The map brings MapLibre and its tiles, so it loads only once it comes near the screen.
function LiveMap() {
  const sb = useSandbox();
  const [ref, near] = useInView<HTMLDivElement>(0, true);
  return (
    <div ref={ref} className="l-map">
      {near && (
        <Suspense fallback={<div className="l-map-wait" />}>
          <MapView stays={sb.stays} coords={SAMPLE_COORDS} failed={false} />
        </Suspense>
      )}
    </div>
  );
}

function LivePhone() {
  const sb = useSandbox();
  return (
    <div className="l-phone">
      <div className="l-phone-notch" />
      <div className="l-phone-screen">
        <MobileItinerary stays={sb.stays} isolated />
      </div>
    </div>
  );
}

function ShareButton() {
  const sb = useSandbox();
  return (
    <button className="primary l-share-btn" onClick={sb.openShare}>
      <ShareNetwork weight="bold" /> {t('landing.share.button')}
    </button>
  );
}

/* ---------- Content ---------- */

const key = (k: string) => <kbd className="l-kbd">{k}</kbd>;
const GESTURES: [string, ReactNode?][] = [
  ['drag'],
  ['move'],
  ['stretch'],
  ['cut', key('B')],
  ['copy', key(MAC ? '⌥' : 'Alt')],
  ['month'],
];

const DETAILS: { n: 1 | 2 | 3 | 4; who: PresetId; extra?: ReactNode }[] = [
  { n: 1, who: 'designer', extra: <SeasonStrip place={{ country: 'th', city: 'Chiang Mai' }} range={null} /> },
  { n: 2, who: 'backpacker' },
  { n: 3, who: 'engineer' },
  { n: 4, who: 'silver' },
];

const STATS = [
  ['53', 'weeks'],
  ['71', 'cities'],
  ['0', 'accounts'],
  ['3', 'languages'],
] as const;

const SCOPE = [
  ['plan', 'landing.scope.plan.what', true],
  ['transfer', 'toolbar.transfer', true],
  ['share', 'landing.scope.share.what', false],
  ['report', 'toolbar.report', false],
  ['backup', 'landing.scope.backup.what', false],
] as const;

/* ---------- Page ---------- */

export function Landing() {
  const locale = useLocale();
  const narrow = useNarrow();
  const [faq, setFaq] = useState(0);
  document.title = `${t('app.title')} — ${t('app.tagline')}`;
  document.documentElement.lang = langTag(locale);

  return (
    <SandboxProvider>
      <YearProgress />
      <div className="l-page">
        <PillNav className="l-nav">
          <a className="l-brand" href="#top" aria-label={t('app.title')}>
            <PixelNomad />
            <span>{t('app.title')}</span>
          </a>
          <nav>
            <a href="#try">{t('landing.nav.try')}</a>
            <a href="#details">{t('landing.nav.details')}</a>
            <a href="#cities">{t('landing.nav.cities')}</a>
            <a href="#faq">{t('landing.nav.faq')}</a>
            {/* The current language, named in itself; a click moves on to the next one */}
            <button className="l-lang" onClick={() => setLocale(nextLocale(locale))} title={t('toolbar.languageHint')} lang={langTag(locale)}>
              <Translate weight="bold" /> {t('toolbar.language')}
            </button>
            <a className="l-btn dark small" href={APP_URL} onClick={(e) => trackLink(e, 'cta_click', { location: 'nav' })}>
              {t('landing.cta.open')}
            </a>
          </nav>
        </PillNav>

        {/* Hero: the promise, then straight into the real timeline */}
        <section id="top" className="l-hero">
          <Chip color="red">{t('landing.hero.badge')}</Chip>
          <h1>{tr('landing.hero.title', { br, mark: <mark>{t('landing.hero.mark')}</mark> })}</h1>
          <p className="l-lead">{t('landing.hero.lead')}</p>
          <div className="l-actions">
            <a className="l-btn dark" href={APP_URL} onClick={(e) => trackLink(e, 'cta_click', { location: 'hero' })}>
              {t('landing.hero.cta')} <ArrowRight weight="bold" />
            </a>
            <a className="l-btn line" href="#try">
              {t('landing.hero.try')} <ArrowDown weight="bold" />
            </a>
          </div>
        </section>

        <section id="try" className="l-try">
          <Scene draw={tokyo} className="l-try-scene" />
          {narrow ? (
            // Phones get the planner's phone layout: the timeline is for a pointer and a wide screen.
            <div className="l-try-stage phone">
              <LivePhone />
              <p className="l-fine">{t('landing.try.phone')}</p>
            </div>
          ) : (
            <div className="l-try-stage">
              <div className="l-try-head">
                <span className="l-live">
                  <i /> {t('landing.try.live')}
                </span>
                <ResetButton />
              </div>
              <LiveYear />
              <div className="l-gestures">
                <HandPointing weight="bold" />
                {GESTURES.map(([id, k]) => (
                  <span key={id} className="l-gesture">
                    <b>{k ? tr(`landing.g.${id}.how` as Key, { key: k }) : t(`landing.g.${id}.how` as Key)}</b>
                    {t(`landing.g.${id}.what` as Key)}
                  </span>
                ))}
              </div>
              <p className="l-fine">{t('landing.try.note')}</p>
            </div>
          )}
        </section>

        {/* Four numbers rather than three generic promises */}
        <Reveal className="l-stats">
          {STATS.map(([n, id]) => (
            <div key={id}>
              <strong>
                {n}
                <small>{t(`landing.stat.${id}.unit` as Key)}</small>
              </strong>
              <span>{t(`landing.stat.${id}.label` as Key)}</span>
            </div>
          ))}
        </Reveal>

        {/* The month view, live, on the same sample */}
        <section className="l-section l-split">
          <Reveal className="l-split-text">
            <Chip color="orange" n="01">
              {t('landing.month.chip')}
            </Chip>
            <h2>{t('landing.month.title')}</h2>
            <Ticks
              items={[
                t('landing.month.t1'),
                t('landing.month.t2'),
                t('landing.month.t3'),
                t('landing.month.t4', { all: t('view.all') }),
              ]}
            />
          </Reveal>
          {!narrow && (
            <Reveal className="l-split-live">
              <div className="l-window">
                <LiveMonthView />
              </div>
            </Reveal>
          )}
        </section>

        <section className="l-section">
          <Reveal className="l-center">
            <Chip color="teal" n="02">
              {t('landing.overview.chip')}
            </Chip>
            <h2>{t('landing.overview.title')}</h2>
            <p className="l-muted">{t('landing.overview.body')}</p>
          </Reveal>
          <Reveal>
            <LivePanels />
          </Reveal>
        </section>

        {/* Questions nomads ask, each answered in the planner's own terms */}
        <section id="details" className="l-section l-why">
          <Reveal className="l-why-side">
            <Chip color="purple" n="03">
              {t('landing.details.chip')}
            </Chip>
            <h2>{tr('landing.details.title', { br })}</h2>
            <Scene draw={taipei} className="l-why-scene" />
          </Reveal>
          <div className="l-qa">
            {DETAILS.map((item) => (
              <Reveal key={item.n} className="l-qa-item">
                <div className="l-ask">
                  <span className="l-face">
                    <Avatar avatar={preset(item.who)} crop={FACE_CROP} />
                  </span>
                  <span className="l-bubble">{t(`landing.details.q${item.n}` as Key)}</span>
                </div>
                <div className="l-answer">
                  <p>{t(`landing.details.a${item.n}` as Key)}</p>
                  {item.extra && <div className="l-answer-extra">{item.extra}</div>}
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="l-section">
          <Reveal className="l-center">
            <Chip color="blue" n="04">
              {t('landing.map.chip')}
            </Chip>
            <h2>{t('landing.map.title')}</h2>
            <p className="l-muted">{t('landing.map.body')}</p>
          </Reveal>
          <Reveal>
            <div className="panel l-map-panel">
              <LiveMap />
            </div>
          </Reveal>
        </section>

        {/* Carry it: the real phone layout and the real share image */}
        <section className="l-section l-carry">
          {!narrow && (
            <Reveal className="l-carry-phone">
              <LivePhone />
            </Reveal>
          )}
          <Reveal className="l-carry-text">
            <Chip color="green" n="05">
              {t('landing.carry.chip')}
            </Chip>
            <h2>{t('landing.carry.title')}</h2>
            <Ticks
              items={[
                <>
                  <QrCode weight="bold" /> {t('landing.carry.t1', { transfer: t('toolbar.transfer') })}
                </>,
                <>
                  <WifiSlash weight="bold" /> {t('landing.carry.t2')}
                </>,
                <>
                  <LockSimple weight="bold" /> {t('landing.carry.t3')}
                </>,
              ]}
            />
            <div className="l-share">
              <div>
                <b>{t('landing.share.title')}</b>
                <span>{t('landing.share.body')}</span>
              </div>
              <ShareButton />
            </div>
          </Reveal>
        </section>

        {/* The character */}
        <section className="l-section">
          <Reveal className="l-avatars">
            <div className="l-avatars-text">
              <Chip color="yellow" n="06">
                {t('landing.avatar.chip')}
              </Chip>
              <h2>{t('landing.avatar.title')}</h2>
              <p className="l-muted">{t('landing.avatar.body')}</p>
              <a className="l-btn line" href="./profile/">
                {t('landing.avatar.cta')} <ArrowRight weight="bold" />
              </a>
            </div>
            <div className="l-crowd">
              {(['surfer', 'creator', 'engineer', 'silver', 'gapyear', 'cafe'] as const).map((id) => (
                <figure key={id}>
                  <Avatar avatar={preset(id)} animate />
                  <figcaption>{t(`avatar.preset.${id}` as Key)}</figcaption>
                </figure>
              ))}
            </div>
          </Reveal>
        </section>

        {/* The cities as postcards, each with its year of seasons */}
        <section id="cities" className="l-section">
          <Reveal className="l-center">
            <Chip color="pink" n="07">
              {t('landing.cities.chip')}
            </Chip>
            <h2>{t('landing.cities.title')}</h2>
            <p className="l-muted">{t('landing.cities.body')}</p>
          </Reveal>
          <div className="l-cities">
            {NOMAD_CITIES.map((c) => (
              <a key={c.id} className="l-city" href={`${CITIES_URL}#${c.id}`} onClick={(e) => trackLink(e, 'cta_click', { location: 'cities' })}>
                <div className="l-city-top">
                  <Flag country={c.country} />
                  <span>{countryOf(c)}</span>
                </div>
                <b>{cityOf(c)}</b>
                <p>{t(`cities.tagline.${c.id}` as Key)}</p>
                <div className="l-months" aria-hidden="true">
                  {(seasonOf(c)?.ratings ?? []).map((r, m) => (
                    <i key={m} className={`r${r}`} />
                  ))}
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Privacy */}
        <section id="privacy" className="l-section">
          <Reveal className="l-privacy">
            <div>
              <h2>{tr('landing.privacy.title', { br })}</h2>
              <p>{t('landing.privacy.body')}</p>
            </div>
            <ul className="l-scope">
              {SCOPE.map(([id, what, ok]) => (
                <li key={id}>
                  <b>{t(what)}</b>
                  <span>{t(`landing.scope.${id}.where` as Key)}</span>
                  <em className={ok ? 'ok' : undefined}>{t(`landing.scope.${id}.tag` as Key)}</em>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>

        {/* FAQ: heading on the left, answers on the right */}
        <section id="faq" className="l-section l-faq-wrap">
          <div className="l-faq-side">
            <h2>{t('landing.faq.title')}</h2>
            <p className="l-muted">{t('landing.faq.body', { report: t('toolbar.report') })}</p>
          </div>
          <div className="l-faq">
            {([1, 2, 3, 4, 5, 6] as const).map((n, i) => (
              <div key={n} className={`l-faq-item${faq === i ? ' open' : ''}`}>
                <button onClick={() => setFaq(faq === i ? -1 : i)} aria-expanded={faq === i}>
                  <span>{t(`landing.faq.q${n}` as Key)}</span>
                  <Plus weight="bold" />
                </button>
                <div className="l-faq-a">
                  <p>{t(`landing.faq.a${n}` as Key, { transfer: t('toolbar.transfer') })}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Final: a full-width city scene; the tagline under the name ends on "where to next?" */}
      <section className="l-final">
        <Scene draw={sydney} className="l-final-scene" />
        <div className="l-final-card">
          <PixelNomad />
          <h2>{t('app.title')}</h2>
          <Tagline />
          <a className="l-btn dark" href={APP_URL} onClick={(e) => trackLink(e, 'cta_click', { location: 'final' })}>
            {t('landing.hero.cta')} <ArrowRight weight="bold" />
          </a>
        </div>
      </section>

      <footer className="l-footer">
        <span>{t('landing.footer')}</span>
        <span>
          <a href={CITIES_URL}>{t('cities.title')}</a>・<a href="./changelog/">{t('changelog.title')}</a>
        </span>
      </footer>
    </SandboxProvider>
  );
}
