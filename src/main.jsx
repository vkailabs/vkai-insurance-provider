import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MsalProvider } from '@azure/msal-react';
import App from './App';
import { msalInstance } from './auth/msalInstance';
import { AuthProvider } from './auth/AuthContext';
import './styles/index.css';

// TEMP DIAGNOSTIC (remove once redirect login is fixed): capture the URL/hash at
// the earliest possible point and again right before render, to see exactly when
// the #code=... fragment survives or is lost relative to MSAL processing.
// eslint-disable-next-line no-console
const diag = (...args) => console.log(`[MSAL-DIAG ${new Date().toISOString()}]`, ...args);
diag('main.jsx before initialize()', {
  href: window.location.href,
  hash: window.location.hash,
  search: window.location.search,
});

// MSAL must be initialized before the app renders (msal-browser v3+).
msalInstance.initialize().then(() => {
  diag('main.jsx after initialize(), before render', {
    href: window.location.href,
    hash: window.location.hash,
    search: window.location.search,
  });
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </MsalProvider>
    </React.StrictMode>
  );
});
