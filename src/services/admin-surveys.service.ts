import { api } from "../lib/api";
import type {
  AdminSurveyDetail,
  AdminSurveyListItem,
  AdminSurveyVersion,
  SurveyVersionComparison,
  SurveyStructureValidation,
  SurveyVersionWriteInput,
  SurveyWriteInput,
} from "../types/admin-survey";

export const adminSurveysService = {
  async list() {
    return (await api.get<AdminSurveyListItem[]>("/admin/surveys")).data;
  },

  async findOne(surveyId: string) {
    return (
      await api.get<AdminSurveyDetail>(`/admin/surveys/${surveyId}`)
    ).data;
  },

  async create(input: SurveyWriteInput) {
    return (await api.post<AdminSurveyDetail>("/admin/surveys", input)).data;
  },

  async update(surveyId: string, input: Partial<SurveyWriteInput>) {
    return (
      await api.patch<AdminSurveyDetail>(`/admin/surveys/${surveyId}`, input)
    ).data;
  },

  async remove(surveyId: string) {
    await api.delete(`/admin/surveys/${surveyId}`);
  },

  async findVersion(surveyId: string, versionId: string) {
    return (
      await api.get<AdminSurveyVersion>(
        `/admin/surveys/${surveyId}/versions/${versionId}`,
      )
    ).data;
  },

  async createVersion(
    surveyId: string,
    input: {
      title: string;
      instructions?: string | null;
      sourceVersionId?: string;
    },
  ) {
    return (
      await api.post<AdminSurveyVersion>(
        `/admin/surveys/${surveyId}/versions`,
        input,
      )
    ).data;
  },

  async updateVersion(
    surveyId: string,
    versionId: string,
    input: SurveyVersionWriteInput,
  ) {
    return (
      await api.put<AdminSurveyVersion>(
        `/admin/surveys/${surveyId}/versions/${versionId}`,
        input,
      )
    ).data;
  },

  async publishVersion(surveyId: string, versionId: string) {
    return (
      await api.post<AdminSurveyVersion>(
        `/admin/surveys/${surveyId}/versions/${versionId}/publish`,
      )
    ).data;
  },

  async validateVersion(surveyId: string, versionId: string) {
    return (
      await api.get<SurveyStructureValidation>(
        `/admin/surveys/${surveyId}/versions/${versionId}/validation`,
      )
    ).data;
  },

  async removeVersion(surveyId: string, versionId: string) {
    await api.delete(`/admin/surveys/${surveyId}/versions/${versionId}`);
  },

  async compare(
    surveyId: string,
    fromVersionId: string,
    toVersionId: string,
  ) {
    return (
      await api.get<SurveyVersionComparison>(
        `/admin/surveys/${surveyId}/versions/compare`,
        { params: { fromVersionId, toVersionId } },
      )
    ).data;
  },
};
