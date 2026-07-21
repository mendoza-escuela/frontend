import { describe, expect, it } from 'vitest';
import { strongPasswordSchema } from './validation';

describe('strongPasswordSchema', () => {
  it('accepts a password that meets the shared policy', () => {
    expect(strongPasswordSchema.safeParse('ClaveSegura!2026').success).toBe(true);
  });

  it.each([
    'Corta!1',
    'SINMINUSCULA!2026',
    'sinmayuscula!2026',
    'SinNumero!!Clave',
    'SinSimbolo2026Clave',
  ])('rejects a weak password: %s', (password) => {
    expect(strongPasswordSchema.safeParse(password).success).toBe(false);
  });
});
