import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Same cascade order as the app: third-party CSS, then base, then the page (whose parts bring their own).
import 'flag-icons/css/flag-icons.min.css';
import '../styles/base.css';
import { Profile } from './Profile';
import { initAnalytics } from '../lib/analytics';
import { takeAuthCode } from '../lib/cloud';

// Before analytics: the sign-in code Google sends back must be out of the address before the page view is sent.
takeAuthCode();
initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Profile />
  </StrictMode>,
);
