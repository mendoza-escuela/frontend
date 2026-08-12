// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminSchoolsService } from "../../services/admin-schools.service";
import type {
  SchoolDetail,
  SchoolRectificationCatalogs,
} from "../../types/admin-school";
import { SchoolFormPage } from "./SchoolFormPage";

vi.mock("../../services/admin-schools.service", () => ({
  adminSchoolsService: {
    rectificationCatalogs: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateAndRectify: vi.fn(),
  },
}));

const shiftId = "8bbdded8-8980-4a27-a1dc-95d39362f510";
const levelId = "c6a0ca01-6db2-44a0-a841-9426c33ee88c";
const catalogs: SchoolRectificationCatalogs = {
  shifts: {
    available: true,
    message: null,
    items: [
      {
        id: shiftId,
        code: "full_day",
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
        code: "primary",
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

const school = {
  id: "school-1",
  cue: "500012300",
  name: "Escuela Uno",
  directorName: "María González",
  schoolNumber: "1-001",
  department: "Capital",
  locality: "Mendoza",
  address: "San Martín 1",
  postalCode: "5500",
  educationLevel: "Común",
  managementType: "Estatal",
  scope: "Urbano",
  shift: "Jornada completa",
  shiftCatalogId: shiftId,
  shiftCatalog: catalogs.shifts.items[0],
  phone: null,
  email: "escuela@ejemplo.edu.ar",
  referentFirstName: "Ana",
  referentLastName: "Pérez",
  referentEmail: "ana@ejemplo.edu.ar",
  referentPhone: "2615550000",
  contacts: [
    {
      type: "RESPONDENT",
      firstName: "Ana",
      lastName: "Pérez",
      position: "Secretaria",
      phone: "2615550000",
      email: "ana@ejemplo.edu.ar",
    },
    {
      type: "HEALTH_PROMOTION",
      firstName: "Laura",
      lastName: "Gómez",
      position: "Docente",
      phone: null,
      email: null,
    },
  ],
  enrollment: null,
  hasKiosk: true,
  hasFoodService: false,
  isBoarding: null,
  educationLevels: [
    {
      levelId,
      code: "primary",
      label: "Primario",
      isActive: true,
      enrollment: 200,
      order: 0,
    },
  ],
  characteristics: {
    isMultigrade: true,
    isInterculturalBilingual: false,
  },
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  rectification: {
    periodYear: 2026,
    isRectified: false,
    rectifiedAt: null,
    rectifiedBy: null,
  },
  rectifications: [],
  users: [],
  accesses: [],
  assignmentHistory: [],
  audits: [],
  campaigns: { available: false, items: [], message: "" },
  evaluations: { available: false, items: [], message: "" },
  actions: {
    canEdit: true,
    canChangeStatus: true,
    canReplaceUser: true,
    canStartEvaluation: true,
  },
} as SchoolDetail;

function renderPage(path = "/admin/colegios/nuevo") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/admin/colegios/nuevo" element={<SchoolFormPage />} />
        <Route path="/admin/colegios/:id/editar" element={<SchoolFormPage />} />
        <Route path="/admin/colegios/:id" element={<p>Detalle</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SchoolFormPage", () => {
  beforeEach(() => {
    vi.mocked(adminSchoolsService.rectificationCatalogs).mockResolvedValue(
      catalogs,
    );
    vi.mocked(adminSchoolsService.findOne).mockResolvedValue(school);
    vi.mocked(adminSchoolsService.create).mockResolvedValue({
      ...school,
      responsibleUserInvitationEmailSent: true,
    });
    vi.mocked(adminSchoolsService.updateAndRectify).mockResolvedValue(school);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("usa catálogos oficiales y no ofrece estado desconocido en aplicabilidad", async () => {
    renderPage();

    await screen.findByLabelText("Sector / gestión *");
    selectOption("Sector / gestión *", "Estatal");
    selectOption("Ámbito *", "Urbano");
    selectOption("Tipo de educación *", "Común");
    selectOption("Jornada *", "Jornada completa");
    expect(screen.getByLabelText("Sector / gestión *")).toHaveTextContent(
      "Estatal",
    );
    const kiosk = screen.getByRole("group", { name: "¿Tiene kiosco? *" });
    expect(
      within(kiosk).queryByRole("radio", { name: "Sin informar" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Plurogrado" })).toBeVisible();
  });

  it("actualiza y rectifica en una única llamada atómica", async () => {
    renderPage("/admin/colegios/school-1/editar");

    fireEvent.click(
      await screen.findByRole("button", { name: "Guardar colegio" }),
    );

    await waitFor(() =>
      expect(adminSchoolsService.updateAndRectify).toHaveBeenCalled(),
    );
    expect(adminSchoolsService.updateAndRectify).toHaveBeenCalledTimes(1);
    expect(adminSchoolsService.updateAndRectify).toHaveBeenCalledWith(
      "school-1",
      expect.objectContaining({
        schoolNumber: "1-001",
        postalCode: "5500",
        phone: null,
        email: "escuela@ejemplo.edu.ar",
        expectedUpdatedAt: "2026-08-01T00:00:00.000Z",
        department: "Capital",
        educationLevel: "Común",
        shiftCatalogId: shiftId,
        educationLevels: [{ levelId, enrollment: 200 }],
        hasKiosk: true,
        hasFoodService: false,
        isBoarding: null,
        enrollment: null,
        characteristics: {
          isMultigrade: true,
          isInterculturalBilingual: false,
        },
        contacts: [expect.objectContaining({ type: "RESPONDENT" })],
      }),
    );
    expect(adminSchoolsService.update).not.toHaveBeenCalled();
    expect(adminSchoolsService.create).not.toHaveBeenCalled();
    expect(
      vi.mocked(adminSchoolsService.updateAndRectify).mock.calls[0][1],
    ).not.toHaveProperty("isActive");
    expect(
      screen.queryByRole("checkbox", { name: "Colegio activo" }),
    ).not.toBeInTheDocument();
  });

  it("conserva un tipo de educación legado y exige elegir el catálogo oficial", async () => {
    vi.mocked(adminSchoolsService.findOne).mockResolvedValue({
      ...school,
      educationLevel: "Primario",
    });
    renderPage("/admin/colegios/school-1/editar");

    const educationType = await screen.findByRole("button", {
      name: /Tipo de educación \*/,
    });
    expect(educationType).toHaveTextContent(
      "Valor anterior sin correspondencia: Primario",
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No equivale automáticamente a un tipo de educación",
    );

    fireEvent.click(screen.getByRole("button", { name: "Guardar colegio" }));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Elegí un tipo de educación del catálogo oficial antes de guardar el colegio.",
        ),
      ).toBeVisible(),
    );
    expect(adminSchoolsService.updateAndRectify).not.toHaveBeenCalled();

    selectOption("Tipo de educación *", "Común");
    const normalizedNotice = screen.getByRole("status");
    expect(normalizedNotice).toHaveTextContent(
      "La opción oficial seleccionada se aplicará al guardar",
    );
    expect(normalizedNotice).toHaveTextContent(
      "Valor anterior sin correspondencia: Primario",
    );

    fireEvent.click(screen.getByRole("button", { name: "Guardar colegio" }));
    await waitFor(() =>
      expect(adminSchoolsService.updateAndRectify).toHaveBeenCalledWith(
        "school-1",
        expect.objectContaining({ educationLevel: "Común" }),
      ),
    );
  });

  it("preserva matrícula nula y permite limpiar cargos y características", async () => {
    renderPage("/admin/colegios/school-1/editar");

    expect(await screen.findByLabelText("Matrícula total")).toHaveValue(null);
    for (const cargo of screen.getAllByLabelText("Cargo")) {
      fireEvent.change(cargo, { target: { value: "" } });
    }
    for (const groupName of ["Plurogrado", "Intercultural y Bilingüe"]) {
      fireEvent.click(
        within(screen.getByRole("group", { name: groupName })).getByRole(
          "radio",
          { name: "Sin informar" },
        ),
      );
    }

    fireEvent.click(screen.getByRole("button", { name: "Guardar colegio" }));

    await waitFor(() =>
      expect(adminSchoolsService.updateAndRectify).toHaveBeenCalled(),
    );
    expect(adminSchoolsService.updateAndRectify).toHaveBeenCalledWith(
      "school-1",
      expect.objectContaining({
        enrollment: null,
        characteristics: {
          isMultigrade: null,
          isInterculturalBilingual: null,
        },
        contacts: [
          expect.objectContaining({ type: "RESPONDENT", position: null }),
        ],
      }),
    );
    expect(adminSchoolsService.update).not.toHaveBeenCalled();
  });

  it("mantiene el alta mediante create y permite definir el estado inicial", async () => {
    renderPage();

    const names = await screen.findAllByLabelText("Nombre *");
    fireEvent.change(screen.getByLabelText("CUE *"), {
      target: { value: "500099900" },
    });
    fireEvent.change(names[0], { target: { value: "Escuela Nueva" } });
    fireEvent.change(screen.getByLabelText("Director/a *"), {
      target: { value: "María Gómez" },
    });
    fireEvent.change(screen.getByLabelText("Departamento *"), {
      target: { value: "Capital" },
    });
    fireEvent.change(screen.getByLabelText("Localidad *"), {
      target: { value: "Mendoza" },
    });
    fireEvent.change(screen.getByLabelText("Dirección *"), {
      target: { value: "San Martín 20" },
    });
    selectOption("Sector / gestión *", "Estatal");
    selectOption("Ámbito *", "Urbano");
    selectOption("Tipo de educación *", "Común");
    selectOption("Jornada *", "Jornada completa");
    fireEvent.click(screen.getByRole("checkbox", { name: "Primario" }));
    fireEvent.click(
      within(screen.getByRole("group", { name: "¿Tiene kiosco? *" })).getByRole(
        "radio",
        { name: "Sí" },
      ),
    );
    fireEvent.click(
      within(
        screen.getByRole("group", {
          name: "¿Tiene comedor o servicio alimentario? *",
        }),
      ).getByRole("radio", { name: "No" }),
    );
    fireEvent.change(names[1], { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Apellido *"), {
      target: { value: "Pérez" },
    });
    fireEvent.change(screen.getByLabelText("Correo *"), {
      target: { value: "ana@escuela.edu.ar" },
    });

    expect(
      screen.getByRole("checkbox", { name: "Colegio activo" }),
    ).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Guardar colegio" }));

    await waitFor(() => expect(adminSchoolsService.create).toHaveBeenCalled());
    expect(adminSchoolsService.create).toHaveBeenCalledTimes(1);
    expect(adminSchoolsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: true }),
    );
    expect(adminSchoolsService.updateAndRectify).not.toHaveBeenCalled();
    expect(adminSchoolsService.update).not.toHaveBeenCalled();
  });
});

function selectOption(label: string, option: string) {
  fireEvent.click(screen.getByRole("button", { name: label }));
  fireEvent.click(screen.getByRole("option", { name: option }));
}
