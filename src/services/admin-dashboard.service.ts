import { api } from "../lib/api";
import type {
  CampaignComparisonResponse,
  ParticipationDashboardResponse,
  ParticipationFilterOptions,
  ParticipationFilters,
  ResultsDashboardResponse,
  CriticalAlertsResponse,
} from "../types/admin-dashboard";
import { downloadBlob } from "../lib/download";

const queryParams = (filters: ParticipationFilters) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (Array.isArray(value))
      value.filter(Boolean).forEach((entry) => params.append(key, entry));
    else if (value) params.set(key, value);
  }
  return params;
};

export const adminDashboardService = {
  async participation(filters: ParticipationFilters, signal?: AbortSignal) {
    return (
      await api.get<ParticipationDashboardResponse>(
        "/admin/dashboard/participation",
        { params: queryParams(filters), signal },
      )
    ).data;
  },

  async filterOptions(
    filters: Pick<
      ParticipationFilters,
      "campaignId" | "departments" | "localities"
    >,
    signal?: AbortSignal,
  ) {
    // Este endpoint sólo admite los filtros que acotan sus catálogos
    // dependientes. La selección explícita evita serializar propiedades extra
    // si un caller pasa una variable con un tipo estructural más amplio.
    const params = queryParams({
      campaignId: filters.campaignId,
      departments: filters.departments,
      localities: filters.localities,
    });
    const response = (
      await api.get<ParticipationFilterOptions>(
        "/admin/dashboard/participation/filters",
        { params, signal },
      )
    ).data;
    return {
      ...response,
      educationLevelOptions: response.educationLevelOptions ?? [],
      educationTypes: response.educationTypes ?? response.educationLevels ?? [],
      criticalAreas: response.criticalAreas ?? [],
    };
  },
  async results(filters: ParticipationFilters, signal?: AbortSignal) {
    return (
      await api.get<ResultsDashboardResponse>("/admin/dashboard/results", {
        params: queryParams(filters),
        signal,
      })
    ).data;
  },
  async criticalAlerts(
    filters: ParticipationFilters,
    dimensionCode?: string,
    page = 1,
    signal?: AbortSignal,
  ) {
    const params = queryParams(filters);
    if (dimensionCode) params.set("dimensionCode", dimensionCode);
    params.set("page", String(page));
    return (
      await api.get<CriticalAlertsResponse>(
        "/admin/dashboard/results/critical-alerts",
        {
          params,
          signal,
        },
      )
    ).data;
  },
  async comparison(
    campaignIds: readonly string[],
    filters: ParticipationFilters,
    signal?: AbortSignal,
  ) {
    const params = queryParams(filters);
    [
      "campaignId",
      "submissionStatuses",
      "stars",
      "criticalAreas",
    ].forEach((key) => params.delete(key));
    campaignIds.forEach((campaignId) =>
      params.append("campaignIds", campaignId),
    );
    return (
      await api.get<CampaignComparisonResponse>(
        "/admin/dashboard/results/comparison",
        { params, signal },
      )
    ).data;
  },
  async export(
    kind: "results" | "answers",
    format: "csv" | "xlsx",
    filters: ParticipationFilters,
  ) {
    const params = queryParams(filters);
    params.set("format", format);
    const response = await api.get<Blob>(`/admin/exports/${kind}`, {
      params,
      responseType: "blob",
    });
    downloadBlob(
      response.data,
      `${kind === "results" ? "resultados" : "respuestas"}.${format}`,
    );
  },
};
