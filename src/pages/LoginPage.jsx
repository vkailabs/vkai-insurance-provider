import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { useEffect } from 'react';
import { loginRequest } from '../authConfig';

export default function LoginPage() {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // If already signed in, skip the landing page.
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await instance.loginPopup(loginRequest);
      if (result?.account) {
        instance.setActiveAccount(result.account);
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.message || 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  };

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
