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
  beginAuthenticationOperation,
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
  const authenticationMutationTail = useRef<Promise<void>>(Promise.resolve());
  const pendingAuthenticationRequests = useRef(0);
  const currentUser = useRef<AuthUser | null>(null);

  const updateUser = useCallback((nextUser: AuthUser | null) => {
    currentUser.current = nextUser;
    setUser(nextUser);
  }, []);

  const refreshUser = useCallback(async () => {
    const operation = ++authenticationOperation.current;
    beginAuthenticationOperation();
    pendingAuthenticationRequests.current += 1;
    try {
      const authenticatedUser = await authService.me();
      if (operation !== authenticationOperation.current) return;
      beginAuthenticationOperation();
      updateUser(authenticatedUser);
      setSessionExpired(false);
      setAuthenticationErrorStatus(null);
    } catch (error) {
      if (operation !== authenticationOperation.current) return;
      updateUser(null);
      setAuthenticationErrorStatus(
        getAppHttpErrorDetail(error)?.statusCode ?? null,
      );
    } finally {
      pendingAuthenticationRequests.current -= 1;
    }
  }, [updateUser]);

  useEffect(() => {
    void refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  useEffect(() => {
    const clearInvalidSession = () => {
      // Un 401 vigente limpia el estado actual, pero no debe cancelar un
      // login/refresh ya en curso: esa operación decidirá el estado final.
      if (pendingAuthenticationRequests.current === 0)
        authenticationOperation.current += 1;
      beginAuthenticationOperation();
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

  const runAuthenticationMutation = useCallback(
    <T,>(mutation: () => Promise<T>): Promise<T> => {
      pendingAuthenticationRequests.current += 1;
      const previous = authenticationMutationTail.current.catch(
        () => undefined,
      );
      const current = previous.then(mutation);
      authenticationMutationTail.current = current.then(
        () => undefined,
        () => undefined,
      );
      return current.finally(() => {
        pendingAuthenticationRequests.current -= 1;
      });
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      sessionExpired,
      authenticationErrorStatus,
      login: async (email, password) => {
        const operation = ++authenticationOperation.current;
        beginAuthenticationOperation();
        return runAuthenticationMutation(async () => {
          const authenticatedUser = await authService.login(email, password);
          beginAuthenticationOperation();
          if (operation !== authenticationOperation.current)
            return authenticatedUser;
          updateUser(authenticatedUser);
          setSessionExpired(false);
          setAuthenticationErrorStatus(null);
          return authenticatedUser;
        });
      },
      logout: async () => {
        const operation = ++authenticationOperation.current;
        beginAuthenticationOperation();
        await runAuthenticationMutation(async () => {
          try {
            await authService.logout();
          } finally {
            beginAuthenticationOperation();
            if (operation === authenticationOperation.current) {
              updateUser(null);
              setSessionExpired(false);
              setAuthenticationErrorStatus(null);
            }
          }
        });
      },
      refreshUser,
    }),
    [
      authenticationErrorStatus,
      isLoading,
      refreshUser,
      runAuthenticationMutation,
      sessionExpired,
      updateUser,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
