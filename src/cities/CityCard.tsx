import { Flag } from '../components/Flag';
import { t, useLocale, type Key } from '../lib/i18n';
import type { NomadCity } from '../lib/nomadCities';
import { seasonOf, tempRange } from '../lib/seasons';
import { cityOf, countryOf } from '../lib/storage';
import { monthName } from '../lib/weeks';
import './CityCard.css';

const RATING_CLASS = ['avoid', 'fine', 'best'] as const;

// One city at a glance: name, one line, three numbers, twelve months and the visa, all linking to its article
// further down the page. The months come from seasons.ts by the same key a stay would use.
export function CityCard({ city, rank }: { city: NomadCity; rank: number }) {
  const locale = useLocale();
  const season = seasonOf(city);
  return (
    <li className="city-card">
      <a href={`#${city.id}`}>
        <header>
          <Flag country={city.country} />
          <span className="city-card-name">{cityOf(city)}</span>
          <span className="city-card-country">{countryOf(city)}</span>
          <span className="city-card-rank">{t('cities.rank', { n: rank })}</span>
        </header>
        <p className="city-card-tagline">{t(`cities.tagline.${city.id}` as Key)}</p>
        <dl className="city-card-stats">
          <div>
            <dt>{t('cities.rent')}</dt>
            <dd>{t('cities.usd', { n: city.rent.toLocaleString() })}</dd>
          </div>
          <div>
            <dt>{t('cities.monthly')}</dt>
            <dd>{t('cities.usd', { n: city.monthly.toLocaleString() })}</dd>
          </div>
          <div>
            <dt>{t('cities.wifi')}</dt>
            <dd>{t('cities.mbps', { n: city.wifi })}</dd>
          </div>
        </dl>
        {season && (
          <ol className="city-card-months" aria-label={t('cities.bestMonths')}>
            {season.ratings.map((r, m) => (
              <li
                key={m}
                className={RATING_CLASS[r]}
                title={[monthName(m), t(`season.${RATING_CLASS[r]}`), t('season.temp', tempRange(season, [m]))].join(t('sep'))}
              >
                {m + 1}
              </li>
            ))}
          </ol>
        )}
        <p className="city-card-visa">
          <b>{t('cities.visa')}</b>
          {city.visa[locale]}
        </p>
      </a>
    </li>
  );
}
