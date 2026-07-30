import { api } from "../lib/api";
import type {
  SchoolProfile,
  SchoolRectificationCatalogs,
  SchoolRectificationInput,
} from "../types/admin-school";

export const schoolPortalService = {
  async ownSchool() {
    return (await api.get<SchoolProfile>("/schools/me")).data;
  },
  async rectificationCatalogs() {
    return (
      await api.get<SchoolRectificationCatalogs>(
        "/schools/me/rectification/catalogs",
      )
    ).data;
  },
  async rectify(input: SchoolRectificationInput) {
    return (await api.put<SchoolProfile>("/schools/me/rectification", input))
      .data;
  },
};
