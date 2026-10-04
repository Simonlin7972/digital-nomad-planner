import { useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// Let Vite bundle the worker; MapLibre's own lookup breaks once the library is pre-bundled.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import type { LngLat } from './geocode';
import { colorOf, placeFull, placeName, type Stay } from './storage';
import { placeQuery, type Coords } from './useCoords';
import { daysOf, rangeLabel, weeksLabel } from './weeks';

maplibregl.setWorkerUrl(workerUrl);

const STYLE = 'https://tiles.openfreemap.org/styles/positron';
const ROUTE = 'route';

const queryOf = placeQuery;

export default function MapView({ stays, coords, failed }: { stays: Stay[]; coords: Coords; failed: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const fitted = useRef('');
  const [ready, setReady] = useState(false);

  // Unique places in the order they are first visited, each with all of its stays.
  const places = useMemo(() => {
    const byQuery = new Map<string, Stay[]>();
    for (const s of [...stays].sort((a, b) => a.startDay - b.startDay)) {
      const q = queryOf(s);
      byQuery.set(q, [...(byQuery.get(q) ?? []), s]);
    }
    return [...byQuery.entries()].map(([query, visits]) => ({ query, visits }));
  }, [stays]);

  const pending = places.filter((p) => !(p.query in coords)).map((p) => p.query);
  const missing = places.filter((p) => coords[p.query] === null).map((p) => placeFull(p.visits[0]));

  useEffect(() => {
    const map = new maplibregl.Map({
      container: container.current!,
      style: STYLE,
      center: [105, 20],
      zoom: 1.4,
      cooperativeGestures: true, // page scroll shouldn't get trapped by the map
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => {
      map.addSource(ROUTE, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: ROUTE,
        type: 'line',
        source: ROUTE,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#222222', 'line-width': 1.5, 'line-opacity': 0.55, 'line-dasharray': [2, 2] },
      });
      setReady(true);
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    markers.current.forEach((m) => m.remove());
    markers.current = [];
    const located = places.flatMap((p) => {
      const at = coords[p.query];
      return at ? [{ ...p, at }] : [];
    });

    located.forEach((p, i) => {
      const pin = document.createElement('div');
      pin.className = 'map-pin';
      pin.style.background = colorOf(p.visits[0]);
      pin.textContent = String(i + 1);

      const body = document.createElement('div');
      body.className = 'map-popup';
      const title = document.createElement('strong');
      title.textContent = placeFull(p.visits[0]);
      body.append(title);
      for (const v of p.visits) {
        const line = document.createElement('div');
        line.textContent = `${rangeLabel(v)}・${weeksLabel(daysOf(v))}`;
        body.append(line);
      }

      const marker = new maplibregl.Marker({ element: pin })
        .setLngLat(p.at)
        .setPopup(new maplibregl.Popup({ offset: 16, closeButton: false }).setDOMContent(body))
        .addTo(map);
      pin.title = placeName(p.visits[0]);
      markers.current.push(marker);
    });

    // The route follows the stays chronologically, so a place visited twice is passed through twice.
    const at = new Map(located.map((p) => [p.query, p.at]));
    const path: LngLat[] = [];
    for (const s of [...stays].sort((a, b) => a.startDay - b.startDay)) {
      const point = at.get(queryOf(s));
      const last = path[path.length - 1];
      if (point && !(last && last[0] === point[0] && last[1] === point[1])) path.push(point);
    }
    (map.getSource(ROUTE) as maplibregl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: path.length > 1 ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: path } }] : [],
    });

    // Re-frame only when the set of located places changes, not on every edit.
    const key = located.map((p) => p.query).join('|');
    if (key && key !== fitted.current) {
      const bounds = new maplibregl.LngLatBounds();
      located.forEach((p) => bounds.extend(p.at));
      map.fitBounds(bounds, { padding: 64, maxZoom: 6, duration: 600 });
    }
    fitted.current = key;
  }, [places, stays, coords, ready]);

  return (
    <>
      <div ref={container} className="map" />
      <p className="map-status">
        {places.length === 0 && '排好行程後，去過的地方會出現在地圖上。'}
        {pending.length > 0 && !failed && `查詢座標中…（剩 ${pending.length} 個地點）`}
        {failed && '座標查詢失敗，請檢查網路後重新整理。'}
        {missing.length > 0 && ` 找不到：${missing.join('、')}（試試改用英文或更完整的名稱）`}
      </p>
    </>
  );
}
