// Offline support for the planner. Nothing is fetched ahead of time from elsewhere: files are kept as the page
// loads them. Pages go to the network first, so a new release shows as soon as there is a connection, and fall
// back to the kept copy offline. Built files (hashed names under assets/) never change, so the kept copy is used
// straight away; other files and the web fonts are served from the copy and refreshed behind it. Map tiles,
// place lookups and analytics are left alone, so offline the map is blank.

// ignoreVary throughout: a kept copy fetched by the worker and a request from the page differ in headers (Origin)
// that servers list under Vary, which would otherwise make every lookup miss.
const CACHE = 'dnp-v1';
const FONT_HOSTS = ['font.emtech.cc', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// On every load the page sends what it loaded: kept if missing (so the first visit is enough to go offline, though
// it happened before this worker was in charge), and built files from older releases that it no longer loads are
// dropped, so the copy doesn't grow with every release.
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'keep') return;
  const urls = event.data.urls;
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      for (const req of await cache.keys())
        if (new URL(req.url).pathname.includes('/assets/') && !urls.includes(req.url)) await cache.delete(req);
      await Promise.all(
        urls.map((url) =>
          cache.match(url, { ignoreVary: true }).then((hit) => hit || fetch(url).then((res) => res.ok && cache.put(url, res)).catch(() => {})),
        ),
      );
    }),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const own = url.origin === self.location.origin;
  if (own && url.pathname.endsWith('/sw.js')) return;
  if (req.mode === 'navigate') event.respondWith(networkFirst(req));
  else if (own && url.pathname.includes('/assets/')) event.respondWith(cacheFirst(req));
  else if (own || FONT_HOSTS.includes(url.hostname)) event.respondWith(staleWhileRevalidate(event, req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) await cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req, { ignoreSearch: true, ignoreVary: true })) || Response.error();
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req, { ignoreVary: true });
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) await cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(event, req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req, { ignoreVary: true });
  const fresh = fetch(req)
    .then(async (res) => {
      if (res.ok || res.type === 'opaque') await cache.put(req, res.clone());
      return res;
    })
    .catch(() => undefined);
  if (hit) {
    event.waitUntil(fresh);
    return hit;
  }
  return (await fresh) || Response.error();
}
