import type { ReactNode } from 'react';
import { GithubLogo } from '@phosphor-icons/react/dist/csr/GithubLogo';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { UserCircleMinus } from '@phosphor-icons/react/dist/csr/UserCircleMinus';
import { CloudSlash } from '@phosphor-icons/react/dist/csr/CloudSlash';
import { Code } from '@phosphor-icons/react/dist/csr/Code';
import { LockSimple } from '@phosphor-icons/react/dist/csr/LockSimple';
import { PixelNomad } from '../components/PixelNomad';
import { trackLink } from '../lib/analytics';
import { Tagline } from '../components/Tagline';
import { langTag, nextLocale, setLocale, t, useLocale } from '../lib/i18n';
import type { Key } from '../lib/i18n';
import {
  CutDemo,
  DragDemo,
  HeroTimeline,
  MapDemo,
  MonthDemo,
  DeviceDemo,
  SchengenMeter,
  SeasonStripDemo,
  ShareDemo,
  TaiwanMeter,
} from './Demos';
import { useInView } from './motion';
import './Landing.css';

const APP_URL = './app/';
const REPO_URL = 'https://github.com/Simonlin7972/digital-nomad-planner';

// Fades a block up the first time it scrolls into view.
function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.15, true);
  return (
    <div ref={ref} className={`reveal${inView ? ' in' : ''} ${className}`}>
      {children}
    </div>
  );
}

function Feature({ id, demo, flip }: { id: 'drag' | 'cut' | 'month' | 'map'; demo: ReactNode; flip?: boolean }) {
  return (
    <Reveal className={`feature${flip ? ' flip' : ''}`}>
      <div className="feature-text">
        <h3>{t(`landing.f.${id}.title` as Key)}</h3>
        <p>{t(`landing.f.${id}.body` as Key)}</p>
      </div>
      <div className="feature-demo">{demo}</div>
    </Reveal>
  );
}

export function Landing() {
  const locale = useLocale();
  document.title = `${t('app.title')} — ${t('app.tagline')}`;
  document.documentElement.lang = langTag(locale);

  return (
    <div className="landing">
      <header className="l-nav">
        <a className="l-brand" href="#top" aria-label={t('app.title')}>
          <PixelNomad />
          <span>{t('app.title')}</span>
        </a>
        <nav>
          <a href="#features">{t('landing.nav.features')}</a>
          <a href="#privacy">{t('landing.nav.privacy')}</a>
          <a href={REPO_URL} target="_blank" rel="noreferrer" aria-label={t('landing.nav.github')}>
            <GithubLogo weight="bold" />
          </a>
          {/* Labelled in the language it switches to, as in the app's toolbar. */}
          <button
            onClick={() => setLocale(nextLocale(locale))}
            title={t('toolbar.languageHint')}
            lang={langTag(locale)}
          >
            {t('toolbar.language')}
          </button>
          <a className="l-btn primary small" href={APP_URL} onClick={(e) => trackLink(e, 'cta_click', { location: 'nav' })}>
            {t('landing.cta.open')}
          </a>
        </nav>
      </header>

      <section id="top" className="l-hero">
        <h1>{t('app.title')}</h1>
        <Tagline />
        <p className="l-lead">{t('landing.hero.lead')}</p>
        <div className="l-actions">
          <a className="l-btn primary" href={APP_URL} onClick={(e) => trackLink(e, 'cta_click', { location: 'hero' })}>
            {t('landing.hero.cta')} <ArrowRight weight="bold" />
          </a>
          <a className="l-btn" href="#features">
            {t('landing.hero.more')}
          </a>
        </div>
        <HeroTimeline />
      </section>

      <Reveal className="l-points">
        {(
          [
            ['account', <UserCircleMinus weight="bold" />],
            ['local', <CloudSlash weight="bold" />],
            ['free', <Code weight="bold" />],
          ] as const
        ).map(([id, icon]) => (
          <div key={id} className="l-point">
            <span className="l-icon">{icon}</span>
            <h3>{t(`landing.point.${id}.title` as Key)}</h3>
            <p>{t(`landing.point.${id}.body` as Key)}</p>
          </div>
        ))}
      </Reveal>

      <section id="features" className="l-section">
        <h2>{t('landing.features.title')}</h2>
        <Feature id="drag" demo={<DragDemo />} />
        <Feature id="cut" demo={<CutDemo />} flip />
        <Feature id="month" demo={<MonthDemo />} />
        <Feature id="map" demo={<MapDemo />} flip />
      </section>

      <section className="l-section">
        <h2>{t('landing.rules.title')}</h2>
        <Reveal className="l-cards">
          <div className="l-card">
            <h3>{t('landing.rules.schengen.title')}</h3>
            <SchengenMeter label={(n) => t('landing.rules.schengen.value', { n })} />
            <p>{t('landing.rules.schengen.body')}</p>
          </div>
          <div className="l-card">
            <h3>{t('landing.rules.taiwan.title')}</h3>
            <TaiwanMeter label={(n) => t('landing.rules.taiwan.value', { n })} />
            <p>{t('landing.rules.taiwan.body')}</p>
          </div>
          <div className="l-card">
            <h3>{t('landing.rules.season.title')}</h3>
            <SeasonStripDemo />
            <p>{t('landing.rules.season.body')}</p>
          </div>
        </Reveal>
      </section>

      <section className="l-section">
        <Reveal className="feature">
          <div className="feature-text">
            <h3>{t('landing.share.title')}</h3>
            <p>{t('landing.share.body')}</p>
          </div>
          <div className="feature-demo">
            <ShareDemo />
          </div>
        </Reveal>
        <Reveal className="feature flip">
          <div className="feature-text">
            <h3>{t('landing.mobile.title')}</h3>
            <p>{t('landing.mobile.body')}</p>
          </div>
          <div className="feature-demo">
            <DeviceDemo />
          </div>
        </Reveal>
      </section>

      <Reveal className="l-privacy">
        <section id="privacy">
          <span className="l-icon">
            <LockSimple weight="bold" />
          </span>
          <h2>{t('landing.privacy.title')}</h2>
          <p>{t('landing.privacy.body')}</p>
        </section>
      </Reveal>

      <section className="l-final">
        <PixelNomad />
        <h2>{t('landing.final.title')}</h2>
        <a className="l-btn primary" href={APP_URL} onClick={(e) => trackLink(e, 'cta_click', { location: 'final' })}>
          {t('landing.hero.cta')} <ArrowRight weight="bold" />
        </a>
      </section>

      <footer className="l-footer">
        <span>{t('landing.footer')}</span>
        <a href={REPO_URL} target="_blank" rel="noreferrer">
          <GithubLogo weight="bold" /> {t('landing.nav.github')}
        </a>
      </footer>
    </div>
  );
}
