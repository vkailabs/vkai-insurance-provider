import { useState } from 'react';
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
  // Mobile menu open/closed. Ignored above the 768px breakpoint (the menu is
  // always shown inline there via `display: contents`).
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    // Redirect (not popup) for consistency with the login flow and to avoid the
    // same popup unreliability on mobile Safari.
    instance.logoutRedirect({ postLogoutRedirectUri: '/login' });
  };

  return (
    <header className="navbar">
      <div className="navbar__brand">
        <span className="navbar__logo">VK AI Labs</span>
        <span className="navbar__title">Provider Portal</span>
      </div>

      {/* Hamburger — visible only below the mobile breakpoint (CSS-controlled). */}
      <button
        type="button"
        className="navbar__toggle"
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="navbar__toggle-bar" />
        <span className="navbar__toggle-bar" />
        <span className="navbar__toggle-bar" />
      </button>

      <div className={`navbar__menu${menuOpen ? ' navbar__menu--open' : ''}`}>
        <nav className="navbar__links">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={closeMenu}
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
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              closeMenu();
              handleLogout();
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
