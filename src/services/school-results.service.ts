import { api } from "../lib/api";
import type {
  SchoolPreliminaryResult,
  SchoolPreliminaryResultList,
} from "../types/school-result";

export const schoolResultsService = {
  async list() {
    return (await api.get<SchoolPreliminaryResultList>("/school/results")).data;
  },

  async getByCampaign(campaignId: string) {
    return (
      await api.get<SchoolPreliminaryResult>(
        `/school/campaigns/${campaignId}/submission/result`,
      )
    ).data;
  },
};
