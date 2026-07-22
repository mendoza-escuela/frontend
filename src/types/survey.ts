export type SurveyQuestionType =
  | "single_choice"
  | "multiple_choice"
  | "boolean"
  | "short_text"
  | "long_text"
  | "number"
  | "date";

export type SurveyQuestionValidation = {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  maxSelections?: number;
  placeholder?: string;
};

export type SurveyOption = {
  id: string;
  value: string;
  label: string;
  helpText: string | null;
  order: number;
};

export type SurveyQuestion = {
  id: string;
  code: string;
  type: SurveyQuestionType;
  prompt: string;
  helpText: string | null;
  required: boolean;
  order: number;
  validation: SurveyQuestionValidation;
  options: SurveyOption[];
};

export type SurveySection = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  order: number;
  questions: SurveyQuestion[];
};

export type SurveyDimension = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  order: number;
  sections: SurveySection[];
};

export type AvailableSurvey = {
  code: string;
  name: string;
  description: string | null;
  versionNumber: number;
  versionTitle: string;
  publishedAt: string;
};

export type PublishedSurvey = {
  code: string;
  name: string;
  description: string | null;
  version: {
    id: string;
    versionNumber: number;
    title: string;
    instructions: string | null;
    publishedAt: string;
    dimensions: SurveyDimension[];
  };
};

export type QuestionnaireFormValues = Record<
  string,
  string | string[] | number | undefined
>;
