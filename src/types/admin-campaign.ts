import type { Pagination } from "../components/ui/PaginationControls";

export type CampaignType = "annual" | "semiannual";
export type CampaignStatus = "draft" | "active" | "closed" | "archived";

/** Versión publicada que el backend habilita para crear o editar una etapa. */
export type CampaignSurveyVersionOption = {
  id: string;
  surveyId: string;
  surveyCode: string;
  surveyName: string;
  versionNumber: number;
  versionTitle: string;
  publishedAt: string;
};

export type AdminCampaign = {
  id: string;
  name: string;
  description: string | null;
  type: CampaignType;
  status: CampaignStatus;
  workflowCycle: string | null;
  sequenceOrder: number | null;
  startDate: string;
  endDate: string;
  startsAt: string;
  endsAt: string;
  activatedAt: string | null;
  closedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  surveyVersion: {
    id: string;
    versionNumber: number;
    title: string;
    publishedAt: string;
    survey: {
      id: string;
      code: string;
      name: string;
    };
  };
};

export type AdminCampaignListResponse = {
  items: AdminCampaign[];
  pagination: Pagination;
};

export type CampaignWriteInput = {
  name: string;
  description?: string | null;
  type: CampaignType;
  surveyVersionId: string;
  startDate: string;
  endDate: string;
  workflowCycle?: string | null;
  sequenceOrder?: number | null;
};

export type CampaignWorkflowOption = {
  name: string;
  lastSequenceOrder: number;
};

type CampaignSchoolAssignmentSource = "manual" | "filter" | "bulk";

export type CampaignSchoolFilters = {
  search?: string;
  department?: string;
  locality?: string;
  educationLevel?: string;
  managementType?: string;
  scope?: string;
  shift?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
};

type CampaignSchoolOption = {
  id: string;
  cue: string;
  name: string;
  department: string;
  locality: string;
  isActive: boolean;
  assigned: boolean;
};

export type CampaignSchoolAssignment = {
  id: string;
  assignedAt: string;
  assignmentSource: CampaignSchoolAssignmentSource;
  school: Omit<CampaignSchoolOption, "assigned"> & {
    educationLevel: string;
    managementType: string;
    scope: string;
    shift: string;
  };
};

export type CampaignSchoolsResponse<T> = {
  items: T[];
  pagination: Pagination;
};

export type CampaignSchoolOptionsResponse = CampaignSchoolsResponse<CampaignSchoolOption> & {
  summary: {
    matched: number;
    assigned: number;
    unassigned: number;
  };
};

export type CampaignSchoolSelection = CampaignSchoolFilters & {
  source: CampaignSchoolAssignmentSource;
  schoolIds?: string[];
};

export type CampaignSchoolPreview = {
  matched: number;
  alreadyAssigned: number;
  willAssign: number;
  message: string;
};

export type CampaignSchoolAssignmentResult = {
  matched: number;
  assigned: number;
  summary: {
    assigned: number;
    removed: number;
  };
};
