import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import {BrowserRouter} from 'react-router-dom'
import './index.css';
import App from './App';
import './components/i18n';
import { installAxiosErrorTranslation } from './utils/errorTranslator';
import { ErrorBoundary } from '../ErrorBoundary.jsx';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || 'https://62f0d2de8712f1ce30e244e7e3d3be98@o4511636173488128.ingest.de.sentry.io/4511636192165968',
  environment: import.meta.env.MODE,
  integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
  tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
});

installAxiosErrorTranslation();

document.documentElement.classList.add("js-enabled");
document.getElementById("seo-prerender")?.remove();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
