import type { SchoolNamedCatalogOption } from "../types/admin-school";

export function officialCatalogLabel(
  options: SchoolNamedCatalogOption[],
  value: string,
) {
  const normalized = value.trim();
  return options.find(
    ({ code, label }) => code === normalized || label === normalized,
  )?.label;
}

export function legacyCatalogValue(
  options: SchoolNamedCatalogOption[],
  value: string,
) {
  const normalized = value.trim();
  return normalized && !officialCatalogLabel(options, normalized)
    ? normalized
    : null;
}
