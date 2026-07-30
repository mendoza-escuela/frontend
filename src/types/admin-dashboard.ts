import type { CampaignStatus } from "./admin-campaign";

export type ParticipationFilters = {
  campaignId?: string;
  department?: string;
  locality?: string;
  schoolId?: string;
  educationLevel?: string;
  managementType?: string;
  scope?: string;
  shift?: string;
};

export type ParticipationDashboardResponse = {
  campaign: {
    id: string;
    name: string;
    status: CampaignStatus;
    startsAt: string;
    endsAt: string;
  };
  metrics: {
    totalSchools: number;
    notStarted: number;
    draft: number;
    submitted: number;
    participationPercentage: number;
  };
};

export type ParticipationFilterOptions = {
  campaigns: Array<{
    id: string;
    name: string;
    status: CampaignStatus;
    startsAt: string;
    endsAt: string;
  }>;
  defaultCampaignId: string | null;
  departments: string[];
  localities: string[];
  educationLevels: string[];
  managementTypes: string[];
  scopes: string[];
  shifts: string[];
  schools: Array<{ id: string; cue: string; name: string }>;
};
