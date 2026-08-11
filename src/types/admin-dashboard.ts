import type { CampaignStatus, CampaignType } from "./admin-campaign";

export type ParticipationFilters = {
  campaignId?: string;
  departments?: string[];
  localities?: string[];
  schoolIds?: string[];
  educationLevels?: string[];
  educationTypes?: string[];
  managementTypes?: string[];
  scopes?: string[];
  shifts?: string[];
  submissionStatuses?: ParticipationSubmissionStatus[];
  stars?: ParticipationStar[];
  criticalAreas?: string[];
};

export type ParticipationSubmissionStatus =
  | "not_started"
  | "draft"
  | "submitted";

export type ParticipationStar = "1" | "2" | "3" | "4" | "5";

export type ParticipationCatalogOption = {
  value: string;
  label: string;
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
  /** Campo legado: conserva el tipo de educación para clientes anteriores. */
  educationLevels: string[];
  /** Niveles institucionales estructurados; `value` es el código de catálogo. */
  educationLevelOptions: ParticipationCatalogOption[];
  educationTypes: string[];
  managementTypes: string[];
  scopes: string[];
  shifts: string[];
  criticalAreas: ParticipationCatalogOption[];
  schools: Array<{ id: string; cue: string; name: string }>;
};

export type ResultsDashboardResponse = {
  campaign: ParticipationDashboardResponse["campaign"];
  denominators: { universeSchools: number; submittedSchools: number; schoolsWithCurrentResult: number; averages: number; starDistribution: number };
  metrics: { universeSchools: number; schoolsWithResult: number; coveragePercentage: number; generalAverage: number | null; dimensionAverages: Array<{ code: string; title: string; order: number; average: number | null; denominator: number }> };
  starDistribution: Array<{ stars: number; label: string; count: number; percentage: number; denominator: number }>;
  excludedResultsWithoutStars: number;
};

export type CriticalAlertsResponse = {
  summary: {
    schoolsCount: number;
    schoolsWithResult: number;
    schoolsPercentage: number;
    alertsCount: number;
    affectedDimensionCount: number;
    affectedDimensions: Array<{
      code: string;
      title: string;
      order: number;
      schoolsCount: number;
    }>;
  };
  items: Array<{
    school: {
      id: string;
      cue: string;
      name: string;
      department: string | null;
      locality: string | null;
    };
    generalScore: number | null;
    stars: number | null;
    dimensions: Array<{
      code: string;
      title: string;
      order: number;
      score: number | null;
      threshold: number | null;
    }>;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CampaignComparisonRadarReason =
  | "single_school_required"
  | "missing_result"
  | "different_survey_version"
  | "different_algorithm_version"
  | "unknown_calculation_metadata";

export type CampaignComparisonResponse = {
  baselineCampaignId: string;
  comparisonPolicy: {
    standardizedMetrics: Array<"generalScore" | "stars">;
    dimensionSeries: "visual_trajectory";
    cohortMode: "independent_campaign_universes";
    schoolProfileSource: "current";
    filterScope: "institutional_only";
    excludedOutcomeFilters: Array<
      "submissionStatuses" | "stars" | "criticalAreas"
    >;
    notice: string;
  };
  radarComparison: {
    available: boolean;
    comparable: boolean;
    mode: "comparable" | "descriptive" | "unavailable";
    reason: CampaignComparisonRadarReason | null;
    selectedSchoolId: string | null;
  };
  commonDimensions: Array<{
    code: string;
    title: string;
    order: number;
  }>;
  periods: CampaignComparisonPeriod[];
};

export type CampaignComparisonPeriod = {
  campaign: {
    id: string;
    name: string;
    status: CampaignStatus;
    type: CampaignType;
    isPartial: boolean;
    surveyVersionId: string;
    startsAt: string;
    endsAt: string;
  };
  calculationMetadata: {
    algorithmVersion: string | null;
    evaluationConfigurationVersion: string | null;
    calculatedAt: string | null;
    calculationSource:
      | "submission_finalization"
      | "single_recalculation"
      | "system"
      | null;
  };
  denominators: ResultsDashboardResponse["denominators"];
  metrics: ResultsDashboardResponse["metrics"];
  starDistribution: ResultsDashboardResponse["starDistribution"];
  excludedResultsWithoutStars: number;
};
