import { api } from "../lib/api";
import type { AdminSchoolResultDetail } from "../types/admin-school-result-detail";
import { downloadBlob } from "../lib/download";

export const adminSchoolResultDetailService = {
  async get(campaignId: string, schoolId: string, signal?: AbortSignal) {
    const { data } = await api.get<AdminSchoolResultDetail>(
      `/admin/campaigns/${campaignId}/schools/${schoolId}/result-detail`,
      { signal },
    );
    return data;
  },
  async downloadReport(campaignId: string, schoolId: string, cue: string) {
    const { data } = await api.get<Blob>(
      `/admin/campaigns/${campaignId}/schools/${schoolId}/report.pdf`,
      { responseType: "blob" },
    );
    downloadBlob(data, `reporte-${cue}.pdf`);
  },
};
