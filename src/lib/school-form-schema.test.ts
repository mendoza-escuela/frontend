import { describe, expect, it } from "vitest";
import {
  createAdminSchoolFormSchema,
  schoolFormSchema,
  schoolRectificationSchema,
} from "./school-form-schema";

const shiftId = "8bbdded8-8980-4a27-a1dc-95d39362f510";
const levelId = "c6a0ca01-6db2-44a0-a841-9426c33ee88c";
const respondent = {
  type: "RESPONDENT" as const,
  firstName: "Ana",
  lastName: "Pérez",
  position: "Secretaria",
  phone: "",
  email: "",
};
const valid = {
  cue: "500012300",
  name: "Escuela Uno",
  directorName: "María González",
  schoolNumber: "1-001",
  department: "Capital",
  locality: "Mendoza",
  address: "San Martín 1",
  postalCode: "5500",
  educationLevel: "Común",
  managementType: "Estatal",
  scope: "Urbano",
  shift: "Completa",
  shiftCatalogId: shiftId,
  educationLevels: [{ levelId, enrollment: null }],
  hasKiosk: true,
  hasFoodService: false,
  isBoarding: null,
  characteristics: {
    isMultigrade: null,
    isInterculturalBilingual: true,
  },
  phone: "",
  email: "escuela@ejemplo.edu.ar",
  referentFirstName: "Ana",
  referentLastName: "Pérez",
  referentEmail: "ana@ejemplo.edu.ar",
  referentPhone: "",
  respondentPosition: "Secretaria",
  enrollment: 350,
  isActive: true,
};

describe("schoolFormSchema", () => {
  it("acepta una ficha completa con catálogos y aplicabilidad", () => {
    expect(schoolFormSchema.safeParse(valid).success).toBe(true);
  });

  it("rechaza correo, matrícula y campos catalogados obligatorios inválidos", () => {
    const parsed = schoolFormSchema.safeParse({
      ...valid,
      email: "invalid",
      enrollment: -1,
      managementType: "",
      shiftCatalogId: null,
      educationLevels: [],
      hasKiosk: null,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining([
          "email",
          "enrollment",
          "managementType",
          "shiftCatalogId",
          "educationLevels",
          "hasKiosk",
        ]),
      );
    }
  });

  it("exige correo del responsable al crear pero no al editar datos históricos", () => {
    expect(
      createAdminSchoolFormSchema(false).safeParse({
        ...valid,
        referentEmail: "",
      }).success,
    ).toBe(false);
    expect(
      createAdminSchoolFormSchema(true).safeParse({
        ...valid,
        referentEmail: "",
      }).success,
    ).toBe(true);
  });

  it("permite matrícula y cargos sin informar, pero valida cargos iniciados", () => {
    expect(
      schoolFormSchema.safeParse({
        ...valid,
        enrollment: null,
        respondentPosition: "",
      }).success,
    ).toBe(true);
    expect(
      schoolFormSchema.safeParse({
        ...valid,
        respondentPosition: "X",
      }).success,
    ).toBe(false);
  });
});

describe("schoolRectificationSchema", () => {
  const rectification = {
    name: "Escuela Uno",
    cue: "500012300",
    directorName: "María González",
    department: "Capital",
    address: "San Martín 1",
    locality: "Mendoza",
    educationLevel: "Común",
    managementType: "",
    scope: "Urbano",
    hasKiosk: true,
    hasFoodService: false,
    isBoarding: null,
    characteristics: {
      isMultigrade: null,
      isInterculturalBilingual: false,
    },
    shiftCatalogId: shiftId,
    enrollment: 0,
    educationLevels: [{ levelId, enrollment: null }],
    expectedUpdatedAt: "2026-07-29T12:00:00.000Z",
    contacts: [respondent],
  };

  it("distingue false, null y cero sin volver obligatorios los opcionales", () => {
    expect(schoolRectificationSchema.parse(rectification)).toMatchObject({
      hasKiosk: true,
      hasFoodService: false,
      isBoarding: null,
      enrollment: 0,
      managementType: "",
      educationLevels: [{ enrollment: null }],
    });
  });

  it("exige ubicación, tipo, jornada, un nivel, kiosco y comedor", () => {
    const parsed = schoolRectificationSchema.safeParse({
      ...rectification,
      department: "",
      educationLevel: "",
      shiftCatalogId: null,
      educationLevels: [],
      hasKiosk: null,
      hasFoodService: null,
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining([
          "department",
          "educationLevel",
          "shiftCatalogId",
          "educationLevels",
          "hasKiosk",
          "hasFoodService",
        ]),
      );
    }
  });

  it("no exige contactos y permite un cargo vacío", () => {
    expect(
      schoolRectificationSchema.safeParse({
        ...rectification,
        contacts: [],
      }).success,
    ).toBe(true);
    expect(
      schoolRectificationSchema.safeParse({
        ...rectification,
        contacts: [{ ...respondent, position: "" }],
      }).success,
    ).toBe(true);
  });

  it("rechaza matrículas negativas, niveles duplicados y cargos iniciados inválidos", () => {
    expect(
      schoolRectificationSchema.safeParse({
        ...rectification,
        enrollment: -1,
        educationLevels: [
          rectification.educationLevels[0],
          { ...rectification.educationLevels[0], enrollment: 1.5 },
        ],
        contacts: [{ ...respondent, position: "X" }],
      }).success,
    ).toBe(false);
  });
});
