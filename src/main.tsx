import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { initErrorTracking } from './lib/error-tracking';
import { initPerformanceMonitoring } from './lib/performance';
import { initSync } from './lib/sync';

registerSW({ immediate: true });
initErrorTracking();
initPerformanceMonitoring();
initSync();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
