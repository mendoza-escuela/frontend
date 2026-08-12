import { api } from "../lib/api";
import { downloadBlob } from "../lib/download";
import type {
  SchoolDetail,
  SchoolCreateResponse,
  SchoolFilterOptions,
  SchoolImportPreview,
  SchoolImportResult,
  SchoolListResponse,
  SchoolRectificationCatalogs,
  SchoolUpdateAndRectifyInput,
  SchoolUserListResponse,
  SchoolWriteInput,
} from "../types/admin-school";

export type SchoolFilters = {
  search?: string;
  department?: string;
  locality?: string;
  educationLevel?: string;
  managementType?: string;
  scope?: string;
  shift?: string;
  isActive?: boolean | "";
  page?: number;
  limit?: number;
};
const cleanParams = (filters: SchoolFilters) =>
  Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== "" && value !== undefined,
    ),
  );
export const adminSchoolsService = {
  async list(filters: SchoolFilters, signal?: AbortSignal) {
    return (
      await api.get<SchoolListResponse>("/admin/schools", {
        params: cleanParams(filters),
        signal,
      })
    ).data;
  },
  async filters() {
    return (await api.get<SchoolFilterOptions>("/admin/schools/filters")).data;
  },
  async rectificationCatalogs() {
    return (
      await api.get<SchoolRectificationCatalogs>(
        "/admin/schools/rectification/catalogs",
      )
    ).data;
  },
  async findOne(id: string) {
    return (await api.get<SchoolDetail>(`/admin/schools/${id}`)).data;
  },
  async create(input: SchoolWriteInput) {
    return (await api.post<SchoolCreateResponse>("/admin/schools", input)).data;
  },
  async update(id: string, input: Partial<SchoolWriteInput>) {
    return (await api.patch<SchoolDetail>(`/admin/schools/${id}`, input)).data;
  },
  async updateAndRectify(id: string, input: SchoolUpdateAndRectifyInput) {
    return (
      await api.put<SchoolDetail>(`/admin/schools/${id}/rectification`, input)
    ).data;
  },
  async setStatus(id: string, isActive: boolean) {
    return (
      await api.patch<SchoolDetail>(`/admin/schools/${id}/status`, { isActive })
    ).data;
  },
  async assignUser(id: string, userId: string | null) {
    return (
      await api.patch<SchoolDetail>(`/admin/schools/${id}/user`, { userId })
    ).data;
  },
  async assignableUsers(
    id: string,
    filters: { search?: string; page?: number; limit?: number },
    signal?: AbortSignal,
  ) {
    return (
      await api.get<SchoolUserListResponse>(
        `/admin/schools/${id}/assignable-users`,
        { params: cleanParams(filters), signal },
      )
    ).data;
  },
  async export(filters: SchoolFilters, format: "csv" | "xlsx") {
    const response = await api.get<Blob>("/admin/schools/export", {
      params: { ...cleanParams(filters), format },
      responseType: "blob",
    });
    downloadBlob(response.data, `padron-colegios.${format}`);
  },
  async downloadTemplate() {
    const response = await api.get<Blob>("/admin/schools/import/template", {
      responseType: "blob",
    });
    downloadBlob(response.data, "plantilla-colegios.csv");
  },
  async preview(file: File) {
    const body = new FormData();
    body.append("file", file);
    return (
      await api.post<SchoolImportPreview>("/admin/schools/import/preview", body)
    ).data;
  },
  async import(file: File) {
    const body = new FormData();
    body.append("file", file);
    return (await api.post<SchoolImportResult>("/admin/schools/import", body))
      .data;
  },
};
