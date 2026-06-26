import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Always open at the top on load/refresh — disable the browser's scroll restore
// and force the top across every entry path (initial load, reload, and the
// back-forward / bfcache "pageshow" restore), bypassing CSS smooth-scroll.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
toTop();
window.addEventListener('load', toTop);
window.addEventListener('pageshow', toTop);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
