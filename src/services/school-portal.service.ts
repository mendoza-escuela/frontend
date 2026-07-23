import { api } from "../lib/api";
import type { School } from "../types/admin-school";

export const schoolPortalService = {
  async ownSchool() {
    return (await api.get<School>("/schools/me")).data;
  },
};
