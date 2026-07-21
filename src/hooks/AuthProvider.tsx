import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { authService } from '../services/auth.service';
import type { AuthUser } from '../types/auth';
import { AUTH_UNAUTHORIZED_EVENT } from '../lib/api';
import { AuthContext, type AuthContextValue } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try { setUser(await authService.me()); } catch { setUser(null); }
  };

  useEffect(() => { void refreshUser().finally(() => setIsLoading(false)); }, []);

  useEffect(() => {
    const clearInvalidSession = () => setUser(null);
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, clearInvalidSession);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, clearInvalidSession);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    login: async (email, password) => {
      const authenticatedUser = await authService.login(email, password);
      setUser(authenticatedUser);
      return authenticatedUser;
    },
    logout: async () => {
      try { await authService.logout(); } finally { setUser(null); }
    },
    refreshUser,
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
