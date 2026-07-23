import { api } from "../lib/api";
import type { AvailableSurvey, PublishedSurvey } from "../types/survey";

export const surveysService = {
  async listAvailable() {
    return (await api.get<AvailableSurvey[]>("/surveys/available")).data;
  },

  async findAvailable(code: string) {
    return (
      await api.get<PublishedSurvey>(
        `/surveys/available/${encodeURIComponent(code)}`,
      )
    ).data;
  },
};
