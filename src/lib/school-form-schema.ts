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
const schoolFormBaseSchema = z.object({
  cue: z
    .string()
    .trim()
    .min(3, "Ingresá un CUE válido.")
    .max(20)
    .regex(/^[A-Za-z0-9.-]+$/, "El CUE contiene caracteres inválidos."),
  name: z.string().trim().min(2, "Ingresá el nombre.").max(255),
  directorName: z
    .string()
    .trim()
    .min(2, "Ingresá el nombre del/de la director/a.")
    .max(200),
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
  scope: z.string().trim().min(2, "Ingresá el ámbito.").max(120),
  shift: z.string().trim().min(2, "Ingresá la jornada.").max(120),
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
  respondentPosition: z
    .string()
    .trim()
    .min(2, "Ingresá el cargo del referente respondente.")
    .max(160),
  healthReferentFirstName: optionalText(100),
  healthReferentLastName: optionalText(100),
  healthReferentPosition: optionalText(160),
  healthReferentEmail: optionalEmail,
  healthReferentPhone: optionalText(40),
  enrollment: z
    .number()
    .int("Debe ser un número entero.")
    .min(0)
    .max(1_000_000),
  isActive: z.boolean(),
});

export const schoolFormSchema = schoolFormBaseSchema.superRefine((values, context) => {
  const healthValues = [
    values.healthReferentFirstName,
    values.healthReferentLastName,
    values.healthReferentPosition,
    values.healthReferentEmail,
    values.healthReferentPhone,
  ];
  if (!healthValues.some(Boolean)) return;
  for (const [field, value, message] of [
    ["healthReferentFirstName", values.healthReferentFirstName, "Ingresá el nombre del referente de promoción de la salud."],
    ["healthReferentLastName", values.healthReferentLastName, "Ingresá el apellido del referente de promoción de la salud."],
    ["healthReferentPosition", values.healthReferentPosition, "Ingresá el cargo del referente de promoción de la salud."],
  ] as const)
    if (!value || value.trim().length < 2)
      context.addIssue({ code: "custom", path: [field], message });
});
export type SchoolFormValues = z.infer<typeof schoolFormSchema>;

const rectificationContactsSchema = z
  .array(
    z.object({
      type: z.enum(["RESPONDENT", "HEALTH_PROMOTION"]),
      firstName: z.string().trim().min(2, "Ingresá el nombre.").max(100),
      lastName: z.string().trim().min(2, "Ingresá el apellido.").max(100),
      position: z.string().trim().min(2, "Ingresá el cargo.").max(160),
      phone: optionalText(40),
      email: optionalEmail,
    }),
  )
  .max(2)
  .superRefine((contacts, context) => {
    const types = contacts.map(({ type }) => type);
    if (new Set(types).size !== types.length)
      context.addIssue({
        code: "custom",
        message: "Sólo puede existir un referente de cada tipo.",
      });
  });

export const schoolRectificationSchema = schoolFormBaseSchema.pick({
  name: true,
  cue: true,
  directorName: true,
  address: true,
  locality: true,
  scope: true,
}).extend({
  hasKiosk: z.boolean().nullable(),
  hasFoodService: z.boolean().nullable(),
  isBoarding: z.boolean().nullable(),
  shiftCatalogId: z.uuid().nullable(),
  enrollment: z
    .number()
    .int("Debe ser un número entero.")
    .min(0, "No puede ser negativa.")
    .max(1_000_000)
    .nullable(),
  educationLevels: z
    .array(
      z.object({
        levelId: z.uuid(),
        enrollment: z
          .number()
          .int("Debe ser un número entero.")
          .min(0, "No puede ser negativa.")
          .max(1_000_000)
          .nullable(),
      }),
    )
    .superRefine((levels, context) => {
      const seen = new Set<string>();
      levels.forEach((level, index) => {
        if (seen.has(level.levelId))
          context.addIssue({
            code: "custom",
            message: "El nivel educativo está repetido.",
            path: [index, "levelId"],
          });
        seen.add(level.levelId);
      });
    }),
  expectedUpdatedAt: z.iso.datetime(),
  contacts: rectificationContactsSchema,
});
export type SchoolRectificationValues = z.infer<
  typeof schoolRectificationSchema
>;
