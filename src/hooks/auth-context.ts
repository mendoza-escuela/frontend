import { createContext } from 'react';
import type { AppHttpErrorStatus } from '../lib/api';
import type { AuthUser } from '../types/auth';

export type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  sessionExpired: boolean;
  authenticationErrorStatus: AppHttpErrorStatus | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
