import { Fragment, useMemo } from 'react';
import { Warning } from '@phosphor-icons/react/dist/csr/Warning';
import { flightStats, type Coords } from '../hooks/useCoords';
import { cityLabel } from '../lib/cities';
import { countryLabel } from '../lib/flags';
import { daysText, t, tr, useLocale } from '../lib/i18n';
import type { Stay } from '../lib/storage';
import { checkSchengen, taiwanDays } from '../lib/stayRules';
import { TOTAL_DAYS, YEAR, dateOfDay, daysOf, fullDate, weeksLabel } from '../lib/weeks';
import { Flag } from './Flag';
import './Summary.css';

// Totals for the whole year: time planned, places visited, a flight estimate, and days per country and city.
export function Summary({ stays, coords }: { stays: Stay[]; coords: Coords }) {
  useLocale();
  // Days per country, each with its cities; stays without a country sit in a '' group.
  const totals = useMemo(() => {
    const groups = new Map<string, { days: number; cities: Map<string, number> }>();
    for (const s of [...stays].sort((a, b) => a.startDay - b.startDay)) {
      const g = groups.get(s.country) ?? { days: 0, cities: new Map() };
      groups.set(s.country, g);
      g.days += daysOf(s);
      g.cities.set(s.city, (g.cities.get(s.city) ?? 0) + daysOf(s));
    }
    return [...groups.entries()]
      .map(([country, g]) => ({
        country,
        days: g.days,
        // Stays with no city are keyed '' and listed last, labelled 其他.
        cities: [...g.cities.entries()].sort((a, b) => Number(!a[0]) - Number(!b[0]) || b[1] - a[1]),
      }))
      .sort((a, b) => b.days - a.days);
  }, [stays]);
  const countryCount = totals.filter((g) => g.country).length;
  const cityCount = totals.reduce((n, g) => n + g.cities.filter(([city]) => city).length, 0);
  const flights = useMemo(() => flightStats(stays, coords), [stays, coords]);
  const plannedDays = stays.reduce((n, s) => n + daysOf(s), 0);
  const schengen = useMemo(() => checkSchengen(stays), [stays]);
  const twDays = taiwanDays(stays);

  return (
    <div className="panel">
      <h2>{t('summary.title')}</h2>
      <p className="stat">
        {tr('summary.time', { planned: <b>{weeksLabel(plannedDays)}</b>, free: <b>{weeksLabel(TOTAL_DAYS - plannedDays)}</b> })}
        <br />
        {tr('summary.places', { countries: <b>{countryCount}</b>, cities: <b>{cityCount}</b> })}
        <br />
        <span title={t('summary.flightsHint')}>
          {tr('summary.flights', { legs: <b>{flights.legs}</b>, hours: <b>{Math.round(flights.hours)}</b> })}
          {flights.unknown > 0 && t('summary.flightsSkipped', { n: flights.unknown })}
        </span>
      </p>
      {(schengen.days > 0 || twDays > 0) && (
        <ul className="rules">
          {schengen.days > 0 && (
            <li title={t('rules.schengenHint', { start: fullDate(dateOfDay(0)) })} className={schengen.firstOver === null ? undefined : 'over'}>
              {tr('rules.schengen', { peak: <b>{schengen.peak}</b> })}
              {schengen.firstOver !== null && (
                <span>
                  <Warning size={16} weight="bold" />
                  {t('rules.schengenOver', { date: fullDate(dateOfDay(schengen.firstOver)) })}
                </span>
              )}
            </li>
          )}
          {twDays > 0 && (
            <li title={t('rules.taiwanHint')}>{tr('rules.taiwan', { days: <b>{daysText(twDays)}</b>, year: YEAR })}</li>
          )}
        </ul>
      )}
      <ul className="totals">
        {totals.map((g) => (
          <Fragment key={g.country}>
            {g.country && (
              <li className="country">
                <Flag country={g.country} />
                {countryLabel(g.country)}
                <span>
                  {weeksLabel(g.days)}
                  <small>{t('paren', { x: daysText(g.days) })}</small>
                </span>
              </li>
            )}
            {g.cities.map(([city, days]) => (
              <li key={city} className={g.country ? 'city' : undefined}>
                {city ? cityLabel(g.country, city) : t('other')}
                <span>
                  {weeksLabel(days)}
                  <small>{t('paren', { x: daysText(days) })}</small>
                </span>
              </li>
            ))}
          </Fragment>
        ))}
      </ul>
    </div>
  );
}
