import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import { useEffect } from 'react';
import { loginRequest } from '../authConfig';
import LoadingSpinner from '../components/LoadingSpinner';

export default function LoginPage() {
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const settling =
    inProgress === InteractionStatus.Startup ||
    inProgress === InteractionStatus.HandleRedirect;

  // TEMP DIAGNOSTIC (remove once redirect login is fixed): log routing inputs on
  // every render so we can see whether/when the /dashboard navigation fires.
  // eslint-disable-next-line no-console
  console.log(`[MSAL-DIAG ${new Date().toISOString()}] LoginPage render`, {
    inProgress,
    isAuthenticated,
    settling,
    path: window.location.pathname,
    hash: window.location.hash,
  });

  // If already signed in, skip the landing page — but only once MSAL has
  // finished any in-flight redirect processing, so we don't act on a transient
  // isAuthenticated=false (or navigate before the account is ready).
  useEffect(() => {
    if (inProgress === InteractionStatus.None && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [inProgress, isAuthenticated, navigate]);

  const handleLogin = async () => {
    setBusy(true);
    setError(null);
    try {
      // Redirect flow instead of a popup: popups break on mobile Safari because
      // React Router intercepts the auth-response hash inside the popup window
      // before MSAL can read it (BrowserAuthError "hash_empty_error").
      // loginRedirect navigates the whole page to Microsoft and back; on return,
      // MsalProvider processes the response (it calls handleRedirectPromise
      // automatically) and the useEffect above routes the now-authenticated user
      // to /dashboard. On success the page redirects away, so we leave `busy`
      // set; only reset it if initiating the redirect fails.
      await instance.loginRedirect(loginRequest);
    } catch (err) {
      setError(err?.message || 'Sign-in failed.');
      setBusy(false);
    }
  };

  // While MSAL is settling a redirect, show a spinner rather than flashing the
  // sign-in card (the redirect may resolve into an authenticated session).
  if (settling) {
    return (
      <div className="app-loading">
        <LoadingSpinner label="Signing you in…" />
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__logo">VK</div>
        <h1 className="login-card__title">Insurance Provider Portal</h1>
        <p className="login-card__subtitle">
          Ops console for enrollments, claims &amp; premiums.
        </p>

        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={handleLogin}
          disabled={busy}
        >
          {busy ? 'Signing in…' : 'Sign in with Microsoft'}
        </button>

        {error && <p className="login-card__error">⚠ {error}</p>}
      </div>
    </div>
  );
}
