import { api } from "../lib/api";
import type {
  CampaignTrackingFilters,
  CampaignTrackingList,
  CampaignTrackingSummary,
} from "../types/admin-campaign-tracking";
import type { AdminCampaign } from "../types/admin-campaign";

export const adminCampaignTrackingService = {
  async campaigns() {
    return (
      await api.get<AdminCampaign[]>("/admin/campaigns/tracking/options")
    ).data;
  },

  async summary(campaignId: string, signal?: AbortSignal) {
    return (
      await api.get<CampaignTrackingSummary>(
        `/admin/campaigns/${campaignId}/tracking/summary`,
        { signal },
      )
    ).data;
  },

  async list(
    campaignId: string,
    filters: CampaignTrackingFilters,
    signal?: AbortSignal,
  ) {
    return (
      await api.get<CampaignTrackingList>(
        `/admin/campaigns/${campaignId}/tracking`,
        {
          params: filters,
          signal,
        },
      )
    ).data;
  },
};
