import { api } from "../lib/api";
import type {
  SchoolPreliminaryResult,
  SchoolPreliminaryResultList,
  SchoolStarDistribution,
} from "../types/school-result";
import { downloadBlob, downloadFilename } from "../lib/download";

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

  async starDistribution(campaignId: string) {
    return (
      await api.get<SchoolStarDistribution>(
        `/school/campaigns/${campaignId}/star-distribution`,
      )
    ).data;
  },

  async downloadReport(campaignId: string, cue: string) {
    const response = await api.get<Blob>(
      `/school/campaigns/${campaignId}/submission/report.pdf`,
      { responseType: "blob" },
    );
    downloadBlob(response.data, `reporte-${cue}.pdf`);
  },

  async downloadReceipt(campaignId: string, cue: string) {
    const response = await api.get<Blob>(
      `/school/campaigns/${campaignId}/submission/receipt.pdf`,
      { responseType: "blob" },
    );
    downloadBlob(response.data, `comprobante-${cue}.pdf`);
  },

  async downloadExcel(campaignId: string, cue: string) {
    const response = await api.get<Blob>(
      `/school/campaigns/${campaignId}/submission/report.xlsx`,
      { responseType: "blob" },
    );
    const headerValue = response.headers["content-disposition"];
    const filename = downloadFilename(
      typeof headerValue === "string" ? headerValue : null,
      `reporte-${cue}.xlsx`,
    );
    downloadBlob(response.data, filename);
  },
};
