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

export type SchoolCatalogOption = {
  id: string;
  code: string;
  label: string;
  isActive: boolean;
  order: number;
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
  address: string;
  locality: string;
  scope: string;
  educationLevel?: string;
  shift?: string;
  hasKiosk?: boolean | null;
  hasFoodService?: boolean | null;
  isBoarding?: boolean | null;
  shiftCatalogId?: string | null;
  educationLevels?: Array<{
    levelId: string;
    enrollment: number | null;
  }>;
  enrollment?: number | null;
  expectedUpdatedAt?: string;
};

export type SchoolRectificationSnapshot = {
  schemaVersion?: number;
  sourceRectificationId?: string;
  capturedAt?: string;
  name: string;
  cue: string;
  directorName: string;
  address: string;
  locality: string;
  scope: string;
  educationLevel: string;
  shift: string;
  hasKiosk?: boolean | null;
  hasFoodService?: boolean | null;
  isBoarding?: boolean | null;
  shiftCatalog?: Pick<SchoolCatalogOption, "id" | "code" | "label"> | null;
  educationLevels?: Array<{
    id: string;
    code: string;
    label: string;
    enrollment: number | null;
  }>;
  enrollmentTotal?: number | null;
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
};

export type SchoolRectificationStatus = {
  periodYear: number;
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
  | "characteristics"
  | "shiftCatalogId"
  | "shiftCatalog"
  | "hasKiosk"
  | "hasFoodService"
  | "isBoarding"
  | "educationLevels"
> & {
  characteristics?: School["characteristics"];
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
  campaigns: { available: false; items: []; message: string };
  evaluations: { available: false; items: []; message: string };
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
  errorCount: number;
  imported: Array<{ line: number; id: string; cue: string }>;
  errors: Array<{ line: number; cue: string; errors: string[] }>;
};
