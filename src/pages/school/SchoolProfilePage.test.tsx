// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { schoolPortalService } from '../../services/school-portal.service';
import type { SchoolProfile } from '../../types/admin-school';
import { SchoolProfilePage } from './SchoolProfilePage';

vi.mock('../../services/school-portal.service', () => ({
  schoolPortalService: {
    ownSchool: vi.fn(),
    rectificationCatalogs: vi.fn(),
    rectify: vi.fn(),
  },
}));

const profile: SchoolProfile = {
  id: '4f48fd62-fe7d-454a-9768-cb55b7fb2bf8',
  cue: '500012300',
  name: 'Escuela Uno',
  directorName: 'Ana Pérez',
  schoolNumber: '1-001',
  department: 'Capital',
  locality: 'Mendoza',
  address: 'San Martín 100',
  postalCode: '5500',
  educationLevel: 'Primario',
  managementType: 'Estatal',
  scope: 'Urbano',
  shift: 'Simple',
  shiftCatalogId: null,
  shiftCatalog: null,
  phone: null,
  email: null,
  referentFirstName: 'Ana',
  referentLastName: 'Pérez',
  referentEmail: null,
  referentPhone: null,
  enrollment: null,
  hasKiosk: null,
  hasFoodService: null,
  isBoarding: null,
  educationLevels: [],
  characteristics: {},
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-07-29T12:00:00.000Z',
  rectification: {
    periodYear: 2026,
    isRectified: false,
    rectifiedAt: null,
    rectifiedBy: null,
  },
  rectifications: [],
};

describe('SchoolProfilePage', () => {
  beforeEach(() => {
    vi.mocked(schoolPortalService.ownSchool).mockResolvedValue(profile);
    vi.mocked(schoolPortalService.rectificationCatalogs).mockResolvedValue({
      shifts: {
        available: true,
        message: null,
        items: [
          {
            id: '8bbdded8-8980-4a27-a1dc-95d39362f510',
            code: 'jornada_completa',
            label: 'Jornada completa',
            isActive: true,
            order: 0,
          },
        ],
      },
      educationLevels: {
        available: true,
        message: null,
        items: [
          {
            id: 'c6a0ca01-6db2-44a0-a841-9426c33ee88c',
            code: 'primario',
            label: 'Primario',
            isActive: true,
            order: 0,
          },
        ],
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renderiza estados ternarios sin convertir datos desconocidos en No', async () => {
    render(<SchoolProfilePage />);

    expect(
      await screen.findByRole('heading', {
        name: 'Revisar y rectificar ficha anual',
      }),
    ).toBeVisible();
    expect(
      screen.getAllByRole('radio', { name: 'Sin informar' }),
    ).toHaveLength(3);
    screen
      .getAllByRole('radio', { name: 'Sin informar' })
      .forEach((radio) => expect(radio).toBeChecked());
    screen
      .getAllByRole('radio', { name: 'No' })
      .forEach((radio) => expect(radio).not.toBeChecked());
    expect(screen.getByLabelText('Jornada')).toBeEnabled();
    expect(screen.getByRole('checkbox', { name: 'Primario' })).toBeEnabled();
  });

  it('solicita confirmación antes de quitar un nivel con matrícula', async () => {
    render(<SchoolProfilePage />);
    const level = await screen.findByRole('checkbox', { name: 'Primario' });

    fireEvent.click(level);
    const enrollment = screen.getByLabelText('Matrícula de Primario');
    fireEvent.change(enrollment, { target: { value: '25' } });
    fireEvent.click(level);

    expect(
      screen.getByRole('heading', {
        name: '¿Quitar el nivel y su matrícula?',
      }),
    ).toBeVisible();
    expect(level).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Quitar nivel' }));

    await waitFor(() =>
      expect(
        screen.queryByLabelText('Matrícula de Primario'),
      ).not.toBeInTheDocument(),
    );
  });

  it('informa catálogos no disponibles sin habilitar texto libre', async () => {
    vi.mocked(schoolPortalService.rectificationCatalogs).mockResolvedValue({
      shifts: {
        available: false,
        message: 'El catálogo oficial de jornadas todavía no fue configurado.',
        items: [],
      },
      educationLevels: {
        available: false,
        message:
          'El catálogo oficial de niveles educativos todavía no fue configurado.',
        items: [],
      },
    });

    render(<SchoolProfilePage />);

    expect(
      await screen.findByText(
        'El catálogo oficial de jornadas todavía no fue configurado.',
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        'El catálogo oficial de niveles educativos todavía no fue configurado.',
      ),
    ).toBeVisible();
    expect(screen.queryByLabelText('Jornada')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
