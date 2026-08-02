import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import LoadingSpinner from '../components/LoadingSpinner';

// Dedicated MSAL redirect landing page. It is the ONLY route allowed to route
// the user after a fresh redirect return, and it deliberately does NOT navigate
// during render — so MSAL's handleRedirectPromise can read the #code=... hash
// undisturbed before any client-side navigation strips it.
export default function AuthCallbackPage() {
  const { inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const navigate = useNavigate();

  // Once MSAL has fully finished processing the redirect (inProgress === None),
  // send the user on: /dashboard if authenticated, otherwise back to /login.
  useEffect(() => {
    if (inProgress === InteractionStatus.None) {
      navigate(isAuthenticated ? '/dashboard' : '/login', { replace: true });
    }
  }, [inProgress, isAuthenticated, navigate]);

  return (
    <div className="app-loading">
      <LoadingSpinner label="Signing you in…" />
    </div>
  );
}
