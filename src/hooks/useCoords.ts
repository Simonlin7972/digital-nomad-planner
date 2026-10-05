import { useEffect, useState } from 'react';
import { geocode, loadGeocodeCache, type LngLat } from '../lib/geocode';
import type { Stay } from '../lib/storage';

export type Coords = Record<string, LngLat | null>;

// The text sent to the geocoder, and the key a place's coordinates are stored under.
export const placeQuery = (s: Pick<Stay, 'country' | 'city'>) => [s.city, s.country].filter(Boolean).join(', ');

// Coordinates for every place in the plan, looked up (and cached) as places appear.
export function useCoords(stays: Stay[]): { coords: Coords; failed: boolean } {
  const [coords, setCoords] = useState<Coords>(loadGeocodeCache);
  const [failed, setFailed] = useState(false);
  const pendingKey = [...new Set(stays.map(placeQuery))].filter((q) => !(q in coords)).join('|');

  useEffect(() => {
    if (!pendingKey) return;
    let cancelled = false;
    setFailed(false);
    for (const query of pendingKey.split('|')) {
      geocode(query).then(
        (value) => !cancelled && setCoords((prev) => ({ ...prev, [query]: value })),
        () => !cancelled && setFailed(true),
      );
    }
    return () => {
      cancelled = true;
    };
  }, [pendingKey]);

  return { coords, failed };
}

const R_KM = 6371;
const rad = (deg: number) => (deg * Math.PI) / 180;

export function distanceKm(a: LngLat, b: LngLat): number {
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.sqrt(h));
}

const MIN_FLIGHT_KM = 300; // shorter hops are assumed to be ground travel
const CRUISE_KMH = 850;
const OVERHEAD_H = 0.5; // taxi, climb and descent per flight

// Rough flight tally for moving between consecutive stays, straight-line and non-stop.
export function flightStats(stays: Stay[], coords: Coords): { legs: number; hours: number; unknown: number } {
  const sorted = [...stays].sort((a, b) => a.startDay - b.startDay);
  let legs = 0;
  let hours = 0;
  let unknown = 0;
  for (let i = 1; i < sorted.length; i++) {
    const from = placeQuery(sorted[i - 1]);
    const to = placeQuery(sorted[i]);
    if (from === to) continue;
    const a = coords[from];
    const b = coords[to];
    if (!a || !b) {
      unknown++;
      continue;
    }
    const km = distanceKm(a, b);
    if (km < MIN_FLIGHT_KM) continue;
    legs++;
    hours += km / CRUISE_KMH + OVERHEAD_H;
  }
  return { legs, hours, unknown };
}
