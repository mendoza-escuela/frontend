import { describe, expect, it } from "vitest";
import { createUserFormSchema } from "../../lib/user-form-schema";

const base = {
  firstName: "Ana",
  lastName: "Pérez",
  email: "ana@mendoza.gov.ar",
  role: "admin" as const,
  schoolId: "",
  temporaryPassword: "Temporal!Clave2026",
  isActive: true,
};

describe("createUserFormSchema", () => {
  it("validates a new administrator with a strong temporary password", () => {
    expect(createUserFormSchema(false).safeParse(base).success).toBe(true);
  });

  it("requires an associated school for the Escuela role", () => {
    expect(
      createUserFormSchema(false).safeParse({ ...base, role: "school" })
        .success,
    ).toBe(false);
  });

  it("does not request a temporary password while editing", () => {
    expect(
      createUserFormSchema(true).safeParse({ ...base, temporaryPassword: "" })
        .success,
    ).toBe(true);
  });

  it("permite dejar sin asignar un usuario Escuela al editar", () => {
    expect(
      createUserFormSchema(true).safeParse({
        ...base,
        role: "school",
        schoolId: "",
        temporaryPassword: "",
      }).success,
    ).toBe(true);
  });
});
