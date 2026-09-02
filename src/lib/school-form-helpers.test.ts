import { describe, expect, it } from "vitest";
import {
  booleanSchoolCharacteristic,
  nullableInteger,
  resolveSchoolShift,
  schoolCatalogLabel,
  schoolCharacteristicLabel,
  simpleSchoolCharacteristics,
} from "./school-form-helpers";

const namedOptions = [
  { code: "public", label: "Gestión estatal" },
  { code: "private", label: "Gestión privada" },
];

describe("school form helpers", () => {
  it("resuelve etiquetas por código o por etiqueta", () => {
    expect(schoolCatalogLabel(namedOptions, "public")).toBe(
      "Gestión estatal",
    );
    expect(schoolCatalogLabel(namedOptions, "Gestión privada")).toBe(
      "Gestión privada",
    );
    expect(schoolCatalogLabel(namedOptions, "legacy")).toBe("");
  });

  it("usa la etiqueta de característica y respeta el fallback", () => {
    const catalogs = { characteristics: namedOptions };

    expect(schoolCharacteristicLabel(catalogs, "public", "Otra")).toBe(
      "Gestión estatal",
    );
    expect(schoolCharacteristicLabel(catalogs, "missing", "Otra")).toBe(
      "Otra",
    );
  });

  it("expone únicamente características booleanas", () => {
    const school = {
      characteristics: {
        isMultigrade: true,
        legacy: "Sí",
      },
    };

    expect(booleanSchoolCharacteristic(school, "isMultigrade")).toBe(true);
    expect(booleanSchoolCharacteristic(school, "legacy")).toBeNull();
    expect(booleanSchoolCharacteristic(school, "missing")).toBeNull();
  });

  it("reduce las características editables a valores explícitos", () => {
    expect(simpleSchoolCharacteristics({ isMultigrade: false })).toEqual({
      isMultigrade: false,
      isInterculturalBilingual: null,
    });
  });

  it("encuentra jornadas por id, etiqueta o código", () => {
    const shifts = {
      available: true,
      message: null,
      items: [
        {
          id: "shift-1",
          code: "full",
          label: "Jornada completa",
          isActive: true,
          order: 1,
        },
      ],
    };

    expect(
      resolveSchoolShift(
        { shifts },
        { shiftCatalogId: null, shift: "full" },
      )?.id,
    ).toBe("shift-1");
  });

  it("convierte entradas opcionales de matrícula", () => {
    expect(nullableInteger("")).toBeNull();
    expect(nullableInteger(undefined)).toBeNull();
    expect(nullableInteger("125")).toBe(125);
  });
});
