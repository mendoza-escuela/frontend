// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { schoolPortalService } from "../../services/school-portal.service";
import type {
  SchoolProfile,
  SchoolRectificationCatalogs,
} from "../../types/admin-school";
import { SchoolProfilePage } from "./SchoolProfilePage";

vi.mock("../../services/school-portal.service", () => ({
  schoolPortalService: {
    ownSchool: vi.fn(),
    rectificationCatalogs: vi.fn(),
    rectify: vi.fn(),
  },
}));

const profile: SchoolProfile = {
  id: "4f48fd62-fe7d-454a-9768-cb55b7fb2bf8",
  cue: "500012300",
  name: "Escuela Uno",
  directorName: "Ana Pérez",
  schoolNumber: "1-001",
  department: "Capital",
  locality: "Mendoza",
  address: "San Martín 100",
  postalCode: "5500",
  educationLevel: "Primario",
  managementType: "Estatal",
  scope: "Urbano",
  shift: "Simple",
  shiftCatalogId: null,
  shiftCatalog: null,
  phone: null,
  email: null,
  referentFirstName: "Ana",
  referentLastName: "Pérez",
  referentEmail: null,
  referentPhone: null,
  enrollment: null,
  hasKiosk: null,
  hasFoodService: null,
  isBoarding: null,
  educationLevels: [],
  characteristics: {},
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-07-29T12:00:00.000Z",
  rectification: {
    periodYear: 2026,
    isRectified: false,
    rectifiedAt: null,
    rectifiedBy: null,
  },
  rectifications: [],
};

const shiftId = "8bbdded8-8980-4a27-a1dc-95d39362f510";
const levelId = "c6a0ca01-6db2-44a0-a841-9426c33ee88c";
const catalogs: SchoolRectificationCatalogs = {
  shifts: {
    available: true,
    message: null,
    items: [
      {
        id: shiftId,
        code: "jornada_completa",
        label: "Jornada completa",
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
        id: levelId,
        code: "primario",
        label: "Primario",
        isActive: true,
        order: 0,
      },
    ],
  },
  managementTypes: [{ code: "state", label: "Estatal" }],
  scopes: [{ code: "urban", label: "Urbano" }],
  educationTypes: [{ code: "common", label: "Común" }],
  characteristics: [
    { code: "isMultigrade", label: "Plurogrado" },
    {
      code: "isInterculturalBilingual",
      label: "Intercultural y Bilingüe",
    },
  ],
};

describe("SchoolProfilePage", () => {
  beforeEach(() => {
    vi.mocked(schoolPortalService.ownSchool).mockResolvedValue(profile);
    vi.mocked(schoolPortalService.rectificationCatalogs).mockResolvedValue(
      catalogs,
    );
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("no ofrece Sin informar para las condiciones de aplicabilidad obligatorias", async () => {
    render(<SchoolProfilePage />);

    expect(
      await screen.findByRole("heading", {
        name: "Revisar y rectificar ficha anual",
      }),
    ).toBeVisible();
    const kiosk = screen.getByRole("group", { name: "¿Tiene kiosco? *" });
    const food = screen.getByRole("group", {
      name: "¿Tiene comedor o servicio alimentario? *",
    });
    expect(
      within(kiosk).queryByRole("radio", { name: "Sin informar" }),
    ).not.toBeInTheDocument();
    expect(
      within(food).queryByRole("radio", { name: "Sin informar" }),
    ).not.toBeInTheDocument();
    expect(within(kiosk).getByRole("radio", { name: "No" })).not.toBeChecked();
    expect(within(food).getByRole("radio", { name: "No" })).not.toBeChecked();
    expect(screen.getAllByRole("radio", { name: "Sin informar" })).toHaveLength(
      3,
    );
    expect(screen.getByLabelText(/Jornada/)).toBeEnabled();
    expect(screen.getByRole("checkbox", { name: "Primario" })).toBeEnabled();
  });

  it("solicita confirmación antes de quitar un nivel con matrícula", async () => {
    render(<SchoolProfilePage />);
    const level = await screen.findByRole("checkbox", { name: "Primario" });

    fireEvent.click(level);
    const enrollment = screen.getByLabelText("Matrícula de Primario");
    fireEvent.change(enrollment, { target: { value: "25" } });
    fireEvent.click(level);

    expect(
      screen.getByRole("heading", {
        name: "¿Quitar el nivel y su matrícula?",
      }),
    ).toBeVisible();
    expect(level).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Quitar nivel" }));

    await waitFor(() =>
      expect(
        screen.queryByLabelText("Matrícula de Primario"),
      ).not.toBeInTheDocument(),
    );
  });

  it("informa catálogos no disponibles sin habilitar texto libre", async () => {
    vi.mocked(schoolPortalService.rectificationCatalogs).mockResolvedValue({
      shifts: {
        available: false,
        message: "El catálogo oficial de jornadas todavía no fue configurado.",
        items: [],
      },
      educationLevels: {
        available: false,
        message:
          "El catálogo oficial de niveles educativos todavía no fue configurado.",
        items: [],
      },
      managementTypes: [],
      scopes: [],
      educationTypes: [],
      characteristics: [],
    });

    render(<SchoolProfilePage />);

    expect(
      await screen.findByText(
        "El catálogo oficial de jornadas todavía no fue configurado.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        "El catálogo oficial de niveles educativos todavía no fue configurado.",
      ),
    ).toBeVisible();
    expect(screen.queryByLabelText(/Jornada/)).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("envía null para limpiar características opcionales", async () => {
    const completeProfile: SchoolProfile = {
      ...profile,
      educationLevel: "Común",
      shift: "Jornada completa",
      shiftCatalogId: shiftId,
      shiftCatalog: catalogs.shifts.items[0],
      hasKiosk: true,
      hasFoodService: false,
      educationLevels: [
        {
          levelId,
          code: "primario",
          label: "Primario",
          isActive: true,
          enrollment: null,
          order: 0,
        },
      ],
      characteristics: {
        isMultigrade: true,
        isInterculturalBilingual: false,
      },
    };
    vi.mocked(schoolPortalService.ownSchool).mockResolvedValue(completeProfile);
    vi.mocked(schoolPortalService.rectify).mockResolvedValue(completeProfile);
    render(<SchoolProfilePage />);

    await screen.findByRole("heading", {
      name: "Revisar y rectificar ficha anual",
    });
    for (const groupName of ["Plurogrado", "Intercultural y Bilingüe"]) {
      fireEvent.click(
        within(screen.getByRole("group", { name: groupName })).getByRole(
          "radio",
          { name: "Sin informar" },
        ),
      );
    }
    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar rectificación anual" }),
    );

    await waitFor(() => expect(schoolPortalService.rectify).toHaveBeenCalled());
    expect(schoolPortalService.rectify).toHaveBeenCalledWith(
      expect.objectContaining({
        characteristics: {
          isMultigrade: null,
          isInterculturalBilingual: null,
        },
      }),
    );
  });

  it("interpreta educationLevel como nivel legado antes de snapshots v4", async () => {
    vi.mocked(schoolPortalService.ownSchool).mockResolvedValue({
      ...profile,
      rectifications: [
        {
          id: "legacy",
          periodYear: 2025,
          rectifiedAt: "2025-08-01T12:00:00.000Z",
          actorUser: null,
          snapshot: {
            schemaVersion: 3,
            name: "Escuela Uno",
            cue: "500012300",
            directorName: "Ana Pérez",
            address: "San Martín 100",
            department: "Capital",
            locality: "Mendoza",
            scope: "Urbano",
            educationLevel: "Primario",
            shift: "Simple",
          },
        },
        {
          id: "structured",
          periodYear: 2026,
          rectifiedAt: "2026-08-01T12:00:00.000Z",
          actorUser: null,
          snapshot: {
            schemaVersion: 4,
            name: "Escuela Uno",
            cue: "500012300",
            directorName: "Ana Pérez",
            address: "San Martín 100",
            department: "Capital",
            locality: "Mendoza",
            scope: "Urbano",
            educationLevel: "Común",
            shift: "Simple",
            educationLevels: [
              {
                id: levelId,
                code: "primario",
                label: "Primario",
                enrollment: null,
              },
            ],
          },
        },
      ],
    });
    const { container } = render(<SchoolProfilePage />);

    expect(
      await screen.findByRole("heading", {
        name: "Historial de rectificaciones",
      }),
    ).toBeVisible();
    const [legacy, structured] = Array.from(
      container.querySelectorAll("details"),
    );
    const labels = (details: Element) =>
      Array.from(details.querySelectorAll("dt"), ({ textContent }) =>
        textContent?.trim(),
      );
    expect(labels(legacy)).toContain("Niveles");
    expect(labels(legacy)).not.toContain("Tipo de educación");
    expect(labels(structured)).toEqual(
      expect.arrayContaining(["Tipo de educación", "Niveles"]),
    );
  });
});
