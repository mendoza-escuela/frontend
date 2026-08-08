import type { Pagination } from "../components/ui/PaginationControls";

export type CampaignType = "annual" | "semiannual";
export type CampaignStatus = "draft" | "active" | "closed" | "archived";

export type PublishedSurveyVersionOption = {
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
};
