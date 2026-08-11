import { api } from "../lib/api";
import { downloadBlob } from "../lib/download";
import type {
  ImportPreview,
  ImportResult,
  CreatedUser,
  ManagedUser,
  SchoolOptionListResponse,
  UserListResponse,
  UserWriteInput,
} from "../types/admin-user";
import type { UserRole } from "../types/auth";

export type UserFilters = {
  search?: string;
  role?: UserRole | "";
  isActive?: boolean | "";
  schoolId?: string;
  page?: number;
  limit?: number;
};

export const adminUsersService = {
  async list(filters: UserFilters, signal?: AbortSignal) {
    const params = Object.fromEntries(
      Object.entries(filters).filter(
        ([, value]) => value !== "" && value !== undefined,
      ),
    );
    return (await api.get<UserListResponse>("/admin/users", { params, signal }))
      .data;
  },
  async findOne(id: string) {
    return (await api.get<ManagedUser>(`/admin/users/${id}`)).data;
  },
  async schools(
    filters: { search?: string; page?: number; limit?: number } = {},
    signal?: AbortSignal,
  ) {
    return (
      await api.get<SchoolOptionListResponse>("/admin/users/schools", {
        params: filters,
        signal,
      })
    ).data;
  },
  async create(input: UserWriteInput & { temporaryPassword: string }) {
    return (await api.post<CreatedUser>("/admin/users", input)).data;
  },
  async update(id: string, input: UserWriteInput) {
    return (await api.patch<ManagedUser>(`/admin/users/${id}`, input)).data;
  },
  async setStatus(id: string, isActive: boolean) {
    return (
      await api.patch<ManagedUser>(`/admin/users/${id}/status`, { isActive })
    ).data;
  },
  async resetPassword(id: string, temporaryPassword: string) {
    await api.post(`/admin/users/${id}/reset-password`, { temporaryPassword });
  },
  async downloadTemplate() {
    const response = await api.get<Blob>("/admin/users/import/template", {
      responseType: "blob",
    });
    downloadBlob(response.data, "plantilla-usuarios.csv");
  },
  async preview(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return (
      await api.post<ImportPreview>("/admin/users/import/preview", formData)
    ).data;
  },
  async import(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return (await api.post<ImportResult>("/admin/users/import", formData)).data;
  },
};
