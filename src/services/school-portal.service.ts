import { api } from "../lib/api";
import type {
  SchoolProfile,
  SchoolRectificationInput,
} from "../types/admin-school";

export const schoolPortalService = {
  async ownSchool() {
    return (await api.get<SchoolProfile>("/schools/me")).data;
  },
  async rectify(input: SchoolRectificationInput) {
    return (await api.put<SchoolProfile>("/schools/me/rectification", input))
      .data;
  },
};
