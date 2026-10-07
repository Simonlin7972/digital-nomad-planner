import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/base.css';
import { Changelog } from './Changelog';
import { initAnalytics } from '../lib/analytics';

initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Changelog />
  </StrictMode>,
);
