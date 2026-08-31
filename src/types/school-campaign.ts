import type { SchoolRectificationStatus } from "./admin-school";
import type { PublishedSurvey, QuestionnaireFormValues } from "./survey";

type SchoolSubmissionStatus = "draft" | "submitted";

type SchoolCampaignSummary = {
  id: string;
  name: string;
  description: string | null;
  type: "annual" | "semiannual";
  status: "draft" | "active" | "closed" | "archived";
  workflowCycle: string | null;
  sequenceOrder: number | null;
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

type SubmissionProgress = {
  answered: number;
  total: number;
  percentage: number;
  requiredAnswered?: number;
  requiredTotal?: number;
};

export type AvailableSchoolCampaign = SchoolCampaignSummary & {
  canStart: boolean;
  readOnly?: boolean;
  blockingReason: string | null;
  workflowStatus: "available" | "locked" | "completed";
  blockedBy: {
    id: string;
    name: string;
    sequenceOrder: number;
  } | null;
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
  rectification: Omit<SchoolRectificationStatus, "rectifiedBy">;
  items: AvailableSchoolCampaign[];
  /** Borradores de etapas finalizadas, disponibles únicamente para consulta. */
  expiredDrafts: AvailableSchoolCampaign[];
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
    canSubmit: boolean;
    blockingReason: string | null;
    progress: SubmissionProgress;
  };
  applicability: {
    status: "ready" | "incomplete";
    source: "evaluated" | "persisted" | "reconstructed";
    evaluatedAt: string;
    missingFields: Array<{
      code: string;
      label: string;
    }>;
    excluded: Array<{
      questionId: string;
      questionCode: string;
      appliedRuleId: string | null;
      reasonCode: string;
      reasonDescription: string;
    }>;
    incomplete: Array<{
      questionId: string;
      questionCode: string;
      reasonCode: "MISSING_SCHOOL_DATA";
      reasonDescription: string;
      missingFeatures: string[];
    }>;
  };
  answers: QuestionnaireFormValues;
  survey: PublishedSurvey;
};

export type SubmissionAnswerInput = {
  questionId: string;
  optionId?: string;
  value?: string | number | boolean | null;
};
