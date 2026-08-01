import { Navigate, Outlet } from 'react-router-dom';
import { useIsAuthenticated } from '@azure/msal-react';
import NavBar from './NavBar';

// Guards protected routes: unauthenticated users are sent to /login.
// Authenticated users get the shared shell (nav bar + page outlet).
export default function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated();

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
