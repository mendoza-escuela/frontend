export type School = {
  id: string;
  cue: string;
  name: string;
  schoolNumber: string | null;
  department: string;
  locality: string;
  address: string;
  postalCode: string | null;
  educationLevel: string;
  managementType: string;
  scope: string | null;
  shift: string | null;
  phone: string | null;
  email: string | null;
  referentFirstName: string;
  referentLastName: string;
  referentEmail: string | null;
  referentPhone: string | null;
  enrollment: number;
  characteristics: Record<string, string | number | boolean | null>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SchoolWriteInput = Omit<School, "id" | "createdAt" | "updatedAt">;
export type SchoolListResponse = {
  items: School[];
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
export type SchoolDetail = School & {
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
