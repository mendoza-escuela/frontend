import type { PreliminaryResultDimension } from "./school-result";

export type HistoricalSchoolProfile = {
  schemaVersion?: number;
  sourceRectificationId?: string;
  capturedAt?: string;
  name: string;
  cue: string;
  schoolNumber?: string | null;
  directorName: string;
  department?: string;
  address: string;
  postalCode?: string | null;
  locality: string;
  managementType?: string;
  scope: string;
  educationLevel: string;
  shift: string;
  phone?: string | null;
  email?: string | null;
  hasKiosk?: boolean | null;
  hasFoodService?: boolean | null;
  isBoarding?: boolean | null;
  characteristics?: Record<string, string | number | boolean | null>;
  shiftCatalog?: { id: string; code: string; label: string } | null;
  educationLevels?: Array<{
    id: string;
    code: string;
    label: string;
    enrollment: number | null;
  }>;
  enrollmentTotal?: number | null;
  contacts?: Array<{
    type: "RESPONDENT" | "HEALTH_PROMOTION";
    firstName: string;
    lastName: string;
    position: string | null;
    phone: string | null;
    email: string | null;
  }>;
};

export type AdminSchoolResultDetail = {
  campaign: { id: string; name: string; type: string; status: string; startsAt: string; endsAt: string };
  school: { id: string; cue: string; name: string; schoolNumber: string | null; department: string; locality: string; managementType: string; scope: string; educationLevel: string; isActive: boolean };
  participationStatus: "not_started" | "draft" | "submitted";
  submission: null | {
    id: string; status: string; startedAt: string | null; lastSavedAt: string | null; submittedAt: string | null;
    originalRespondent: { id: string | null; firstName: string; lastName: string; email: string; isActive: boolean | null };
  };
  historicalSchoolProfile: HistoricalSchoolProfile | null;
  result: null | {
    id: string; generalScore: number | null; numerator: number | null; denominator: number | null;
    stars: { base: number | null; final: number | null; blockingReasons: string[]; configurationVersion: string | null };
    alerts: Array<Record<string, unknown>>;
    dimensions: PreliminaryResultDimension[];
    answers: AdminHistoricalAnswer[];
    excludedQuestions: AdminExcludedQuestion[];
    survey: null | { id: string; code: string; name: string; version: { id: string; number: number; title: string; publishedAt: string } };
    calculation: { calculatedAt: string; algorithmVersion: string; snapshotSchemaVersion: number; source: string; calculatedBy: null | { id: string; firstName: string; lastName: string } };
  };
  history: Array<{ type: string; label: string; at: string }>;
  dataQuality: { historicalProfileAvailable: boolean; resultSnapshotAvailable: boolean };
};

export type AdminHistoricalAnswer = {
  id: string; code: string; prompt: string; required: boolean; order: number; applicability: string;
  dimension: { code: string; title: string }; section: { code: string; title: string };
  answer: { value: unknown; optionLabel: string | null; scoreUsed: number | null };
};

export type AdminExcludedQuestion = Omit<AdminHistoricalAnswer, "answer" | "applicability"> & {
  exclusion: { reasonCode: string; reason: string; relevantSchoolFacts: Record<string, unknown>; rules: Array<Record<string, unknown>> };
};
