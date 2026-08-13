import { api } from "../lib/api";
import { downloadBlob } from "../lib/download";
import type {
  AdminSurveyDetail,
  AdminSurveyListResponse,
  AdminSurveyVersion,
  SurveyVersionComparison,
  SurveyVersionTemplate,
  SurveyImportPreview,
  SurveyStructureValidation,
  SurveyVersionWriteInput,
  SurveyWriteInput,
  ApplicabilityDecision,
  ApplicabilityMetadata,
  ApplicabilityRule,
} from "../types/admin-survey";

export const adminSurveysService = {
  async list(
    filters: { search?: string; page?: number; limit?: number },
    signal?: AbortSignal,
  ) {
    return (
      await api.get<AdminSurveyListResponse>("/admin/surveys", {
        params: filters,
        signal,
      })
    ).data;
  },

  async findOne(surveyId: string) {
    return (await api.get<AdminSurveyDetail>(`/admin/surveys/${surveyId}`))
      .data;
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
      template?: SurveyVersionTemplate;
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

  async archiveVersion(surveyId: string, versionId: string) {
    return (
      await api.post<AdminSurveyVersion>(
        `/admin/surveys/${surveyId}/versions/${versionId}/archive`,
      )
    ).data;
  },

  async applicabilityMetadata() {
    return (
      await api.get<ApplicabilityMetadata>(
        "/admin/surveys/templates/applicability-metadata",
      )
    ).data;
  },

  async listApplicabilityRules(
    surveyId: string,
    versionId: string,
    questionId?: string,
  ) {
    return (
      await api.get<ApplicabilityRule[]>(
        `/admin/surveys/${surveyId}/versions/${versionId}/applicability-rules`,
        { params: { questionId } },
      )
    ).data;
  },

  async createApplicabilityRule(
    surveyId: string,
    versionId: string,
    questionId: string,
    input: Omit<ApplicabilityRule, "id" | "questionId" | "question">,
  ) {
    return (
      await api.post<ApplicabilityRule>(
        `/admin/surveys/${surveyId}/versions/${versionId}/questions/${questionId}/applicability-rules`,
        input,
      )
    ).data;
  },

  async createApplicabilityRuleBulk(
    surveyId: string,
    versionId: string,
    questionIds: string[],
    input: Omit<ApplicabilityRule, "id" | "questionId" | "question">,
  ) {
    return (
      await api.post<ApplicabilityRule[]>(
        `/admin/surveys/${surveyId}/versions/${versionId}/applicability-rules/bulk`,
        { questionIds, rule: input },
      )
    ).data;
  },

  async updateApplicabilityRule(
    surveyId: string,
    versionId: string,
    questionId: string,
    ruleId: string,
    input: Omit<ApplicabilityRule, "id" | "questionId" | "question">,
  ) {
    return (
      await api.put<ApplicabilityRule>(
        `/admin/surveys/${surveyId}/versions/${versionId}/questions/${questionId}/applicability-rules/${ruleId}`,
        input,
      )
    ).data;
  },

  async removeApplicabilityRule(
    surveyId: string,
    versionId: string,
    questionId: string,
    ruleId: string,
  ) {
    await api.delete(
      `/admin/surveys/${surveyId}/versions/${versionId}/questions/${questionId}/applicability-rules/${ruleId}`,
    );
  },

  async reorderApplicabilityRules(
    surveyId: string,
    versionId: string,
    questionId: string,
    ruleIds: string[],
  ) {
    return (
      await api.put<ApplicabilityRule[]>(
        `/admin/surveys/${surveyId}/versions/${versionId}/questions/${questionId}/applicability-rules-order`,
        { ruleIds },
      )
    ).data;
  },

  async previewApplicability(
    surveyId: string,
    versionId: string,
    questionId: string,
    schoolId: string,
  ) {
    return (
      await api.post<ApplicabilityDecision>(
        `/admin/surveys/${surveyId}/versions/${versionId}/questions/${questionId}/applicability-preview`,
        { schoolId },
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

  async compare(surveyId: string, fromVersionId: string, toVersionId: string) {
    return (
      await api.get<SurveyVersionComparison>(
        `/admin/surveys/${surveyId}/versions/compare`,
        { params: { fromVersionId, toVersionId } },
      )
    ).data;
  },

  async downloadImportTemplate(format: "csv" | "xlsx") {
    const response = await api.get<Blob>("/admin/surveys/import/template", {
      params: { format },
      responseType: "blob",
    });
    downloadBlob(response.data, `plantilla-cuestionario.${format}`);
  },

  async previewImport(surveyId: string, file: File) {
    const body = new FormData();
    body.append("file", file);
    return (
      await api.post<SurveyImportPreview>(
        `/admin/surveys/${surveyId}/import/preview`,
        body,
      )
    ).data;
  },

  async importVersion(
    surveyId: string,
    file: File,
    input: { title: string; instructions?: string | null },
  ) {
    const body = new FormData();
    body.append("file", file);
    body.append("title", input.title);
    if (input.instructions) body.append("instructions", input.instructions);
    return (
      await api.post<AdminSurveyVersion>(
        `/admin/surveys/${surveyId}/import`,
        body,
      )
    ).data;
  },
};
