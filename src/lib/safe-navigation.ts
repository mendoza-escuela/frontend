import type { UserRole } from '../types/auth';

/** Accepts only same-origin application paths suitable for redirects. */
export function getSafeInternalPath(value: unknown) {
  if (typeof value !== 'string') return null;
  if (
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    value.length > 2048 ||
    /[\r\n]/.test(value)
  ) {
    return null;
  }
  return value;
}

/**
 * Returns a protected destination only when it belongs to the authenticated
 * user's portal. This prevents a saved route for another role from producing
 * a transient access-denied page immediately after login.
 */
export function getSafeReturnPathForRole(value: unknown, role: UserRole) {
  const path = getSafeInternalPath(value);
  if (!path) return null;

  const allowedPrefix = role === 'admin' ? '/admin' : '/colegio';
  return path === allowedPrefix || path.startsWith(`${allowedPrefix}/`)
    ? path
    : null;
}
