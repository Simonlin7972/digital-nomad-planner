import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Bento from './Bento';
import './page.css';

// Internal test page at /bento/: the feature bento built with the Stageshow kit. Published but linked from
// nowhere; no analytics, no plan data, no profile.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main className="bento-page">
      <Bento />
    </main>
  </StrictMode>,
);
