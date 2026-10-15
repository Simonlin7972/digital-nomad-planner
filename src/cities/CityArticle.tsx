import { Flag } from '../components/Flag';
import { t, useLocale } from '../lib/i18n';
import type { NomadCity } from '../lib/nomadCities';
import { cityOf, countryOf } from '../lib/storage';
import './CityArticle.css';

// One city in full: its upsides and downsides, the article in the current language, the visa line and where the
// numbers came from. The section id is the anchor the card above links to.
export function CityArticle({ city, rank }: { city: NomadCity; rank: number }) {
  const locale = useLocale();
  const paragraphs = city.article[locale].split(/\n\s*\n/);
  return (
    <section id={city.id} className="city-article">
      <header>
        <Flag country={city.country} />
        <h2>
          {cityOf(city)} <small>{countryOf(city)}</small>
        </h2>
        <span className="city-article-rank">{t('cities.rank', { n: rank })}</span>
      </header>

      <div className="city-article-lists">
        <div>
          <h3>{t('cities.pros')}</h3>
          <ul>
            {city.pros.map((p, i) => (
              <li key={i}>{p[locale]}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3>{t('cities.cons')}</h3>
          <ul>
            {city.cons.map((c, i) => (
              <li key={i}>{c[locale]}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="city-article-text">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <p className="city-article-visa">
        <b>{t('cities.visa')}</b>
        {city.visa[locale]}
      </p>

      <p className="city-article-sources">
        <b>{t('cities.sources')}</b>
        {city.sources.map((url, i) => (
          <a key={i} href={url} target="_blank" rel="noopener">
            {new URL(url).hostname.replace(/^www\./, '')}
          </a>
        ))}
      </p>
    </section>
  );
}
