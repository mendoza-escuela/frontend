import { api } from "../lib/api";
import type {
  ParticipationDashboardResponse,
  ParticipationFilterOptions,
  ParticipationFilters,
  ResultsDashboardResponse,
} from "../types/admin-dashboard";

const cleanParams = (filters: ParticipationFilters) =>
  Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== "" && value),
  );

export const adminDashboardService = {
  async participation(filters: ParticipationFilters, signal?: AbortSignal) {
    return (
      await api.get<ParticipationDashboardResponse>(
        "/admin/dashboard/participation",
        { params: cleanParams(filters), signal },
      )
    ).data;
  },

  async filterOptions(
    filters: Pick<ParticipationFilters, "department" | "locality">,
    signal?: AbortSignal,
  ) {
    return (
      await api.get<ParticipationFilterOptions>(
        "/admin/dashboard/participation/filters",
        { params: cleanParams(filters), signal },
      )
    ).data;
  },
  async results(filters: ParticipationFilters, signal?: AbortSignal) {
    return (await api.get<ResultsDashboardResponse>("/admin/dashboard/results", { params: cleanParams(filters), signal })).data;
  },
};
