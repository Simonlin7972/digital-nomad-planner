// Google Analytics 4, loaded only in the production build so local development sends nothing.
// Events go through `track`, whose parameters are fixed in `Events`: interface choices, bucketed counts and
// flags only. Never pass plan data (places, dates, flights, notes, companions) or anything the user typed.
// The plan and checklist for events live in ANALYTICS.md.

const GA_ID = 'G-9RWHNKHMK9';
const ACTIVATED_KEY = 'dnp-ga-activated';
const INTERNAL_KEY = 'dnp-ga-internal';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type CountBucket = '1' | '2-5' | '6-15' | '16+';

type Events = {
  cta_click: { location: 'nav' | 'hero' | 'final' | 'changelog' };
  stay_create: { view: 'year' | 'month'; stay_count: CountBucket };
  plan_activated: Record<string, never>;
  export_json: { years: number; source: 'menu' | 'reminder' };
  import_result: { ok: boolean; years: number };
  share_open: Record<string, never>;
  share_download: { method: 'download' | 'native_share' };
};

export function bucket(n: number): CountBucket {
  if (n <= 1) return '1';
  if (n <= 5) return '2-5';
  if (n <= 15) return '6-15';
  return '16+';
}

function stored(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function store(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // storage blocked: the flag just won't persist
  }
}

export function initAnalytics() {
  if (!import.meta.env.PROD) return;

  // ?internal=1 marks this browser as the owner's so GA can filter it out; ?internal=0 clears it.
  const params = new URLSearchParams(location.search);
  const internal = params.get('internal');
  if (internal === '1') store(INTERNAL_KEY, '1');
  else if (internal === '0') store(INTERNAL_KEY, null);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  // gtag.js expects the arguments object itself, not an array.
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, {
    ...(stored(INTERNAL_KEY) === '1' && { traffic_type: 'internal' }),
    // ?ga_debug=1 sends this page's events to GA's DebugView.
    ...(params.get('ga_debug') === '1' && { debug_mode: true }),
  });
}

export function track<K extends keyof Events>(name: K, params: Events[K]) {
  if (window.gtag) window.gtag('event', name, params);
  else if (import.meta.env.DEV) console.debug('[analytics]', name, params);
}

// For a link that leaves the page: an event fired as the page unloads is often lost, so hold the navigation
// until gtag has sent it (or a second has passed). New-tab and modified clicks are left to the browser.
export function trackLink<K extends keyof Events>(e: React.MouseEvent<HTMLAnchorElement>, name: K, params: Events[K]) {
  const gtag = window.gtag;
  if (!gtag || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return track(name, params);
  e.preventDefault();
  const href = e.currentTarget.href;
  let gone = false;
  const go = () => {
    if (gone) return;
    gone = true;
    location.href = href;
  };
  gtag('event', name, { ...params, event_callback: go, event_timeout: 1000 });
  setTimeout(go, 1200);
}

// Sent once per browser, the first time a stay is created.
export function trackActivation() {
  if (stored(ACTIVATED_KEY)) return;
  store(ACTIVATED_KEY, '1');
  track('plan_activated', {});
}
