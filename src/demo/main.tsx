import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'flag-icons/css/flag-icons.min.css';
import '../styles/base.css';
import { Demo } from './Demo';

// Dev-only page at /demo/: no analytics, no plan data, not part of the production build.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
