import type { PreliminaryResultDimension } from "./school-result";

export type AdminSchoolResultDetail = {
  campaign: { id: string; name: string; type: string; status: string; startsAt: string; endsAt: string };
  school: { id: string; cue: string; name: string; schoolNumber: string | null; department: string; locality: string; managementType: string; scope: string; educationLevel: string; isActive: boolean };
  participationStatus: "not_started" | "draft" | "submitted";
  submission: null | {
    id: string; status: string; startedAt: string | null; lastSavedAt: string | null; submittedAt: string | null;
    originalRespondent: { id: string | null; firstName: string; lastName: string; email: string; isActive: boolean | null };
  };
  historicalSchoolProfile: Record<string, unknown> | null;
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
