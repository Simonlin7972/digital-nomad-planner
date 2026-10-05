import { Fragment, useMemo } from 'react';
import { flightStats, type Coords } from '../hooks/useCoords';
import type { Stay } from '../lib/storage';
import { TOTAL_DAYS, daysOf, weeksLabel } from '../lib/weeks';
import { Flag } from './Flag';
import './Summary.css';

// Totals for the whole year: time planned, places visited, a flight estimate, and days per country and city.
export function Summary({ stays, coords }: { stays: Stay[]; coords: Coords }) {
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

  return (
    <div className="panel">
      <h2>摘要</h2>
      <p className="stat">
        已安排 <b>{weeksLabel(plannedDays)}</b>・未安排 <b>{weeksLabel(TOTAL_DAYS - plannedDays)}</b>
        <br />
        去了 <b>{countryCount}</b> 個國家・<b>{cityCount}</b> 個城市
        <br />
        <span title="依行程順序、兩地直線距離估算；300 公里內視為陸路不計，未含轉機">
          約 <b>{flights.legs}</b> 個航段・飛行約 <b>{Math.round(flights.hours)}</b> 小時
          {flights.unknown > 0 && `（${flights.unknown} 段查無座標未計）`}
        </span>
      </p>
      <ul className="totals">
        {totals.map((g) => (
          <Fragment key={g.country}>
            {g.country && (
              <li className="country">
                <Flag country={g.country} />
                {g.country}
                <span>
                  {weeksLabel(g.days)}
                  <small>（{g.days} 天）</small>
                </span>
              </li>
            )}
            {g.cities.map(([city, days]) => (
              <li key={city} className={g.country ? 'city' : undefined}>
                {city || '其他'}
                <span>
                  {weeksLabel(days)}
                  <small>（{days} 天）</small>
                </span>
              </li>
            ))}
          </Fragment>
        ))}
      </ul>
    </div>
  );
}
