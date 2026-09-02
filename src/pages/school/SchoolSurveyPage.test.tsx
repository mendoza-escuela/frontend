// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createMemoryRouter, Link, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { schoolCampaignsService } from "../../services/school-campaigns.service";
import type {
  AvailableSchoolCampaign,
  AvailableSchoolCampaignsResponse,
  SchoolSubmissionWorkspace,
} from "../../types/school-campaign";
import type { QuestionnaireFormValues } from "../../types/survey";
import { SchoolSurveyPage } from "./SchoolSurveyPage";

type QuestionnaireMockProps = {
  readOnly?: boolean;
  disabled?: boolean;
  defaultValues?: QuestionnaireFormValues;
  submitDisabledReason?: string;
  onSaveDraft?: (
    values: QuestionnaireFormValues,
    expectedRevision: number,
  ) => Promise<{
    revision: number;
    lastSavedAt: string | null;
    authoritativeChanged?: boolean;
  }>;
  onSubmit?: (
    values: QuestionnaireFormValues,
    revision: number,
  ) => void | Promise<void>;
};

let latestQuestionnaireProps: QuestionnaireMockProps | null = null;

const questionnaireControl = vi.hoisted(() => ({
  hasPendingChanges: false,
  flushDraft: vi.fn<() => Promise<number>>(),
}));

vi.mock("../../services/school-campaigns.service", () => ({
  schoolCampaignsService: {
    list: vi.fn(),
    start: vi.fn(),
    workspace: vi.fn(),
    saveDraft: vi.fn(),
    submit: vi.fn(),
  },
}));

vi.mock("../../components/surveys/QuestionnaireRenderer", async () => {
  const { forwardRef, useEffect, useImperativeHandle } =
    await vi.importActual<typeof import("react")>("react");
  return {
    QuestionnaireRenderer: forwardRef(function QuestionnaireRendererMock(
      props: QuestionnaireMockProps,
      ref,
    ) {
      useEffect(() => {
        latestQuestionnaireProps = props;
      }, [props]);
      useImperativeHandle(ref, () => ({
        flushDraft: questionnaireControl.flushDraft,
        hasPendingChanges: () => questionnaireControl.hasPendingChanges,
      }));
      return (
        <div>
          <div data-testid="questionnaire-mode">
            {props.readOnly
              ? "Cuestionario bloqueado"
              : "Cuestionario editable"}
            {props.submitDisabledReason && (
              <span>{props.submitDisabledReason}</span>
            )}
          </div>
          <input
            aria-label="Respuesta de prueba"
            disabled={props.disabled || props.readOnly}
          />
        </div>
      );
    }),
  };
});

describe("SchoolSurveyPage expired drafts", () => {
  beforeEach(() => {
    latestQuestionnaireProps = null;
    questionnaireControl.hasPendingChanges = false;
    questionnaireControl.flushDraft.mockResolvedValue(0);
    vi.mocked(schoolCampaignsService.list).mockResolvedValue(campaignsFixture);
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
        campaignId === activeCampaign.id ? activeIncomplete : expiredIncomplete,
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

  it("muestra una etapa simultáneamente activa pero bloqueada por el orden", async () => {
    const lockedCampaign: AvailableSchoolCampaign = {
      ...activeCampaign,
      workflowCycle: "Programa 2026",
      sequenceOrder: 2,
      workflowStatus: "locked",
      canStart: false,
      blockedBy: {
        id: "campaign-previous",
        name: "Diagnóstico inicial",
        sequenceOrder: 1,
      },
      blockingReason:
        "Antes de continuar debés enviar la etapa anterior: Diagnóstico inicial.",
      submission: null,
    };
    vi.mocked(schoolCampaignsService.list).mockResolvedValue({
      ...campaignsFixture,
      items: [lockedCampaign],
      expiredDrafts: [],
    });

    renderPage();

    expect(await screen.findByText("Bloqueada")).toBeVisible();
    expect(screen.getByText(/Diagnóstico inicial/)).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Comenzar evaluación" }),
    ).toBeDisabled();
    expect(schoolCampaignsService.start).not.toHaveBeenCalled();
  });

  it("no ofrece rectificar una ficha lista cuando la versión de la etapa es incompatible", async () => {
    const incompatibleCampaign: AvailableSchoolCampaign = {
      ...activeCampaign,
      workflowStatus: "locked",
      canStart: false,
      blockedBy: null,
      blockingReason:
        "La versión publicada de esta etapa no es compatible con la evaluación institucional.",
      submission: null,
    };
    vi.mocked(schoolCampaignsService.list).mockResolvedValue({
      ...campaignsFixture,
      items: [incompatibleCampaign],
      expiredDrafts: [],
    });

    renderPage();

    expect(await screen.findByText("Bloqueada")).toBeVisible();
    expect(screen.getByText(/no es compatible/)).toBeVisible();
    expect(
      screen.queryByRole("link", { name: /Rectificar ficha/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Comenzar evaluación" }),
    ).toBeDisabled();
  });

  it("usa el desplegable reutilizable para cambiar entre etapas", async () => {
    const firstCampaign: AvailableSchoolCampaign = {
      ...activeCampaign,
      id: "campaign-first",
      name: "Diagnóstico inicial",
      workflowCycle: "Recorrido 2026",
      sequenceOrder: 1,
      submission: null,
    };
    const secondCampaign: AvailableSchoolCampaign = {
      ...firstCampaign,
      id: "campaign-second",
      name: "Plan de mejora",
      sequenceOrder: 2,
    };
    vi.mocked(schoolCampaignsService.list).mockResolvedValue({
      ...campaignsFixture,
      items: [firstCampaign, secondCampaign],
      expiredDrafts: [],
    });

    renderPage();

    const selector = await screen.findByRole("button", { name: "Etapa" });
    expect(selector).toHaveTextContent("1. Diagnóstico inicial");
    fireEvent.click(selector);
    expect(
      screen.getByRole("combobox", { name: "Buscar en Etapa" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("option", { name: "2. Plan de mejora" }));

    await waitFor(() =>
      expect(selector).toHaveTextContent("2. Plan de mejora"),
    );
    expect(
      screen.getByRole("heading", { name: "Plan de mejora" }),
    ).toBeVisible();
  });

  it("espera el flush antes de completar una navegación SPA", async () => {
    let resolveFlush!: (revision: number) => void;
    questionnaireControl.hasPendingChanges = true;
    questionnaireControl.flushDraft.mockReturnValue(
      new Promise<number>((resolve) => {
        resolveFlush = resolve;
      }),
    );
    vi.mocked(schoolCampaignsService.list).mockResolvedValue({
      ...campaignsFixture,
      items: [activeCampaign],
    });
    vi.mocked(schoolCampaignsService.workspace).mockResolvedValue(
      activeWorkspaceFixture,
    );
    const router = createMemoryRouter([
      {
        path: "/",
        element: (
          <>
            <Link to="/destino">Salir del cuestionario</Link>
            <SchoolSurveyPage />
          </>
        ),
      },
      { path: "/destino", element: <p>Pantalla destino</p> },
    ]);
    render(<RouterProvider router={router} />);
    expect(await screen.findByText("Cuestionario editable")).toBeVisible();

    fireEvent.click(
      screen.getByRole("link", { name: "Salir del cuestionario" }),
    );

    await waitFor(() =>
      expect(questionnaireControl.flushDraft).toHaveBeenCalledOnce(),
    );
    expect(router.state.location.pathname).toBe("/");

    questionnaireControl.hasPendingChanges = false;
    resolveFlush(1);
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/destino"),
    );
  });

  it("vuelve a drenar el borrador inmediatamente antes del envío confirmado", async () => {
    questionnaireControl.flushDraft.mockResolvedValue(4);
    vi.mocked(schoolCampaignsService.list).mockResolvedValue({
      ...campaignsFixture,
      items: [activeCampaign],
    });
    vi.mocked(schoolCampaignsService.workspace).mockResolvedValue(
      activeWorkspaceFixture,
    );
    vi.mocked(schoolCampaignsService.submit).mockResolvedValue({
      ...activeWorkspaceFixture,
      submission: {
        ...activeWorkspaceFixture.submission,
        status: "submitted",
        revision: 5,
        editable: false,
        canSubmit: false,
      },
    });
    renderPage();
    expect(await screen.findByText("Cuestionario editable")).toBeVisible();

    await act(async () => {
      await latestQuestionnaireProps!.onSubmit!({}, 3);
    });
    const confirmButton = screen.getByRole("button", {
      name: "Enviar presentación",
    });
    fireEvent.click(confirmButton);
    fireEvent.click(confirmButton);

    await waitFor(() =>
      expect(schoolCampaignsService.submit).toHaveBeenCalledWith(
        activeCampaign.id,
        4,
      ),
    );
    expect(schoolCampaignsService.submit).toHaveBeenCalledOnce();
    expect(questionnaireControl.flushDraft).toHaveBeenCalledOnce();
  });

  it("mantiene bloqueados el diálogo y el cuestionario durante el POST final", async () => {
    let resolveSubmission!: (workspace: SchoolSubmissionWorkspace) => void;
    questionnaireControl.flushDraft.mockResolvedValue(4);
    vi.mocked(schoolCampaignsService.list).mockResolvedValue({
      ...campaignsFixture,
      items: [activeCampaign],
    });
    vi.mocked(schoolCampaignsService.workspace).mockResolvedValue(
      activeWorkspaceFixture,
    );
    vi.mocked(schoolCampaignsService.submit).mockReturnValue(
      new Promise<SchoolSubmissionWorkspace>((resolve) => {
        resolveSubmission = resolve;
      }),
    );
    const { router } = renderPage();
    expect(await screen.findByText("Cuestionario editable")).toBeVisible();

    await act(async () => {
      await latestQuestionnaireProps!.onSubmit!({}, 3);
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar presentación" }),
    );

    await waitFor(() =>
      expect(schoolCampaignsService.submit).toHaveBeenCalledWith(
        activeCampaign.id,
        4,
      ),
    );
    const dialog = screen.getByRole("dialog", {
      name: "¿Confirmar el envío definitivo?",
    });
    expect(screen.getByLabelText("Respuesta de prueba")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cerrar" })).toBeDisabled();

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.mouseDown(dialog);
    expect(dialog).toBeVisible();

    act(() => {
      void router.navigate("/destino");
    });
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));

    await act(async () => {
      resolveSubmission({
        ...activeWorkspaceFixture,
        submission: {
          ...activeWorkspaceFixture.submission,
          status: "submitted",
          revision: 5,
          editable: false,
          canSubmit: false,
        },
      });
      await Promise.resolve();
    });

    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  });

  it("permite cancelar y volver a editar si falla el POST final", async () => {
    let rejectSubmission!: (reason: unknown) => void;
    questionnaireControl.flushDraft.mockResolvedValue(4);
    vi.mocked(schoolCampaignsService.list).mockResolvedValue({
      ...campaignsFixture,
      items: [activeCampaign],
    });
    vi.mocked(schoolCampaignsService.workspace).mockResolvedValue(
      activeWorkspaceFixture,
    );
    vi.mocked(schoolCampaignsService.submit).mockReturnValue(
      new Promise<SchoolSubmissionWorkspace>((_resolve, reject) => {
        rejectSubmission = reject;
      }),
    );
    renderPage();
    expect(await screen.findByText("Cuestionario editable")).toBeVisible();

    await act(async () => {
      await latestQuestionnaireProps!.onSubmit!({}, 3);
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar presentación" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled(),
    );

    await act(async () => {
      rejectSubmission(new Error("No se pudo completar el envío."));
      await Promise.resolve();
    });

    const cancelButton = await screen.findByRole("button", {
      name: "Cancelar",
    });
    await waitFor(() => expect(cancelButton).toBeEnabled());
    expect(screen.getByLabelText("Respuesta de prueba")).toBeDisabled();
    fireEvent.click(cancelButton);
    expect(screen.getByLabelText("Respuesta de prueba")).toBeEnabled();
  });

  it("adopta un cambio autoritativo de aplicabilidad sin reponer respuestas viejas", async () => {
    vi.mocked(schoolCampaignsService.list).mockResolvedValue({
      ...campaignsFixture,
      items: [activeCampaign],
    });
    vi.mocked(schoolCampaignsService.workspace).mockResolvedValue(
      activeWorkspaceFixture,
    );
    const questionId = "question-after-refresh";
    const changedWorkspace: SchoolSubmissionWorkspace = {
      ...activeWorkspaceFixture,
      submission: {
        ...activeWorkspaceFixture.submission,
        revision: 3,
        lastSavedAt: "2026-09-01T13:00:00.000Z",
      },
      answers: { [questionId]: "respuesta anterior del servidor" },
      applicability: {
        ...activeWorkspaceFixture.applicability,
        status: "incomplete",
        missingFields: [{ code: "has_kiosk", label: "Kiosco" }],
      },
      survey: {
        ...activeWorkspaceFixture.survey,
        version: {
          ...activeWorkspaceFixture.survey.version,
          title: "Contrato autoritativo actualizado",
          dimensions: [
            {
              ...activeWorkspaceFixture.survey.version.dimensions[0],
              sections: [
                {
                  id: "section-after-refresh",
                  code: "actualizada",
                  title: "Sección actualizada",
                  description: null,
                  order: 1,
                  questions: [
                    {
                      id: questionId,
                      code: "p001",
                      type: "short_text",
                      prompt: "Respuesta actualizada",
                      helpText: null,
                      required: false,
                      order: 1,
                      validation: {},
                      options: [],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    };
    vi.mocked(schoolCampaignsService.saveDraft)
      .mockResolvedValueOnce(changedWorkspace)
      .mockResolvedValueOnce({
        ...changedWorkspace,
        submission: { ...changedWorkspace.submission, revision: 4 },
      });
    renderPage();
    expect(await screen.findByText("Cuestionario editable")).toBeVisible();
    const localValues = { [questionId]: "edición local más nueva" };

    let saved:
      | {
          revision: number;
          lastSavedAt: string | null;
          authoritativeChanged?: boolean;
        }
      | undefined;
    await act(async () => {
      saved = await latestQuestionnaireProps!.onSaveDraft!(localValues, 2);
    });

    expect(saved).toMatchObject({
      revision: 3,
      authoritativeChanged: true,
    });
    expect(
      await screen.findByText("Completá la ficha escolar antes de enviar."),
    ).toBeVisible();
    expect(latestQuestionnaireProps?.defaultValues).toMatchObject(localValues);

    await act(async () => {
      await latestQuestionnaireProps!.onSaveDraft!(
        { [questionId]: "edición posterior al refresco" },
        3,
      );
    });
    expect(schoolCampaignsService.saveDraft).toHaveBeenNthCalledWith(
      2,
      activeCampaign.id,
      [
        {
          questionId,
          value: "edición posterior al refresco",
        },
      ],
      3,
    );
  });
});

function renderPage() {
  const router = createMemoryRouter([
    { path: "/", element: <SchoolSurveyPage /> },
    { path: "/destino", element: <p>Pantalla destino</p> },
  ]);
  return { ...render(<RouterProvider router={router} />), router };
}

const expiredCampaign: AvailableSchoolCampaign = {
  id: "campaign-expired",
  name: "Etapa finalizada 2025",
  description: "Etapa conservada como antecedente.",
  type: "annual",
  status: "closed",
  workflowCycle: null,
  sequenceOrder: null,
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
  workflowStatus: "available",
  blockedBy: null,
  blockingReason:
    "La etapa finalizó. El borrador está disponible en sólo lectura.",
  submission: {
    id: "submission-expired",
    status: "draft",
    startedAt: "2025-04-01T12:00:00.000Z",
    lastSavedAt: "2025-11-30T15:30:00.000Z",
    revision: 2,
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
    revision: 2,
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
