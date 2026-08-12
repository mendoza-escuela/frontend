// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import type { SchoolDetail } from "../../types/admin-school";
import { SchoolCampaignActivity } from "./SchoolCampaignActivity";

const campaigns: SchoolDetail["campaigns"] = {
  available: true,
  message: "",
  items: [
    {
      assignment: {
        id: "assignment-1",
        source: "manual",
        assignedAt: "2026-03-01T12:00:00.000Z",
      },
      campaign: {
        id: "campaign-1",
        name: "Campaña anual 2026",
        type: "annual",
        status: "closed",
        startsAt: "2026-03-01T03:00:00.000Z",
        endsAt: "2026-08-01T03:00:00.000Z",
      },
      participationStatus: "submitted",
      submission: {
        id: "submission-1",
        status: "submitted",
        startedAt: "2026-03-02T12:00:00.000Z",
        lastSavedAt: "2026-03-04T12:00:00.000Z",
        submittedAt: "2026-03-05T12:00:00.000Z",
      },
      result: {
        available: true,
        id: "result-1",
        calculatedAt: "2026-03-05T12:01:00.000Z",
      },
    },
    {
      assignment: {
        id: "assignment-2",
        source: "filter",
        assignedAt: "2026-04-01T12:00:00.000Z",
      },
      campaign: {
        id: "campaign-2",
        name: "Campaña semestral",
        type: "semiannual",
        status: "active",
        startsAt: "2026-04-01T03:00:00.000Z",
        endsAt: "2026-09-01T03:00:00.000Z",
      },
      participationStatus: "draft",
      submission: {
        id: "submission-2",
        status: "draft",
        startedAt: "2026-04-02T12:00:00.000Z",
        lastSavedAt: "2026-04-03T12:00:00.000Z",
        submittedAt: null,
      },
      result: { available: false, id: null, calculatedAt: null },
    },
  ],
};

const evaluations: SchoolDetail["evaluations"] = {
  available: true,
  message: "",
  items: [
    {
      id: "result-1",
      campaignId: "campaign-1",
      submissionId: "submission-1",
      calculatedAt: "2026-03-05T12:01:00.000Z",
      generalScore: 82.5,
      stars: 4,
    },
  ],
};

describe("SchoolCampaignActivity", () => {
  afterEach(cleanup);

  it("muestra participación, resultado y enlaces administrativos reales", () => {
    const { container } = renderActivity(campaigns, evaluations);

    expect(screen.getByRole("heading", { name: "Campañas" })).toBeVisible();
    expect(screen.getByText("Enviada")).toBeVisible();
    expect(screen.getByText("Borrador")).toBeVisible();
    expect(screen.getByText("82,5 / 100")).toBeVisible();
    expect(screen.getByText("4 estrellas")).toBeVisible();

    const annualCampaign = screen
      .getAllByRole("heading", { name: "Campaña anual 2026" })[0]
      .closest("li")!;
    expect(
      within(annualCampaign).getByRole("link", { name: "Ver resultado" }),
    ).toHaveAttribute(
      "href",
      "/admin/campanas/campaign-1/colegios/school-1/resultado?volver=%2Fadmin%2Fcolegios%2Fschool-1",
    );
    expect(
      within(annualCampaign).getByRole("link", {
        name: "Ver en seguimiento",
      }),
    ).toHaveAttribute("href", "/admin/seguimiento?campania=campaign-1");

    const draftCampaign = screen
      .getByRole("heading", { name: "Campaña semestral" })
      .closest("li")!;
    expect(
      within(draftCampaign).getByRole("link", { name: "Ver detalle" }),
    ).toHaveAttribute(
      "href",
      "/admin/campanas/campaign-2/colegios/school-1/resultado?volver=%2Fadmin%2Fcolegios%2Fschool-1",
    );
    expect(container.firstElementChild).toHaveClass("grid", "xl:grid-cols-2");
  });

  it("distingue colecciones vacías de módulos no disponibles", () => {
    renderActivity(
      {
        available: true,
        message: "El colegio no tiene asignaciones de campaña vigentes.",
        items: [],
      },
      {
        available: false,
        items: [],
        message: "No se pudo consultar el historial de evaluaciones.",
      },
    );

    expect(
      screen.getByText("El colegio no tiene asignaciones de campaña vigentes."),
    ).toBeVisible();
    expect(
      screen.getByText("No se pudo consultar el historial de evaluaciones."),
    ).toBeVisible();
  });

  it("no convierte un puntaje histórico ausente en cero", () => {
    renderActivity(
      { available: true, message: "", items: [] },
      {
        available: true,
        message: "",
        items: [
          {
            id: "legacy-result",
            campaignId: "legacy-campaign",
            submissionId: "legacy-submission",
            calculatedAt: null,
            generalScore: null,
            stars: null,
          },
        ],
      },
    );

    expect(screen.getByText("Puntaje no disponible")).toBeVisible();
    expect(screen.queryByText("0 / 100")).not.toBeInTheDocument();
    expect(screen.getByText("Calculada el —")).toBeVisible();
  });
});

function renderActivity(
  campaignData: SchoolDetail["campaigns"],
  evaluationData: SchoolDetail["evaluations"],
) {
  return render(
    <MemoryRouter>
      <SchoolCampaignActivity
        campaigns={campaignData}
        evaluations={evaluationData}
        schoolId="school-1"
      />
    </MemoryRouter>,
  );
}
