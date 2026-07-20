import { z } from 'zod';
import { strongPasswordSchema } from './validation';

export const createUserFormSchema = (editing: boolean) =>
  z
    .object({
      firstName: z.string().trim().min(2, 'Ingresá al menos 2 caracteres.').max(100),
      lastName: z.string().trim().min(2, 'Ingresá al menos 2 caracteres.').max(100),
      email: z.email('Ingresá un correo válido.'),
      role: z.enum(['admin', 'school']),
      schoolId: z.string().optional(),
      temporaryPassword: z.string().optional(),
      isActive: z.boolean(),
    })
    .superRefine((values, context) => {
      if (values.role === 'school' && !values.schoolId) {
        context.addIssue({
          code: 'custom',
          path: ['schoolId'],
          message: 'Seleccioná el colegio asociado.',
        });
      }
      if (!editing) {
        const password = strongPasswordSchema.safeParse(
          values.temporaryPassword ?? '',
        );
        if (!password.success) {
          context.addIssue({
            code: 'custom',
            path: ['temporaryPassword'],
            message:
              password.error.issues[0]?.message ?? 'Contraseña inválida.',
          });
        }
      }
    });

export type UserFormValues = z.infer<ReturnType<typeof createUserFormSchema>>;
