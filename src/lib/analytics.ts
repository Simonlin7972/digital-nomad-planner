// Google Analytics 4, loaded only in the production build so local development sends nothing.
// Only page views and GA's enhanced measurement are recorded; never pass plan data (places, dates, flights) to gtag.

const GA_ID = 'G-9RWHNKHMK9';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export function initAnalytics() {
  if (!import.meta.env.PROD) return;

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
  window.gtag('config', GA_ID);
}
