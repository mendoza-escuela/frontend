import { api } from '../lib/api';
import type { AuthUser } from '../types/auth';

type AuthResponse = { user: AuthUser };

export const authService = {
  async login(email: string, password: string) {
    return (await api.post<AuthResponse>('/auth/login', { email, password })).data.user;
  },
  async me() {
    return (await api.get<AuthResponse>('/auth/me')).data.user;
  },
  async logout() {
    await api.post('/auth/logout');
  },
  async forgotPassword(email: string) {
    return (await api.post<{ message: string }>('/auth/forgot-password', { email })).data;
  },
  async resetPassword(token: string, newPassword: string) {
    await api.post('/auth/reset-password', { token, newPassword });
  },
  async changePassword(currentPassword: string, newPassword: string) {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },
};
