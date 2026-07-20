import { api } from '../lib/api';
import type {
  ImportPreview,
  ImportResult,
  ManagedUser,
  SchoolOption,
  UserListResponse,
  UserWriteInput,
} from '../types/admin-user';
import type { UserRole } from '../types/auth';

export type UserFilters = {
  search?: string;
  role?: UserRole | '';
  isActive?: boolean | '';
  schoolId?: string;
  page?: number;
  limit?: number;
};

export const adminUsersService = {
  async list(filters: UserFilters) {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined),
    );
    return (await api.get<UserListResponse>('/admin/users', { params })).data;
  },
  async findOne(id: string) {
    return (await api.get<ManagedUser>(`/admin/users/${id}`)).data;
  },
  async schools() {
    return (await api.get<SchoolOption[]>('/admin/users/schools')).data;
  },
  async create(input: UserWriteInput & { temporaryPassword: string }) {
    return (await api.post<ManagedUser>('/admin/users', input)).data;
  },
  async update(id: string, input: UserWriteInput) {
    return (await api.patch<ManagedUser>(`/admin/users/${id}`, input)).data;
  },
  async setStatus(id: string, isActive: boolean) {
    return (await api.patch<ManagedUser>(`/admin/users/${id}/status`, { isActive })).data;
  },
  async resetPassword(id: string, temporaryPassword: string) {
    await api.post(`/admin/users/${id}/reset-password`, { temporaryPassword });
  },
  async downloadTemplate() {
    const response = await api.get<Blob>('/admin/users/import/template', { responseType: 'blob' });
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla-usuarios.csv';
    link.click();
    URL.revokeObjectURL(url);
  },
  async preview(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return (await api.post<ImportPreview>('/admin/users/import/preview', formData)).data;
  },
  async import(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return (await api.post<ImportResult>('/admin/users/import', formData)).data;
  },
};
