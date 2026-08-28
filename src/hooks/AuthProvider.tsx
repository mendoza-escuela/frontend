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
  const currentUser = useRef<AuthUser | null>(null);

  const updateUser = useCallback((nextUser: AuthUser | null) => {
    currentUser.current = nextUser;
    setUser(nextUser);
  }, []);

  const refreshUser = useCallback(async () => {
    const operation = ++authenticationOperation.current;
    try {
      const authenticatedUser = await authService.me();
      if (operation !== authenticationOperation.current) return;
      updateUser(authenticatedUser);
      setSessionExpired(false);
      setAuthenticationErrorStatus(null);
    } catch (error) {
      if (operation !== authenticationOperation.current) return;
      updateUser(null);
      setAuthenticationErrorStatus(
        getAppHttpErrorDetail(error)?.statusCode ?? null,
      );
    }
  }, [updateUser]);

  useEffect(() => {
    void refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  useEffect(() => {
    const clearInvalidSession = () => {
      authenticationOperation.current += 1;
      setAuthenticationErrorStatus(null);
      if (currentUser.current) setSessionExpired(true);
      updateUser(null);
    };
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, clearInvalidSession);
    return () =>
      window.removeEventListener(
        AUTH_UNAUTHORIZED_EVENT,
        clearInvalidSession,
      );
  }, [updateUser]);

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
        updateUser(authenticatedUser);
        setSessionExpired(false);
        setAuthenticationErrorStatus(null);
        return authenticatedUser;
      },
      logout: async () => {
        authenticationOperation.current += 1;
        try {
          await authService.logout();
        } finally {
          updateUser(null);
          setSessionExpired(false);
          setAuthenticationErrorStatus(null);
        }
      },
      refreshUser,
    }),
    [
      authenticationErrorStatus,
      isLoading,
      refreshUser,
      sessionExpired,
      updateUser,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
