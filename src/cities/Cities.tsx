import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { PillNav } from '../components/PillNav';
import { PixelNomad } from '../components/PixelNomad';
import { Footer } from '../components/Footer';
import { NOMAD_CITIES } from '../lib/nomadCities';
import { APP_URL, HOME_URL } from '../lib/links';
import { langTag, nextLocale, setLocale, t, useLocale } from '../lib/i18n';
import { trackLink } from '../lib/analytics';
import { CityCard } from './CityCard';
import { CityArticle } from './CityArticle';
import './Cities.css';

// The cities page at /cities/: ten cards, then ten articles, from lib/nomadCities.ts in the current language. It
// reads nothing else: no plan, no profile, no network beyond the fonts and flags every page loads.
export function Cities() {
  const locale = useLocale();
  document.title = `${t('cities.title')} — ${t('app.title')}`;
  document.documentElement.lang = langTag(locale);

  return (
    <div className="cities">
      <PillNav className="cities-nav">
        <a className="cities-brand" href={HOME_URL}>
          <PixelNomad />
          <span>{t('app.title')}</span>
        </a>
        <nav>
          {/* Labelled in the language it switches to, as in the app's toolbar. */}
          <button onClick={() => setLocale(nextLocale(locale))} title={t('toolbar.languageHint')} lang={langTag(locale)}>
            {t('toolbar.language')}
          </button>
          <a className="cities-open" href={APP_URL} onClick={(e) => trackLink(e, 'cta_click', { location: 'cities' })}>
            {t('landing.cta.open')} <ArrowRight size={14} weight="bold" />
          </a>
        </nav>
      </PillNav>

      <main>
        <h1>{t('cities.title')}</h1>
        <p className="cities-lead">{t('cities.lead')}</p>
        <p className="cities-note">{t('cities.note')}</p>

        <ol className="city-grid">
          {NOMAD_CITIES.map((city, i) => (
            <CityCard key={city.id} city={city} rank={i + 1} />
          ))}
        </ol>

        <div className="city-articles">
          {NOMAD_CITIES.map((city, i) => (
            <CityArticle key={city.id} city={city} rank={i + 1} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
