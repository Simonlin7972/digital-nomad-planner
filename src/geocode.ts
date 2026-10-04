export type LngLat = [number, number];

const KEY = 'dnp-geocode';
const GAP_MS = 1100; // Nominatim allows at most one request per second

type Cache = Record<string, LngLat | null>;

export function loadGeocodeCache(): Cache {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return data && typeof data === 'object' ? (data as Cache) : {};
  } catch {
    return {};
  }
}

function remember(query: string, value: LngLat | null) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...loadGeocodeCache(), [query]: value }));
  } catch {
    // lookups just won't be cached
  }
}

let queue: Promise<unknown> = Promise.resolve();
const inflight = new Map<string, Promise<LngLat | null>>();

// Looks a place name up on OpenStreetMap's Nominatim. Resolves to null when nothing matches;
// rejects on network errors so the caller can retry later instead of caching a miss.
export function geocode(query: string): Promise<LngLat | null> {
  const cached = loadGeocodeCache();
  if (query in cached) return Promise.resolve(cached[query]);
  const running = inflight.get(query);
  if (running) return running;
  const run = async () => {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`geocode ${res.status}`);
    const [hit] = (await res.json()) as { lon: string; lat: string }[];
    const value: LngLat | null = hit ? [Number(hit.lon), Number(hit.lat)] : null;
    remember(query, value);
    await new Promise((r) => setTimeout(r, GAP_MS));
    return value;
  };
  const result = queue.then(run, run).finally(() => inflight.delete(query));
  inflight.set(query, result);
  queue = result.catch(() => undefined);
  return result;
}
