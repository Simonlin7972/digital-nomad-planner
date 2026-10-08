import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/base.css';
import { DesignSystem } from './DesignSystem';
import { mirrorStates } from './forceStates';

// Dev-only page at /design/: no analytics, no plan data, not part of the production build.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DesignSystem />
  </StrictMode>,
);

// Vite injects each imported stylesheet as a <style> tag; mirror their states once they are in, and again
// whenever a stylesheet is hot-reloaded.
requestAnimationFrame(mirrorStates);
import.meta.hot?.on('vite:afterUpdate', () => requestAnimationFrame(mirrorStates));
