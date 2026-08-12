export type School = {
  id: string;
  cue: string;
  name: string;
  directorName: string;
  schoolNumber: string | null;
  department: string;
  locality: string;
  address: string;
  postalCode: string | null;
  educationLevel: string;
  managementType: string;
  scope: string;
  shift: string;
  shiftCatalogId: string | null;
  shiftCatalog: SchoolCatalogOption | null;
  phone: string | null;
  email: string | null;
  referentFirstName: string;
  referentLastName: string;
  referentEmail: string | null;
  referentPhone: string | null;
  contacts?: SchoolContact[];
  enrollment: number | null;
  hasKiosk: boolean | null;
  hasFoodService: boolean | null;
  isBoarding: boolean | null;
  educationLevels: SchoolEducationLevelSelection[];
  characteristics: Record<string, string | number | boolean | null>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SchoolContact = {
  id?: string;
  type: "RESPONDENT" | "HEALTH_PROMOTION";
  firstName: string;
  lastName: string;
  position: string | null;
  phone: string | null;
  email: string | null;
};

export type SchoolCatalogOption = {
  id: string;
  code: string;
  label: string;
  isActive: boolean;
  order: number;
};

export type SchoolNamedCatalogOption = {
  code: string;
  label: string;
};

export type SchoolEducationLevelSelection = {
  levelId: string;
  code: string;
  label: string;
  isActive: boolean;
  enrollment: number | null;
  order: number;
};

export type SchoolRectificationInput = {
  name: string;
  cue: string;
  directorName: string;
  department: string;
  address: string;
  locality: string;
  managementType?: string;
  scope: string;
  educationLevel: string;
  shift?: string;
  hasKiosk: boolean;
  hasFoodService: boolean;
  isBoarding?: boolean | null;
  shiftCatalogId: string;
  educationLevels: Array<{
    levelId: string;
    enrollment: number | null;
  }>;
  enrollment?: number | null;
  characteristics?: Record<string, string | number | boolean | null>;
  expectedUpdatedAt?: string;
  contacts?: Array<Omit<SchoolContact, "id">>;
};

export type SchoolUpdateAndRectifyInput = Omit<
  SchoolRectificationInput,
  "expectedUpdatedAt"
> & {
  schoolNumber: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  expectedUpdatedAt: string;
};

export type SchoolRectificationSnapshot = {
  schemaVersion?: number;
  sourceRectificationId?: string;
  capturedAt?: string;
  name: string;
  cue: string;
  directorName: string;
  address: string;
  department?: string;
  locality: string;
  managementType?: string;
  scope: string;
  educationLevel: string;
  shift: string;
  hasKiosk?: boolean | null;
  hasFoodService?: boolean | null;
  isBoarding?: boolean | null;
  characteristics?: Record<string, string | number | boolean | null>;
  shiftCatalog?: Pick<SchoolCatalogOption, "id" | "code" | "label"> | null;
  educationLevels?: Array<{
    id: string;
    code: string;
    label: string;
    enrollment: number | null;
  }>;
  enrollmentTotal?: number | null;
  contacts?: Array<Omit<SchoolContact, "id">>;
};

export type SchoolRectificationCatalogs = {
  shifts: {
    available: boolean;
    message: string | null;
    items: SchoolCatalogOption[];
  };
  educationLevels: {
    available: boolean;
    message: string | null;
    items: SchoolCatalogOption[];
  };
  managementTypes: SchoolNamedCatalogOption[];
  scopes: SchoolNamedCatalogOption[];
  educationTypes: SchoolNamedCatalogOption[];
  characteristics: SchoolNamedCatalogOption[];
};

export type SchoolRectificationStatus = {
  periodYear: number;
  /** Existe una confirmación anual, aunque el snapshot pueda requerir actualización. */
  isConfirmed?: boolean;
  /** El snapshot confirmado contiene todos los datos necesarios para evaluar. */
  isEvaluationReady?: boolean;
  missingFields?: Array<{
    code: string;
    label: string;
  }>;
  /** Campo legado conservado durante la transición del contrato. */
  isRectified: boolean;
  rectifiedAt: string | null;
  rectifiedBy: SchoolUserSummary | null;
};

export type SchoolProfile = School & {
  rectification: SchoolRectificationStatus;
  rectifications: Array<{
    id: string;
    periodYear: number;
    rectifiedAt: string;
    actorUser: SchoolUserSummary | null;
    snapshot: SchoolRectificationSnapshot;
  }>;
};

export type SchoolWriteInput = Omit<
  School,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "shiftCatalog"
  | "educationLevels"
  | "contacts"
  | "characteristics"
  | "shift"
> & {
  shift?: string;
  characteristics?: School["characteristics"];
  shiftCatalogId: string | null;
  educationLevels: Array<{
    levelId: string;
    enrollment: number | null;
  }>;
  contacts: Array<Omit<SchoolContact, "id">>;
};
export type SchoolCreateResponse = SchoolDetail & {
  responsibleUserInvitationEmailSent: boolean;
};
export type SchoolListItem = Pick<
  School,
  | "id"
  | "cue"
  | "name"
  | "schoolNumber"
  | "department"
  | "locality"
  | "educationLevel"
  | "managementType"
  | "enrollment"
  | "isActive"
>;
export type SchoolListResponse = {
  items: SchoolListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
export type SchoolFilterOptions = {
  departments: string[];
  localities: string[];
  educationLevels: string[];
  managementTypes: string[];
  scopes: string[];
  shifts: string[];
};
export type SchoolUserSummary = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  isActive?: boolean;
  lastLoginAt?: string | null;
};
export type SchoolUserListResponse = {
  items: SchoolUserSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type SchoolCampaignParticipationStatus =
  "not_started" | "draft" | "submitted";

export type SchoolDetailCampaignActivity = {
  assignment: {
    id: string;
    source: string;
    assignedAt: string | null;
  };
  campaign: {
    id: string;
    name: string;
    type: "annual" | "semiannual";
    status: "draft" | "active" | "closed" | "archived";
    startsAt: string | null;
    endsAt: string | null;
  };
  participationStatus: SchoolCampaignParticipationStatus;
  submission: {
    id: string;
    status: "draft" | "submitted";
    startedAt: string | null;
    lastSavedAt: string | null;
    submittedAt: string | null;
  } | null;
  result: {
    available: boolean;
    id: string | null;
    calculatedAt: string | null;
  };
};

export type SchoolDetailEvaluation = {
  id: string;
  campaignId: string;
  submissionId: string;
  calculatedAt: string | null;
  generalScore: number | null;
  stars: number | null;
};

type SchoolDetailActivityCollection<T> = {
  /** `false` se conserva para respuestas anteriores donde el módulo no estaba disponible. */
  available: boolean;
  items: T[];
  /** Vacío cuando hay datos; descriptivo cuando la colección está vacía o no disponible. */
  message: string;
};

export type SchoolDetail = School & {
  rectification: SchoolRectificationStatus;
  rectifications: Array<{
    id: string;
    periodYear: number;
    rectifiedAt: string;
    actorUser: SchoolUserSummary | null;
    snapshot: SchoolRectificationSnapshot;
  }>;
  users: SchoolUserSummary[];
  accesses: Array<{
    id: string;
    userId: string;
    createdAt: string;
    expiresAt: string;
    revokedAt: string | null;
    user?: SchoolUserSummary;
  }>;
  assignmentHistory: Array<{
    id: string;
    action: "assigned" | "replaced" | "unassigned";
    createdAt: string;
    previousUser: SchoolUserSummary | null;
    newUser: SchoolUserSummary | null;
    actorUser: SchoolUserSummary | null;
  }>;
  audits: Array<{
    id: string;
    action: string;
    changes: Record<string, unknown>;
    createdAt: string;
  }>;
  campaigns: SchoolDetailActivityCollection<SchoolDetailCampaignActivity>;
  evaluations: SchoolDetailActivityCollection<SchoolDetailEvaluation>;
  actions: {
    canEdit: boolean;
    canChangeStatus: boolean;
    canReplaceUser: boolean;
    canStartEvaluation: boolean;
  };
};

export type SchoolImportPreview = {
  totalRows: number;
  validCount: number;
  errorCount: number;
  rows: Array<{
    line: number;
    cue: string;
    name: string;
    department: string;
    locality: string;
    isActive: boolean | null;
    errors: string[];
  }>;
};
export type SchoolImportResult = {
  totalRows: number;
  importedCount: number;
  invitationEmailSentCount: number;
  invitationEmailPendingCount: number;
  errorCount: number;
  imported: Array<{
    line: number;
    id: string;
    cue: string;
    invitationEmailSent: boolean;
  }>;
  errors: Array<{ line: number; cue: string; errors: string[] }>;
};
