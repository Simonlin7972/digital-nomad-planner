import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { GithubLogo } from '@phosphor-icons/react/dist/csr/GithubLogo';
import { PixelNomad } from '../components/PixelNomad';
import { CHANGELOG } from '../lib/changelog';
import { langTag, nextLocale, setLocale, t, useLocale } from '../lib/i18n';
import { REPO_URL } from '../lib/links';
import './Changelog.css';

// This page lives at /changelog/, beside the planner at /app/ and the landing page at the root.
const HOME_URL = '../';
const APP_URL = '../app/';

// The changelog page: every release from CHANGELOG.md, newest day first, in the current language.
export function Changelog() {
  const locale = useLocale();
  document.title = `${t('changelog.title')} — ${t('app.title')}`;
  document.documentElement.lang = langTag(locale);
  const dateText = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(locale === 'zh' ? 'zh-TW' : langTag(locale), { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="changelog">
      <header className="c-nav">
        <a className="c-brand" href={HOME_URL}>
          <PixelNomad />
          <span>{t('app.title')}</span>
        </a>
        <nav>
          {/* Labelled in the language it switches to, as in the app's toolbar. */}
          <button onClick={() => setLocale(nextLocale(locale))} title={t('toolbar.languageHint')} lang={langTag(nextLocale(locale))}>
            {t('toolbar.language')}
          </button>
          <a className="c-open" href={APP_URL}>
            {t('landing.cta.open')} <ArrowRight size={14} weight="bold" />
          </a>
        </nav>
      </header>

      <main>
        <h1>{t('changelog.title')}</h1>
        <p className="c-lead">{t('changelog.lead')}</p>
        <ol className="c-days">
          {CHANGELOG.map((day) => (
            <li key={day.date} className="c-day">
              <time dateTime={day.date}>{dateText(day.date)}</time>
              <ul>
                {/* Entries are written in Chinese and English; Japanese reads the English ones. */}
                {day.entries.map((e, i) => (
                  <li key={i}>{locale === 'zh' ? e.zh : e.en}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </main>

      <footer className="c-footer">
        <span>{t('landing.footer')}</span>
        <a href={REPO_URL} target="_blank" rel="noreferrer">
          <GithubLogo size={14} weight="bold" /> {t('landing.nav.github')}
        </a>
      </footer>
    </div>
  );
}
