// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminCampaignsService } from "../../services/admin-campaigns.service";
import { adminSchoolsService } from "../../services/admin-schools.service";
import type {
  AdminCampaign,
  CampaignSchoolAssignment,
} from "../../types/admin-campaign";
import { CampaignSchoolsPage } from "./CampaignSchoolsPage";

vi.mock("../../services/admin-campaigns.service", () => ({
  adminCampaignsService: {
    findOne: vi.fn(),
    schoolOptions: vi.fn(),
    assignedSchools: vi.fn(),
    previewSchools: vi.fn(),
    assignSchools: vi.fn(),
    removeSchool: vi.fn(),
  },
}));

vi.mock("../../services/admin-schools.service", () => ({
  adminSchoolsService: { filters: vi.fn() },
}));

describe("CampaignSchoolsPage", () => {
  beforeEach(() => {
    vi.mocked(adminCampaignsService.findOne).mockResolvedValue(activeCampaign);
    vi.mocked(adminCampaignsService.schoolOptions).mockResolvedValue({
      items: [availableSchool],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      summary: { matched: 1, assigned: 0, unassigned: 1 },
    });
    vi.mocked(adminCampaignsService.assignedSchools).mockResolvedValue({
      items: [assignedSchool],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    vi.mocked(adminCampaignsService.previewSchools).mockResolvedValue({
      matched: 1,
      alreadyAssigned: 0,
      willAssign: 1,
      message: "Se asignará 1 escuela.",
    });
    vi.mocked(adminCampaignsService.assignSchools).mockResolvedValue({
      matched: 1,
      assigned: 1,
      summary: { assigned: 2, removed: 0 },
    });
    vi.mocked(adminSchoolsService.filters).mockResolvedValue({
      departments: ["Capital"],
      localities: ["Ciudad"],
      educationLevels: ["Primario"],
      managementTypes: ["Estatal"],
      scopes: ["Urbano"],
      shifts: ["Mañana"],
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("no repite la carga completa cuando recibe los catálogos de filtros", async () => {
    renderPage();

    expect(await screen.findByText("Activa · admite incorporaciones")).toBeVisible();
    await waitFor(() => {
      expect(adminCampaignsService.findOne).toHaveBeenCalledTimes(1);
      expect(adminCampaignsService.schoolOptions).toHaveBeenCalledTimes(1);
      expect(adminCampaignsService.assignedSchools).toHaveBeenCalledTimes(1);
      expect(adminSchoolsService.filters).toHaveBeenCalledTimes(1);
    });
  });

  it("permite incorporar una escuela durante una etapa activa con confirmación explícita", async () => {
    vi.mocked(adminCampaignsService.schoolOptions).mockResolvedValue({
      items: [availableSchool, inactiveSchool],
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      summary: { matched: 2, assigned: 0, unassigned: 2 },
    });
    renderPage();

    expect(
      await screen.findByText("Activa · admite incorporaciones"),
    ).toBeVisible();
    expect(
      screen.getByText(/incorporación durante etapa activa/i),
    ).toBeVisible();

    const assignButton = screen.getByRole("button", {
      name: "Asignar selección (0)",
    });
    expect(assignButton).toBeDisabled();
    expect(
      screen.getByLabelText("Seleccionar Escuela Inactiva"),
    ).toBeDisabled();

    fireEvent.click(screen.getByLabelText("Seleccionar Escuela Nueva"));
    fireEvent.click(
      screen.getByRole("button", { name: "Asignar selección (1)" }),
    );

    await waitFor(() =>
      expect(adminCampaignsService.previewSchools).toHaveBeenCalledWith(
        activeCampaign.id,
        { source: "manual", schoolIds: [availableSchool.id] },
      ),
    );
    expect(
      await screen.findByRole("heading", {
        name: "¿Aplicar selección de escuelas?",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(/se incorporarán inmediatamente a la etapa activa/i),
    ).toBeVisible();
    expect(
      screen.getAllByText(/demás requisitos vigentes/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/registrada para auditoría/i)).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar asignación" }),
    );
    await waitFor(() =>
      expect(adminCampaignsService.assignSchools).toHaveBeenCalledWith(
        activeCampaign.id,
        { source: "manual", schoolIds: [availableSchool.id] },
      ),
    );
  });

  it("muestra la fecha y el origen de cada incorporación", async () => {
    const { container } = renderPage();

    expect(
      await screen.findByText(/incorporación por filtros/i),
    ).toBeVisible();
    expect(
      container.querySelector(
        `time[datetime="${assignedSchool.assignedAt}"]`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Quitar Escuela Incorporada" }),
    ).not.toBeInTheDocument();
  });

  it("mantiene cerradas y archivadas en modo de sólo lectura", async () => {
    vi.mocked(adminCampaignsService.findOne).mockResolvedValue({
      ...activeCampaign,
      status: "closed",
      closedAt: "2026-08-01T03:00:00.000Z",
    });

    renderPage();

    expect(await screen.findByText("Sólo lectura")).toBeVisible();
    expect(screen.queryByLabelText("Buscar por nombre o CUE")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Asignar selección/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Quitar Escuela Incorporada" }),
    ).not.toBeInTheDocument();
  });

  it("conserva la baja de asignaciones únicamente para el borrador", async () => {
    vi.mocked(adminCampaignsService.findOne).mockResolvedValue({
      ...activeCampaign,
      status: "draft",
      activatedAt: null,
    });

    renderPage();

    expect(await screen.findByText("Borrador editable")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Quitar Escuela Incorporada" }),
    ).toBeVisible();
    expect(
      screen.queryByText(/incorporación durante etapa activa/i),
    ).not.toBeInTheDocument();
  });
});

function renderPage() {
  return render(
    <MemoryRouter
      initialEntries={[
        `/admin/campanas/${activeCampaign.id}/escuelas`,
      ]}
    >
      <Routes>
        <Route
          element={<CampaignSchoolsPage />}
          path="/admin/campanas/:id/escuelas"
        />
      </Routes>
    </MemoryRouter>,
  );
}

const activeCampaign: AdminCampaign = {
  id: "campaign-1",
  name: "Etapa 2026",
  description: null,
  type: "annual",
  status: "active",
  workflowCycle: null,
  sequenceOrder: null,
  startDate: "2026-07-01",
  endDate: "2026-08-31",
  startsAt: "2026-07-01T03:00:00.000Z",
  endsAt: "2026-09-01T02:59:59.999Z",
  activatedAt: "2026-07-01T12:00:00.000Z",
  closedAt: null,
  archivedAt: null,
  createdAt: "2026-06-20T12:00:00.000Z",
  updatedAt: "2026-07-01T12:00:00.000Z",
  surveyVersion: {
    id: "version-1",
    versionNumber: 1,
    title: "Versión publicada",
    publishedAt: "2026-06-15T12:00:00.000Z",
    survey: {
      id: "survey-1",
      code: "institucional",
      name: "Cuestionario institucional",
    },
  },
};

const availableSchool = {
  id: "school-new",
  cue: "500000002",
  name: "Escuela Nueva",
  department: "Capital",
  locality: "Ciudad",
  isActive: true,
  assigned: false,
};

const inactiveSchool = {
  ...availableSchool,
  id: "school-inactive",
  cue: "500000003",
  name: "Escuela Inactiva",
  isActive: false,
};

const assignedSchool: CampaignSchoolAssignment = {
  id: "assignment-1",
  assignedAt: "2026-07-10T14:30:00.000Z",
  assignmentSource: "filter",
  school: {
    id: "school-assigned",
    cue: "500000001",
    name: "Escuela Incorporada",
    department: "Capital",
    locality: "Ciudad",
    educationLevel: "Primario",
    managementType: "Estatal",
    scope: "Urbano",
    shift: "Mañana",
    isActive: true,
  },
};
