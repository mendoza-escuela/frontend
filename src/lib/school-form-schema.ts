import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(""));
const optionalEmail = z
  .string()
  .trim()
  .max(255)
  .refine(
    (value) => !value || z.email().safeParse(value).success,
    "Correo inválido.",
  );
export const schoolFormSchema = z.object({
  cue: z
    .string()
    .trim()
    .min(3, "Ingresá un CUE válido.")
    .max(20)
    .regex(/^[A-Za-z0-9.-]+$/, "El CUE contiene caracteres inválidos."),
  name: z.string().trim().min(2, "Ingresá el nombre.").max(255),
  schoolNumber: optionalText(30),
  department: z.string().trim().min(2, "Ingresá el departamento.").max(120),
  locality: z.string().trim().min(2, "Ingresá la localidad.").max(120),
  address: z.string().trim().min(2, "Ingresá la dirección.").max(255),
  postalCode: optionalText(20),
  educationLevel: z.string().trim().min(2, "Ingresá el nivel.").max(120),
  managementType: z
    .string()
    .trim()
    .min(2, "Ingresá el tipo de gestión.")
    .max(120),
  scope: optionalText(120),
  shift: optionalText(120),
  phone: optionalText(40),
  email: optionalEmail,
  referentFirstName: z
    .string()
    .trim()
    .min(2, "Ingresá el nombre del referente.")
    .max(100),
  referentLastName: z
    .string()
    .trim()
    .min(2, "Ingresá el apellido del referente.")
    .max(100),
  referentEmail: optionalEmail,
  referentPhone: optionalText(40),
  enrollment: z
    .number()
    .int("Debe ser un número entero.")
    .min(0)
    .max(1_000_000),
  characteristicsText: z
    .string()
    .trim()
    .refine((value) => {
      try {
        const parsed = JSON.parse(value || "{}");
        return (
          parsed &&
          !Array.isArray(parsed) &&
          typeof parsed === "object" &&
          Object.keys(parsed).length <= 30 &&
          Object.entries(parsed).every(
            ([key, item]) =>
              key.length <= 80 &&
              !["__proto__", "prototype", "constructor"].includes(key) &&
              (item === null ||
                ["string", "number", "boolean"].includes(typeof item)),
          )
        );
      } catch {
        return false;
      }
    }, "Usá un objeto JSON de hasta 30 valores simples."),
  isActive: z.boolean(),
});
export type SchoolFormValues = z.infer<typeof schoolFormSchema>;
