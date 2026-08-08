import { api } from "../lib/api";
import type {
  AdminCampaign,
  AdminCampaignListResponse,
  CampaignStatus,
  CampaignType,
  CampaignWriteInput,
  PublishedSurveyVersionOption,
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
};
