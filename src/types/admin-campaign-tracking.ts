import type { Pagination } from "../components/ui/PaginationControls";
import type {
  CampaignStatus,
  CampaignType,
} from "./admin-campaign";

export type CampaignParticipationStatus =
  | "not_started"
  | "draft"
  | "submitted";

export type CampaignTrackingSort =
  | "school"
  | "status"
  | "last_saved_at"
  | "submitted_at";

export type CampaignTrackingSummary = {
  campaign: {
    id: string;
    name: string;
    type: CampaignType;
    status: CampaignStatus;
    startsAt: string;
    endsAt: string;
    inclusionCutoff: string;
  };
  totalSchools: number;
  submittedPercentage: number;
  states: Record<
    CampaignParticipationStatus,
    {
      count: number;
      percentage: number;
    }
  >;
};

export type CampaignTrackingSchool = {
  school: {
    id: string;
    cue: string;
    name: string;
    isActive: boolean;
  };
  status: CampaignParticipationStatus;
  progress: {
    answered: number;
    applicable: number;
    percentage: number;
  };
  submission: {
    id: string;
    startedAt: string;
    lastSavedAt: string | null;
    submittedAt: string | null;
  } | null;
  originalRespondent: {
    id: string | null;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean | null;
    historicalDataComplete: boolean;
  } | null;
  historicalDataComplete: boolean;
};

export type CampaignTrackingList = {
  items: CampaignTrackingSchool[];
  pagination: Pagination;
};

export type CampaignTrackingFilters = {
  search?: string;
  status?: CampaignParticipationStatus;
  sortBy?: CampaignTrackingSort;
  sortDirection?: "asc" | "desc";
  page?: number;
  limit?: number;
};
