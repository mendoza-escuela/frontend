// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminSurveysService } from "../../services/admin-surveys.service";
import { adminUsersService } from "../../services/admin-users.service";
import type {
  AdminSurveyVersion,
  ApplicabilityMetadata,
  ApplicabilityRule,
} from "../../types/admin-survey";
import { SurveyApplicabilityRulesPage } from "./SurveyApplicabilityRulesPage";

vi.mock("../../services/admin-surveys.service", () => ({
  adminSurveysService: {
    findVersion: vi.fn(),
    applicabilityMetadata: vi.fn(),
    listApplicabilityRules: vi.fn(),
    createApplicabilityRule: vi.fn(),
    createApplicabilityRuleBulk: vi.fn(),
    updateApplicabilityRule: vi.fn(),
    removeApplicabilityRule: vi.fn(),
    reorderApplicabilityRules: vi.fn(),
    previewApplicability: vi.fn(),
  },
}));

vi.mock("../../services/admin-users.service", () => ({
  adminUsersService: { schools: vi.fn() },
}));

vi.mock("../../lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

const metadata: ApplicabilityMetadata = {
  features: [
    {
      key: "has_kiosk",
      label: "Tiene kiosco",
      type: "boolean",
      operators: ["equals"],
      allowedValues: [
        { value: true, label: "Sí" },
        { value: false, label: "No" },
      ],
    },
  ],
  operators: [{ key: "equals", label: "Es igual a" }],
  resolution: "Las reglas se aplican en orden.",
};

const previewSchool = {
  id: "school-1",
  cue: "500012300",
  name: "Escuela de prueba",
  isActive: true,
};

const version: AdminSurveyVersion = {
  id: "version-1",
  surveyId: "survey-1",
  versionNumber: 4,
  title: "Diagnóstico institucional",
  instructions: null,
  status: "draft",
  publishedAt: null,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
  profile: "institutional",
  dimensions: [
    {
      id: "dimension-1",
      code: "commitment",
      title: "Compromiso institucional",
      description: null,
      order: 0,
      sections: [
        {
          id: "section-1",
          code: "commitment",
          title: "Compromiso institucional",
          description: null,
          order: 0,
          questions: [
            question(
              "question-1",
              "p001",
              "Acta compromiso: Existe un acta vigente.",
              0,
            ),
            question(
              "question-2",
              "p002",
              "Referente institucional: La escuela cuenta con una persona designada.",
              1,
            ),
            question(
              "question-3",
              "p003",
              "Plan institucional con enfoque de promoción de la salud.",
              2,
            ),
          ],
        },
      ],
    },
  ],
};

const rules: ApplicabilityRule[] = [
  {
    id: "rule-2",
    questionId: "question-2",
    groupOperator: "all",
    action: "omit",
    defaultAction: "omit",
    order: 0,
    conditions: [
      {
        id: "condition-2",
        feature: "has_kiosk",
        operator: "equals",
        expectedValue: true,
        order: 0,
      },
    ],
  },
];

describe("SurveyApplicabilityRulesPage", () => {
  beforeEach(() => {
    vi.mocked(adminSurveysService.findVersion).mockResolvedValue(version);
    vi.mocked(adminSurveysService.applicabilityMetadata).mockResolvedValue(
      metadata,
    );
    vi.mocked(adminSurveysService.listApplicabilityRules).mockResolvedValue(
      rules,
    );
    vi.mocked(adminSurveysService.previewApplicability).mockResolvedValue({
      status: "excluded",
      applicable: false,
      action: "omit",
      matchedRuleId: "rule-2",
      explanation: "La pregunta se omite para esta escuela.",
      missingFeatures: [],
    });
    vi.mocked(adminUsersService.schools).mockResolvedValue({
      items: [previewSchool],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("abre la pregunta enlazada y respeta la acción predeterminada de sus reglas", async () => {
    renderPage("?questionId=question-2");

    expect(
      await screen.findByText(
        "Referente institucional: La escuela cuenta con una persona designada.",
      ),
    ).toBeVisible();
    expect(screen.getByText("Pregunta 2 de 3")).toBeVisible();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Si ninguna regla coincide" }),
      ).toHaveTextContent("Omitir"),
    );
    expect(adminSurveysService.findVersion).toHaveBeenCalledTimes(1);
    expect(adminSurveysService.applicabilityMetadata).toHaveBeenCalledTimes(1);
    expect(adminSurveysService.listApplicabilityRules).toHaveBeenCalledTimes(1);
  });

  it("navega entre preguntas, conserva la URL y no vuelve a cargar la versión", async () => {
    renderPage("?questionId=question-1&vista=compacta");

    expect(await screen.findByText("Pregunta 1 de 3")).toBeVisible();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(await screen.findByText("Pregunta 2 de 3")).toBeVisible();
    await waitFor(() =>
      expect(screen.getByTestId("location-search")).toHaveTextContent(
        "questionId=question-2",
      ),
    );
    expect(screen.getByTestId("location-search")).toHaveTextContent(
      "vista=compacta",
    );
    expect(adminSurveysService.findVersion).toHaveBeenCalledTimes(1);
    expect(adminSurveysService.applicabilityMetadata).toHaveBeenCalledTimes(1);
    expect(adminSurveysService.listApplicabilityRules).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(await screen.findByText("Pregunta 3 de 3")).toBeVisible();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });

  it("abandona la edición y limpia la previsualización al cambiar de pregunta", async () => {
    renderPage("?questionId=question-2");

    fireEvent.click(await screen.findByRole("button", { name: "Editar" }));
    expect(
      screen.getByRole("heading", { name: "Editar esta regla" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Colegio de prueba" }));
    fireEvent.click(
      await screen.findByRole("option", {
        name: "500012300 - Escuela de prueba",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Probar regla" }));
    expect(
      await screen.findByText("La pregunta se omite para esta escuela."),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(
      await screen.findByRole("heading", { name: "Definí una nueva regla" }),
    ).toBeVisible();
    expect(
      screen.queryByText("La pregunta se omite para esta escuela."),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Colegio de prueba" }),
    ).toHaveTextContent("Escuela de prueba");
    expect(
      screen.getByRole("button", { name: "Si ninguna regla coincide" }),
    ).toHaveTextContent("Mostrar");
  });

  it("usa desplegables institucionales en toda la nueva regla", async () => {
    renderPage("?questionId=question-1");

    expect(
      await screen.findByRole("button", {
        name: "Para aplicar la regla deben cumplirse",
      }),
    ).toHaveTextContent("Todas las condiciones");
    expect(screen.getByRole("button", { name: "Entonces" })).toHaveTextContent(
      "Omitir la pregunta",
    );
    expect(
      screen.getByRole("button", { name: "Característica" }),
    ).toHaveTextContent("Tiene kiosco");
    expect(screen.getByRole("button", { name: "Operador" })).toHaveTextContent(
      "Es igual a",
    );
    expect(screen.getByRole("button", { name: "Valor" })).toHaveTextContent(
      "Sí",
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Para aplicar la regla deben cumplirse",
      }),
    );
    fireEvent.click(
      screen.getByRole("option", { name: "Al menos una condición" }),
    );
    expect(
      screen.getByRole("button", {
        name: "Para aplicar la regla deben cumplirse",
      }),
    ).toHaveTextContent("Al menos una condición");
  });

  it("aplica una misma regla a varias preguntas sin quitar el modo individual", async () => {
    vi.mocked(
      adminSurveysService.createApplicabilityRuleBulk,
    ).mockResolvedValue([]);
    renderPage("?questionId=question-1");

    expect(
      await screen.findByRole("button", { name: "Una pregunta" }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Varias preguntas" }));

    const selector = screen.getByRole("button", {
      name: "Preguntas que recibirán la regla",
    });
    expect(selector).toHaveTextContent("Acta compromiso");
    fireEvent.click(selector);
    fireEvent.click(
      screen.getByRole("option", {
        name: /p002 · Referente institucional/,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Listo" }));

    expect(selector).toHaveTextContent("2 seleccionados");
    fireEvent.click(
      screen.getByRole("button", { name: "Aplicar a 2 preguntas" }),
    );

    await waitFor(() =>
      expect(
        adminSurveysService.createApplicabilityRuleBulk,
      ).toHaveBeenCalledWith(
        "survey-1",
        "version-1",
        ["question-1", "question-2"],
        expect.objectContaining({
          action: "omit",
          defaultAction: "show",
          conditions: [
            expect.objectContaining({
              feature: "has_kiosk",
              expectedValue: true,
            }),
          ],
        }),
      ),
    );
    expect(adminSurveysService.createApplicabilityRule).not.toHaveBeenCalled();
  });
});

function question(id: string, code: string, prompt: string, order: number) {
  return {
    id,
    code,
    prompt,
    order,
    type: "single_choice" as const,
    helpText: null,
    required: true,
    validation: {},
    options: [],
  };
}

function renderPage(search = "") {
  return render(
    <MemoryRouter
      initialEntries={[
        `/admin/cuestionarios/survey-1/versiones/version-1/reglas${search}`,
      ]}
    >
      <Routes>
        <Route
          element={
            <>
              <SurveyApplicabilityRulesPage />
              <LocationSearch />
            </>
          }
          path="/admin/cuestionarios/:surveyId/versiones/:versionId/reglas"
        />
      </Routes>
    </MemoryRouter>,
  );
}

function LocationSearch() {
  const location = useLocation();
  return <output data-testid="location-search">{location.search}</output>;
}
