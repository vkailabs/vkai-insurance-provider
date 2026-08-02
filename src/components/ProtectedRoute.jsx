import { Navigate, Outlet } from 'react-router-dom';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { InteractionStatus } from '@azure/msal-browser';
import NavBar from './NavBar';
import LoadingSpinner from './LoadingSpinner';

// Guards protected routes: unauthenticated users are sent to /login.
// Authenticated users get the shared shell (nav bar + page outlet).
export default function ProtectedRoute() {
  const { inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  // TEMP DIAGNOSTIC (remove once redirect login is fixed): log routing inputs on
  // every render so we can see what decision this makes during redirect return.
  // eslint-disable-next-line no-console
  console.log(`[MSAL-DIAG ${new Date().toISOString()}] ProtectedRoute render`, {
    inProgress,
    isAuthenticated,
    path: window.location.pathname,
    hash: window.location.hash,
  });

  // While MSAL is still starting up or processing the redirect response,
  // isAuthenticated may transiently be false. Wait — don't bounce to /login
  // mid-flight — until interaction has settled to None.
  if (
    inProgress === InteractionStatus.Startup ||
    inProgress === InteractionStatus.HandleRedirect
  ) {
    return (
      <div className="app-loading">
        <LoadingSpinner label="Signing you in…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
