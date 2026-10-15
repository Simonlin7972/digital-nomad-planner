import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/base.css';
import 'flag-icons/css/flag-icons.min.css';
import { Cities } from './Cities';
import { initAnalytics } from '../lib/analytics';

initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Cities />
  </StrictMode>,
);
