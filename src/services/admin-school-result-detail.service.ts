import { api } from "../lib/api";
import type { AdminSchoolResultDetail } from "../types/admin-school-result-detail";

export const adminSchoolResultDetailService = {
  async get(campaignId: string, schoolId: string, signal?: AbortSignal) {
    const { data } = await api.get<AdminSchoolResultDetail>(
      `/admin/campaigns/${campaignId}/schools/${schoolId}/result-detail`,
      { signal },
    );
    return data;
  },
};
