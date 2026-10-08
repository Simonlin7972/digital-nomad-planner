import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Order matters for the cascade: third-party CSS, then our base, then the app (whose components bring their own).
import 'flag-icons/css/flag-icons.min.css';
import './styles/base.css';
import App from './App';
import { initAnalytics } from './lib/analytics';
import { registerOffline } from './lib/offline';
import { takeTransferHash } from './lib/transfer';

// Before analytics: a plan link must be out of the address before the page view is sent.
takeTransferHash();
initAnalytics();
registerOffline();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
