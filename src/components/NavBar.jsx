import { NavLink } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useAuth } from '../auth/AuthContext';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/catalog', label: 'Catalog' },
  { to: '/enrollments', label: 'Enrollments' },
  { to: '/claims', label: 'Claims' },
  { to: '/premiums', label: 'Premiums' },
  { to: '/sync-issues', label: 'Sync Issues' },
];

export default function NavBar() {
  const { instance } = useMsal();
  const { name, username, role } = useAuth();

  const handleLogout = () => {
    // Redirect (not popup) for consistency with the login flow and to avoid the
    // same popup unreliability on mobile Safari.
    instance.logoutRedirect({ postLogoutRedirectUri: '/login' });
  };

  return (
    <header className="navbar">
      <div className="navbar__brand">
        <span className="navbar__logo">VK</span>
        <span className="navbar__title">Insurance Provider Portal</span>
      </div>

      <nav className="navbar__links">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `navbar__link${isActive ? ' navbar__link--active' : ''}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="navbar__user">
        <div className="navbar__user-info">
          <span className="navbar__user-name">{name || username}</span>
          {role ? (
            <span className={`role-badge role-badge--${role.toLowerCase()}`}>
              {role}
            </span>
          ) : (
            <span className="role-badge role-badge--none">No role</span>
          )}
        </div>
        <button type="button" className="btn btn--ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
