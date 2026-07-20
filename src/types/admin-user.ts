import type { UserRole } from './auth';

export type SchoolOption = { id: string; code: string; name: string };

export type ManagedUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  school: SchoolOption | null;
};

export type UserListResponse = {
  items: ManagedUser[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type UserWriteInput = {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  schoolId?: string | null;
  temporaryPassword?: string;
  isActive: boolean;
};

export type ImportPreview = {
  totalRows: number;
  validCount: number;
  errorCount: number;
  rows: Array<{
    line: number;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole | null;
    schoolCode: string | null;
    isActive: boolean | null;
    hasTemporaryPassword: boolean;
    errors: string[];
  }>;
};

export type ImportResult = {
  totalRows: number;
  importedCount: number;
  errorCount: number;
  imported: Array<{ line: number; id: string; email: string }>;
  errors: Array<{ line: number; email: string; errors: string[] }>;
};
