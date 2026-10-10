import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/base.css';
import { PixelGuide } from './PixelGuide';

// Dev-only page at /pixel/: no analytics, no plan data, not part of the production build.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PixelGuide />
  </StrictMode>,
);
