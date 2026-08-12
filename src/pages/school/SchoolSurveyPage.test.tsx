// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { schoolCampaignsService } from "../../services/school-campaigns.service";
import type {
  AvailableSchoolCampaign,
  AvailableSchoolCampaignsResponse,
  SchoolSubmissionWorkspace,
} from "../../types/school-campaign";
import { SchoolSurveyPage } from "./SchoolSurveyPage";

vi.mock("../../services/school-campaigns.service", () => ({
  schoolCampaignsService: {
    list: vi.fn(),
    start: vi.fn(),
    workspace: vi.fn(),
    saveDraft: vi.fn(),
    submit: vi.fn(),
  },
}));

vi.mock("../../components/surveys/QuestionnaireRenderer", () => ({
  QuestionnaireRenderer: ({ readOnly }: { readOnly?: boolean }) => (
    <div data-testid="questionnaire-mode">
      {readOnly ? "Cuestionario bloqueado" : "Cuestionario editable"}
    </div>
  ),
}));

describe("SchoolSurveyPage expired drafts", () => {
  beforeEach(() => {
    vi.mocked(schoolCampaignsService.list).mockResolvedValue(
      campaignsFixture,
    );
    vi.mocked(schoolCampaignsService.workspace).mockResolvedValue(
      workspaceFixture,
    );
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("keeps expired drafts discoverable when there are no open campaigns", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "No hay etapas abiertas" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Borradores vencidos" }),
    ).toBeVisible();
    expect(screen.getByText("Etapa finalizada 2025")).toBeVisible();
    expect(screen.getByText("18/30 respuestas (60%)")).toBeVisible();
    expect(screen.getByText("Vencida · sólo lectura")).toBeVisible();
    expect(
      screen.getByRole("progressbar", {
        name: "60% del borrador completado",
      }),
    ).toHaveAttribute("aria-valuenow", "60");
  });

  it("opens an expired draft through GET only and renders it read-only", async () => {
    renderPage();

    fireEvent.click(
      await screen.findByRole("button", { name: "Ver en solo lectura" }),
    );

    await waitFor(() =>
      expect(schoolCampaignsService.workspace).toHaveBeenCalledWith(
        expiredCampaign.id,
      ),
    );
    expect(schoolCampaignsService.start).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("heading", { name: "Vista de sólo lectura" }),
    ).toBeVisible();
    expect(screen.getByTestId("questionnaire-mode")).toHaveTextContent(
      "Cuestionario bloqueado",
    );
    expect(schoolCampaignsService.saveDraft).not.toHaveBeenCalled();
    expect(schoolCampaignsService.submit).not.toHaveBeenCalled();
  });

  it("closes the active questionnaire before showing the historical one", async () => {
    vi.mocked(schoolCampaignsService.list).mockResolvedValue({
      ...campaignsFixture,
      items: [activeCampaign],
    });
    vi.mocked(schoolCampaignsService.workspace).mockImplementation(
      async (campaignId) =>
        campaignId === activeCampaign.id
          ? activeWorkspaceFixture
          : workspaceFixture,
    );

    renderPage();

    expect(await screen.findByText("Cuestionario editable")).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Ver en solo lectura" }),
    );

    expect(await screen.findByText("Cuestionario bloqueado")).toBeVisible();
    expect(screen.getAllByTestId("questionnaire-mode")).toHaveLength(1);
    expect(schoolCampaignsService.start).not.toHaveBeenCalled();
  });

  it("distingue datos incompletos activos de un snapshot histórico incompleto", async () => {
    const missingFields = [{ code: "hasKiosk", label: "Kiosco" }];
    const activeIncomplete: SchoolSubmissionWorkspace = {
      ...activeWorkspaceFixture,
      applicability: {
        ...activeWorkspaceFixture.applicability,
        status: "incomplete",
        missingFields,
      },
    };
    const expiredIncomplete: SchoolSubmissionWorkspace = {
      ...workspaceFixture,
      applicability: {
        ...workspaceFixture.applicability,
        status: "incomplete",
        missingFields,
      },
    };
    vi.mocked(schoolCampaignsService.list).mockResolvedValue({
      ...campaignsFixture,
      items: [activeCampaign],
    });
    vi.mocked(schoolCampaignsService.workspace).mockImplementation(
      async (campaignId) =>
        campaignId === activeCampaign.id
          ? activeIncomplete
          : expiredIncomplete,
    );

    renderPage();

    expect(
      await screen.findByRole("heading", {
        name: "Faltan datos en la ficha escolar",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Ir a la rectificación escolar" }),
    ).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: "Ver en solo lectura" }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "El borrador quedó con datos escolares incompletos",
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Ir a la rectificación escolar" }),
    ).not.toBeInTheDocument();
  });
});

function renderPage() {
  return render(
    <MemoryRouter>
      <SchoolSurveyPage />
    </MemoryRouter>,
  );
}

const expiredCampaign: AvailableSchoolCampaign = {
  id: "campaign-expired",
  name: "Etapa finalizada 2025",
  description: "Etapa conservada como antecedente.",
  type: "annual",
  status: "closed",
  startsAt: "2025-03-01T03:00:00.000Z",
  endsAt: "2025-12-01T02:59:59.999Z",
  surveyVersion: {
    id: "version-1",
    versionNumber: 1,
    title: "Versión 1",
    survey: {
      code: "institucional",
      name: "Cuestionario institucional",
    },
  },
  canStart: false,
  blockingReason:
    "La etapa finalizó. El borrador está disponible en sólo lectura.",
  submission: {
    id: "submission-expired",
    status: "draft",
    startedAt: "2025-04-01T12:00:00.000Z",
    lastSavedAt: "2025-11-30T15:30:00.000Z",
    submittedAt: null,
    progress: {
      answered: 18,
      total: 30,
      percentage: 60,
    },
  },
};

const activeCampaign: AvailableSchoolCampaign = {
  ...expiredCampaign,
  id: "campaign-active",
  name: "Etapa abierta 2026",
  status: "active",
  startsAt: "2026-03-01T03:00:00.000Z",
  endsAt: "2026-12-01T02:59:59.999Z",
  canStart: true,
  blockingReason: null,
  submission: {
    ...expiredCampaign.submission!,
    id: "submission-active",
    lastSavedAt: "2026-08-10T15:30:00.000Z",
  },
};

const campaignsFixture: AvailableSchoolCampaignsResponse = {
  school: {
    id: "school-1",
    cue: "500000001",
    name: "Escuela histórica",
    isActive: true,
  },
  rectification: {
    periodYear: 2026,
    isConfirmed: true,
    isEvaluationReady: true,
    missingFields: [],
    isRectified: true,
    rectifiedAt: "2026-03-01T12:00:00.000Z",
  },
  items: [],
  expiredDrafts: [expiredCampaign],
};

const workspaceFixture: SchoolSubmissionWorkspace = {
  campaign: expiredCampaign,
  submission: {
    id: "submission-expired",
    status: "draft",
    startedAt: "2025-04-01T12:00:00.000Z",
    lastSavedAt: "2025-11-30T15:30:00.000Z",
    submittedAt: null,
    originalRespondent: {
      id: "user-1",
      firstName: "Ana",
      lastName: "Pérez",
      email: "ana@example.com",
    },
    editable: false,
    canSubmit: false,
    blockingReason:
      "La etapa finalizó. El borrador está disponible en sólo lectura.",
    progress: {
      answered: 18,
      total: 30,
      percentage: 60,
    },
  },
  applicability: {
    status: "ready",
    source: "persisted",
    evaluatedAt: "2025-11-30T15:30:00.000Z",
    missingFields: [],
    excluded: [],
    incomplete: [],
  },
  answers: {},
  survey: {
    code: "institucional",
    name: "Cuestionario institucional",
    description: null,
    version: {
      id: "version-1",
      versionNumber: 1,
      title: "Versión 1",
      instructions: null,
      publishedAt: "2025-02-01T12:00:00.000Z",
      dimensions: [
        {
          id: "dimension-1",
          code: "dimension-1",
          title: "Dimensión 1",
          description: null,
          order: 1,
          sections: [],
        },
      ],
    },
  },
};

const activeWorkspaceFixture: SchoolSubmissionWorkspace = {
  ...workspaceFixture,
  campaign: activeCampaign,
  submission: {
    ...workspaceFixture.submission,
    id: "submission-active",
    lastSavedAt: "2026-08-10T15:30:00.000Z",
    editable: true,
    canSubmit: true,
    blockingReason: null,
  },
};
