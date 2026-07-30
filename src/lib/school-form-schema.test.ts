import { describe, expect, it } from 'vitest';
import {
  schoolFormSchema,
  schoolRectificationSchema,
} from './school-form-schema';

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

describe('schoolRectificationSchema', () => {
  const rectification = {
    name: 'Escuela Uno',
    cue: '500012300',
    directorName: 'María González',
    address: 'San Martín 1',
    locality: 'Mendoza',
    scope: 'Urbano',
    hasKiosk: null,
    hasFoodService: false,
    isBoarding: true,
    shiftCatalogId: null,
    enrollment: 0,
    educationLevels: [
      {
        levelId: 'c6a0ca01-6db2-44a0-a841-9426c33ee88c',
        enrollment: null,
      },
    ],
    expectedUpdatedAt: '2026-07-29T12:00:00.000Z',
  };

  it('distingue null, false y cero', () => {
    expect(schoolRectificationSchema.parse(rectification)).toMatchObject({
      hasKiosk: null,
      hasFoodService: false,
      enrollment: 0,
      educationLevels: [{ enrollment: null }],
    });
  });

  it('rechaza decimales, negativos y niveles duplicados', () => {
    expect(
      schoolRectificationSchema.safeParse({
        ...rectification,
        enrollment: -1,
      }).success,
    ).toBe(false);
    expect(
      schoolRectificationSchema.safeParse({
        ...rectification,
        educationLevels: [
          rectification.educationLevels[0],
          { ...rectification.educationLevels[0], enrollment: 1.5 },
        ],
      }).success,
    ).toBe(false);
  });
});
