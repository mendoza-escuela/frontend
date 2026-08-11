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
