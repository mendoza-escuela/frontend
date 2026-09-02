// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminCampaignsService } from "../../services/admin-campaigns.service";
import { CampaignFormPage } from "./CampaignFormPage";

vi.mock("../../services/admin-campaigns.service", () => ({
  adminCampaignsService: {
    eligibleSurveyVersions: vi.fn(),
    workflowOptions: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

describe("CampaignFormPage programs", () => {
  beforeEach(() => {
    vi.mocked(adminCampaignsService.eligibleSurveyVersions).mockResolvedValue([
      {
        id: "version-1",
        surveyId: "survey-1",
        surveyCode: "institutional",
        surveyName: "Cuestionario institucional",
        versionNumber: 1,
        versionTitle: "Versión publicada",
        publishedAt: "2026-08-01T12:00:00.000Z",
      },
    ]);
    vi.mocked(adminCampaignsService.workflowOptions).mockResolvedValue([
      { name: "Programa 2026", lastSequenceOrder: 1 },
    ]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("permite elegir un programa existente o comenzar uno nuevo", async () => {
    render(
      <MemoryRouter>
        <CampaignFormPage />
      </MemoryRouter>,
    );

    const selector = await screen.findByRole("button", {
      name: "Recorrido de etapas",
    });
    fireEvent.click(selector);
    fireEvent.click(
      screen.getByRole("option", {
        name: "Programa 2026 · último paso 1",
      }),
    );
    expect(screen.getByLabelText("Nombre del recorrido")).toHaveValue(
      "Programa 2026",
    );
    expect(screen.getByLabelText("Orden dentro del recorrido")).toHaveValue(2);

    fireEvent.click(selector);
    fireEvent.click(
      screen.getByRole("option", { name: "Crear un recorrido nuevo" }),
    );
    expect(selector).toHaveTextContent("Crear un recorrido nuevo");
    expect(screen.getByLabelText("Nombre del recorrido")).toHaveValue("");
    expect(screen.getByLabelText("Orden dentro del recorrido")).toHaveValue(
      null,
    );

    fireEvent.change(screen.getByLabelText("Nombre del recorrido"), {
      target: { value: "Programa especial 2027" },
    });
    expect(selector).toHaveTextContent("Crear un recorrido nuevo");
  });

  it("usa el desplegable reutilizable para seleccionar la versión", async () => {
    render(
      <MemoryRouter>
        <CampaignFormPage />
      </MemoryRouter>,
    );

    const selector = await screen.findByRole("button", {
      name: "Versión del cuestionario",
    });
    expect(selector).toHaveTextContent("Seleccionar versión");

    fireEvent.click(selector);
    expect(
      screen.getByRole("combobox", {
        name: "Buscar en Versión del cuestionario",
      }),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("option", {
        name: "Cuestionario institucional · versión 1 · Versión publicada",
      }),
    );
    expect(selector).toHaveTextContent(
      "Cuestionario institucional · versión 1 · Versión publicada",
    );
    expect(
      screen.getByText(
        "Sólo se muestran versiones institucionales publicadas y evaluables de cuestionarios activos.",
      ),
    ).toBeVisible();
  });

  it("explica por qué una versión genérica publicada no habilita etapas", async () => {
    vi.mocked(
      adminCampaignsService.eligibleSurveyVersions,
    ).mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <CampaignFormPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "No hay versiones institucionales elegibles",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(/Las versiones genéricas pueden publicarse/),
    ).toBeVisible();
  });
});
