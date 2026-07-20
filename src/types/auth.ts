export type UserRole = 'admin' | 'school';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
};
