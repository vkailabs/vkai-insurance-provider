import { createContext, useContext, useMemo } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { resolveRole, isApprover, isReviewerOrAbove } from './roles';

const AuthContext = createContext(null);

// Exposes the current ops user's identity and resolved role to the app.
export function AuthProvider({ children }) {
  const { accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  const value = useMemo(() => {
    const account = accounts[0] ?? null;
    const role = account ? resolveRole(account) : null;

    return {
      isAuthenticated,
      account,
      name: account?.name ?? account?.username ?? '',
      username: account?.username ?? '',
      role,
      isApprover: isApprover(role),
      isReviewerOrAbove: isReviewerOrAbove(role),
    };
  }, [accounts, isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
