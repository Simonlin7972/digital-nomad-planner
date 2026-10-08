// Registers the service worker (public/sw.js) that lets the planner open offline, in the production build only:
// in development it would keep serving stale modules. It lives at the site root, one level above /app/.
export function registerOffline() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('../sw.js', { scope: '../' })
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        // What loaded before the worker took over isn't kept yet; hand it the list.
        const urls = [
          location.href.split('#')[0],
          ...performance
            .getEntriesByType('resource')
            .map((e) => e.name)
            .filter((u) => u.startsWith(location.origin) || /font\.emtech\.cc|fonts\.(googleapis|gstatic)\.com/.test(u)),
        ];
        reg.active?.postMessage({ type: 'keep', urls });
      })
      .catch(() => {
        // no offline copy; the planner works the same online
      });
  });
}
