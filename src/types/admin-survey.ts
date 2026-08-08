import type {
  SurveyDimension,
  SurveyQuestionType,
  SurveyQuestionValidation,
} from "./survey";

export type SurveyVersionStatus = "draft" | "published" | "archived";
export type SurveyVersionTemplate = "blank" | "official_dimensions";

export type SurveyVersionSummary = {
  id: string;
  versionNumber: number;
  title: string;
  status: SurveyVersionStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  counts?: {
    dimensions: number;
    sections: number;
    questions: number;
    options: number;
  };
};

export type AdminSurveyListItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  versions: SurveyVersionSummary[];
};

export type AdminSurveyListResponse = {
  items: AdminSurveyListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type AdminSurveyDetail = AdminSurveyListItem & {
  audits: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    changes: Record<string, unknown>;
    createdAt: string;
    actor: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  }>;
};

export type AdminSurveyVersion = {
  id: string;
  surveyId: string;
  versionNumber: number;
  title: string;
  instructions: string | null;
  status: SurveyVersionStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  profile: "institutional" | "generic";
  dimensions: SurveyDimension[];
};

export type SurveyWriteInput = {
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
};

export type SurveyOptionWriteInput = {
  value: string;
  label: string;
  helpText?: string | null;
  score?: number | null;
};

export type SurveyQuestionWriteInput = {
  code: string;
  type: SurveyQuestionType;
  prompt: string;
  helpText?: string | null;
  required: boolean;
  validation?: SurveyQuestionValidation;
  options: SurveyOptionWriteInput[];
};

export type SurveySectionWriteInput = {
  code: string;
  title: string;
  description?: string | null;
  questions: SurveyQuestionWriteInput[];
};

export type SurveyDimensionWriteInput = {
  code: string;
  title: string;
  description?: string | null;
  sections: SurveySectionWriteInput[];
};

export type SurveyVersionWriteInput = {
  title: string;
  instructions?: string | null;
  dimensions: SurveyDimensionWriteInput[];
};

export type SurveyStructureValidation = {
  valid: boolean;
  errors: string[];
  counts: {
    dimensions: number;
    sections: number;
    questions: number;
    options: number;
  };
};

export type SurveyVersionComparison = {
  fromVersion: Pick<
    SurveyVersionSummary,
    "id" | "versionNumber" | "title" | "status"
  >;
  toVersion: Pick<
    SurveyVersionSummary,
    "id" | "versionNumber" | "title" | "status"
  >;
  summary: {
    added: number;
    removed: number;
    modified: number;
    total: number;
  };
  changes: Array<{
    type: "added" | "removed" | "modified";
    entityType: "version" | "dimension" | "section" | "question" | "option";
    path: string;
    label: string;
    changedFields: string[];
  }>;
};

export type SurveyImportPreview = {
  totalRows: number;
  validCount: number;
  errorCount: number;
  canImport: boolean;
  counts: {
    dimensions: number;
    sections: number;
    questions: number;
    options: number;
  };
  detectedDimensions: Array<{ code: string; title: string }>;
  detectedSections: Array<{ code: string; title: string }>;
  groupedQuestions: Array<{
    code: string;
    prompt: string;
    options: Array<{ label: string; score: number | null }>;
  }>;
  warnings: string[];
  summary: string;
  rows: Array<{
    line: number;
    dimensionCode: string;
    sectionCode: string;
    questionCode: string;
    question: string;
    optionCode: string;
    option: string;
    score: number | null;
    required: boolean | null;
    order: number | null;
    errors: string[];
    issues: Array<{
      field: string;
      receivedValue: string | null;
      reason: string;
    }>;
  }>;
};

export type ApplicabilityAction = "show" | "omit";
export type ApplicabilityRule = {
  id: string;
  questionId: string;
  groupOperator: "all" | "any";
  action: ApplicabilityAction;
  defaultAction: ApplicabilityAction;
  order: number;
  question?: { id: string; code: string; prompt: string };
  conditions: Array<{
    id?: string;
    feature: string;
    operator: string;
    expectedValue: string | number | boolean | string[];
    order: number;
  }>;
};
export type ApplicabilityMetadata = {
  features: Array<{
    key: string;
    label: string;
    type: "boolean" | "string" | "string_array" | "number";
    operators: string[];
    allowedValues?: Array<{ value: string | boolean; label: string }>;
  }>;
  operators: Array<{ key: string; label: string }>;
  resolution: string;
};
export type ApplicabilityDecision = {
  status: "applicable" | "excluded" | "incomplete";
  applicable: boolean | null;
  action: ApplicabilityAction | null;
  matchedRuleId: string | null;
  explanation: string;
  missingFeatures: string[];
};
