import { api } from "../lib/api";
import type { EvaluationConfiguration, EvaluationConfigurationInput } from "../types/evaluation-configuration";
const root = "/admin/evaluation-configurations";
export const evaluationConfigurationsService = {
  list: async () => (await api.get<EvaluationConfiguration[]>(root)).data,
  create: async (input: EvaluationConfigurationInput) => (await api.post<EvaluationConfiguration>(root, input)).data,
  update: async (id: string, input: EvaluationConfigurationInput) => (await api.patch<EvaluationConfiguration>(`${root}/${id}`, input)).data,
  clone: async (id: string, versionCode: string) => (await api.post<EvaluationConfiguration>(`${root}/${id}/clone`, { versionCode })).data,
  validate: async (id: string) => (await api.post<{ valid: boolean }>(`${root}/${id}/validate`)).data,
  activate: async (id: string) => (await api.post<EvaluationConfiguration>(`${root}/${id}/activate`)).data,
  archive: async (id: string) => (await api.post<EvaluationConfiguration>(`${root}/${id}/archive`)).data,
};
