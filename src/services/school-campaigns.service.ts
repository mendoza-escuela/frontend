import { api } from "../lib/api";
import type {
  AvailableSchoolCampaignsResponse,
  SchoolSubmissionWorkspace,
  SubmissionAnswerInput,
} from "../types/school-campaign";

export const schoolCampaignsService = {
  async list() {
    return (
      await api.get<AvailableSchoolCampaignsResponse>("/school/campaigns")
    ).data;
  },

  async start(campaignId: string) {
    return (
      await api.post<SchoolSubmissionWorkspace>(
        `/school/campaigns/${campaignId}/submission`,
      )
    ).data;
  },

  async workspace(campaignId: string) {
    return (
      await api.get<SchoolSubmissionWorkspace>(
        `/school/campaigns/${campaignId}/submission`,
      )
    ).data;
  },

  async saveDraft(
    campaignId: string,
    answers: SubmissionAnswerInput[],
    expectedRevision: number,
  ) {
    return (
      await api.put<SchoolSubmissionWorkspace>(
        `/school/campaigns/${campaignId}/submission/draft`,
        { answers, expectedRevision },
      )
    ).data;
  },

  async submit(campaignId: string, expectedRevision: number) {
    return (
      await api.post<SchoolSubmissionWorkspace>(
        `/school/campaigns/${campaignId}/submission/submit`,
        { expectedRevision },
      )
    ).data;
  },
};
