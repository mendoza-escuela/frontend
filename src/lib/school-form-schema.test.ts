import { describe, expect, it } from 'vitest';
import { schoolFormSchema } from './school-form-schema';

const valid = { cue: '500012300', name: 'Escuela Uno', directorName: 'María González', schoolNumber: '1-001', department: 'Capital', locality: 'Mendoza', address: 'San Martín 1', postalCode: '5500', educationLevel: 'Primario', managementType: 'Estatal', scope: 'Urbano', shift: 'Completa', phone: '', email: 'escuela@ejemplo.edu.ar', referentFirstName: 'Ana', referentLastName: 'Pérez', referentEmail: 'ana@ejemplo.edu.ar', referentPhone: '', enrollment: 350, isActive: true };

describe('schoolFormSchema', () => {
  it('accepts a complete valid school', () => { expect(schoolFormSchema.safeParse(valid).success).toBe(true); });
  it('rejects invalid emails and enrollment', () => {
    const parsed = schoolFormSchema.safeParse({ ...valid, email: 'invalid', enrollment: -1 });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues.length).toBeGreaterThanOrEqual(2);
  });
  it('requires director, scope and shift', () => {
    const parsed = schoolFormSchema.safeParse({
      ...valid,
      directorName: '',
      scope: '',
      shift: '',
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.map((issue) => issue.path[0])).toEqual(
        expect.arrayContaining(['directorName', 'scope', 'shift']),
      );
    }
  });
});
