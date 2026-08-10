import { api } from "../lib/api";
import type {
  AdminCampaign,
  AdminCampaignListResponse,
  CampaignStatus,
  CampaignType,
  CampaignWriteInput,
  PublishedSurveyVersionOption,
  CampaignSchoolAssignment,
  CampaignSchoolFilters,
  CampaignSchoolOptionsResponse,
  CampaignSchoolPreview,
  CampaignSchoolSelection,
  CampaignSchoolsResponse,
} from "../types/admin-campaign";

export const adminCampaignsService = {
  async list(
    filters: {
      search?: string;
      status?: CampaignStatus;
      type?: CampaignType;
      page?: number;
      limit?: number;
    },
    signal?: AbortSignal,
  ) {
    return (
      await api.get<AdminCampaignListResponse>("/admin/campaigns", {
        params: filters,
        signal,
      })
    ).data;
  },

  async findOne(id: string) {
    return (await api.get<AdminCampaign>(`/admin/campaigns/${id}`)).data;
  },

  async publishedVersions() {
    return (
      await api.get<PublishedSurveyVersionOption[]>(
        "/admin/campaigns/survey-versions",
      )
    ).data;
  },

  async create(input: CampaignWriteInput) {
    return (await api.post<AdminCampaign>("/admin/campaigns", input)).data;
  },

  async update(id: string, input: CampaignWriteInput) {
    return (await api.patch<AdminCampaign>(`/admin/campaigns/${id}`, input))
      .data;
  },

  async setStatus(id: string, status: CampaignStatus) {
    return (
      await api.patch<AdminCampaign>(`/admin/campaigns/${id}/status`, {
        status,
      })
    ).data;
  },

  async remove(id: string) {
    await api.delete(`/admin/campaigns/${id}`);
  },

  async assignedSchools(id: string, filters: CampaignSchoolFilters) {
    return (
      await api.get<CampaignSchoolsResponse<CampaignSchoolAssignment>>(
        `/admin/campaigns/${id}/schools`,
        { params: filters },
      )
    ).data;
  },

  async schoolOptions(id: string, filters: CampaignSchoolFilters) {
    return (
      await api.get<CampaignSchoolOptionsResponse>(
        `/admin/campaigns/${id}/schools/options`,
        { params: filters },
      )
    ).data;
  },

  async previewSchools(id: string, selection: CampaignSchoolSelection) {
    return (
      await api.post<CampaignSchoolPreview>(
        `/admin/campaigns/${id}/schools/preview`,
        selection,
      )
    ).data;
  },

  async assignSchools(id: string, selection: CampaignSchoolSelection) {
    return (
      await api.post(`/admin/campaigns/${id}/schools/assign`, selection)
    ).data;
  },

  async removeSchool(id: string, schoolId: string, reason?: string) {
    return (
      await api.delete(`/admin/campaigns/${id}/schools/${schoolId}`, {
        data: { reason },
      })
    ).data;
  },
};
