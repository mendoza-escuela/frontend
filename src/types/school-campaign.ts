import type { PublishedSurvey, QuestionnaireFormValues } from "./survey";

export type SchoolSubmissionStatus = "draft" | "submitted";

export type SchoolCampaignSummary = {
  id: string;
  name: string;
  description: string | null;
  type: "annual" | "semiannual";
  status: "active";
  startsAt: string;
  endsAt: string;
  surveyVersion: {
    id: string;
    versionNumber: number;
    title: string;
    survey: {
      code: string;
      name: string;
    };
  };
};

export type SubmissionProgress = {
  answered: number;
  total: number;
  percentage: number;
  requiredAnswered?: number;
  requiredTotal?: number;
};

export type AvailableSchoolCampaign = SchoolCampaignSummary & {
  canStart: boolean;
  blockingReason: string | null;
  submission: {
    id: string;
    status: SchoolSubmissionStatus;
    startedAt: string;
    lastSavedAt: string | null;
    submittedAt: string | null;
    progress: SubmissionProgress;
  } | null;
};

export type AvailableSchoolCampaignsResponse = {
  school: {
    id: string;
    cue: string;
    name: string;
    isActive: boolean;
  };
  rectification: {
    periodYear: number;
    isRectified: boolean;
    rectifiedAt: string | null;
  };
  items: AvailableSchoolCampaign[];
};

export type SchoolSubmissionWorkspace = {
  campaign: SchoolCampaignSummary;
  submission: {
    id: string;
    status: SchoolSubmissionStatus;
    startedAt: string;
    lastSavedAt: string | null;
    submittedAt: string | null;
    originalRespondent: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    editable: boolean;
    blockingReason: string | null;
    progress: SubmissionProgress;
  };
  answers: QuestionnaireFormValues;
  survey: PublishedSurvey;
};

export type SubmissionAnswerInput = {
  questionId: string;
  optionId?: string;
  value?: string | number | boolean | null;
};
