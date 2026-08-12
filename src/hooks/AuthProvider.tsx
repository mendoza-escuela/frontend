import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { authService } from '../services/auth.service';
import type { AuthUser } from '../types/auth';
import {
  AUTH_UNAUTHORIZED_EVENT,
  getAppHttpErrorDetail,
  type AppHttpErrorStatus,
} from '../lib/api';
import { AuthContext, type AuthContextValue } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [authenticationErrorStatus, setAuthenticationErrorStatus] =
    useState<AppHttpErrorStatus | null>(null);
  const authenticationOperation = useRef(0);

  const refreshUser = useCallback(async () => {
    const operation = ++authenticationOperation.current;
    try {
      const authenticatedUser = await authService.me();
      if (operation !== authenticationOperation.current) return;
      setUser(authenticatedUser);
      setSessionExpired(false);
      setAuthenticationErrorStatus(null);
    } catch (error) {
      if (operation !== authenticationOperation.current) return;
      setUser(null);
      setAuthenticationErrorStatus(
        getAppHttpErrorDetail(error)?.statusCode ?? null,
      );
    }
  }, []);

  useEffect(() => {
    void refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  useEffect(() => {
    const clearInvalidSession = () => {
      authenticationOperation.current += 1;
      setAuthenticationErrorStatus(null);
      if (user) setSessionExpired(true);
      setUser(null);
    };
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, clearInvalidSession);
    return () =>
      window.removeEventListener(
        AUTH_UNAUTHORIZED_EVENT,
        clearInvalidSession,
      );
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      sessionExpired,
      authenticationErrorStatus,
      login: async (email, password) => {
        const operation = ++authenticationOperation.current;
        const authenticatedUser = await authService.login(email, password);
        if (operation !== authenticationOperation.current)
          return authenticatedUser;
        setUser(authenticatedUser);
        setSessionExpired(false);
        setAuthenticationErrorStatus(null);
        return authenticatedUser;
      },
      logout: async () => {
        authenticationOperation.current += 1;
        try {
          await authService.logout();
        } finally {
          setUser(null);
          setSessionExpired(false);
          setAuthenticationErrorStatus(null);
        }
      },
      refreshUser,
    }),
    [authenticationErrorStatus, isLoading, refreshUser, sessionExpired, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
