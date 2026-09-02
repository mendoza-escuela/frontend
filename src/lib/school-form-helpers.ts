import type {
  School,
  SchoolNamedCatalogOption,
  SchoolRectificationCatalogs,
} from "../types/admin-school";

type SchoolCharacteristicValues = {
  isMultigrade?: boolean | null;
  isInterculturalBilingual?: boolean | null;
};

type SchoolShiftReference = Pick<School, "shift" | "shiftCatalogId">;

export function schoolCatalogLabel(
  options: SchoolNamedCatalogOption[],
  current: string,
) {
  return (
    options.find(({ code, label }) => code === current || label === current)
      ?.label ?? ""
  );
}

export function schoolCharacteristicLabel(
  catalogs: Pick<SchoolRectificationCatalogs, "characteristics">,
  code: string,
  fallback: string,
) {
  return (
    catalogs.characteristics.find((option) => option.code === code)?.label ??
    fallback
  );
}

export function booleanSchoolCharacteristic(
  school: Pick<School, "characteristics">,
  code: string,
) {
  const value = school.characteristics[code];
  return typeof value === "boolean" ? value : null;
}

export function simpleSchoolCharacteristics(
  characteristics: SchoolCharacteristicValues,
) {
  return {
    isMultigrade: characteristics.isMultigrade ?? null,
    isInterculturalBilingual:
      characteristics.isInterculturalBilingual ?? null,
  };
}

export function resolveSchoolShift(
  catalogs: Pick<SchoolRectificationCatalogs, "shifts">,
  school: SchoolShiftReference,
) {
  return catalogs.shifts.items.find(
    (option) =>
      option.id === school.shiftCatalogId ||
      option.label === school.shift ||
      option.code === school.shift,
  );
}

export function nullableInteger(value: unknown) {
  return value === "" || value === null || value === undefined
    ? null
    : Number(value);
}
