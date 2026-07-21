import { z } from 'zod';

export const strongPasswordSchema = z
  .string()
  .min(12, 'Debe tener al menos 12 caracteres.')
  .regex(/[a-z]/, 'Debe incluir una minúscula.')
  .regex(/[A-Z]/, 'Debe incluir una mayúscula.')
  .regex(/\d/, 'Debe incluir un número.')
  .regex(/[^A-Za-z0-9]/, 'Debe incluir un símbolo.');
