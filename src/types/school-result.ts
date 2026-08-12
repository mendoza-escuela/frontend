export type PreliminaryResultDimension = {
  id: string | null;
  code: string;
  title: string;
  order: number;
  score: number | null;
  available: boolean;
  isCritical: boolean;
  criticalValue: number | null;
  criticalThreshold: number | null;
};

export type PreliminaryResultQuestion = {
  id: string;
  code: string;
  prompt: string;
  order: number;
  dimension: {
    id: string;
    code: string;
    title: string;
    order: number;
  };
  section: {
    id: string;
    code: string;
    title: string;
    order: number;
  };
};

export type PreliminaryResultAnswer = PreliminaryResultQuestion & {
  answer: {
    optionId: string | null;
    optionLabel: string | null;
    value: string | number | boolean | null;
    scoreUsed: number | null;
  };
};

export type PreliminaryResultExcludedQuestion = PreliminaryResultQuestion & {
  exclusion: {
    reasonCode: string;
    reason: string;
  };
};

export type SchoolPreliminaryResult = {
  id: string;
  submission: {
    id: string;
    submittedAt: string;
  };
  school: {
    id: string;
    cue: string;
    name: string;
  };
  campaign: {
    id: string;
    name: string;
    type: string;
  };
  survey: {
    id: string;
    code: string;
    name: string;
    version: {
      id: string;
      number: number;
      title: string;
      publishedAt: string;
    };
  };
  result: {
    generalScore: number;
    stars: {
      available: boolean;
      base: number | null;
      final: number | null;
      wasLimited: boolean;
      maxWhenMentalHealthCritical: number | null;
      configurationVersion: string | null;
      blockingReasons: string[];
    };
    alerts: Array<{
      code: string;
      severity: string;
      dimensionCode: string;
      threshold: number;
      observedValue: number;
      message: string;
      causedBlocking: boolean;
      starsBefore: number;
      starsAfter: number;
    }>;
    dimensions: PreliminaryResultDimension[];
    mentalHealthCritical: {
      isCritical: boolean;
      value: number | null;
      threshold: number | null;
    };
  };
  applicableQuestions: PreliminaryResultQuestion[];
  excludedQuestions: PreliminaryResultExcludedQuestion[];
  answers: PreliminaryResultAnswer[];
  calculation: {
    calculatedAt: string;
    algorithmVersion: string;
    snapshotSchemaVersion: number;
  };
  dataQuality: {
    complete: boolean;
    warnings: string[];
  };
};

export type SchoolPreliminaryResultSummary = {
  id: string;
  submissionId: string;
  campaign: {
    id: string;
    name: string;
    type: string;
  };
  schoolName: string;
  submittedAt: string;
  generalScore: number;
  stars: number | null;
  calculatedAt: string;
};

export type SchoolPreliminaryResultList = {
  items: SchoolPreliminaryResultSummary[];
};

export type SchoolStarDistribution = {
  available: boolean;
  reason?: "insufficient_sample";
  minimumSample?: number;
  scope?: "province" | "department";
  denominator: number;
  ownStars: number | null;
  items: Array<{
    stars: number;
    count: number;
    percentage: number;
  }>;
};
