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

const nextRevision = "2026-08-01T00:00:00.001Z";
const createdRule: ApplicabilityRule = {
  ...rules[0],
  id: "rule-created",
  questionId: "question-1",
  defaultAction: "show",
};

describe("SurveyApplicabilityRulesPage", () => {
  beforeEach(() => {
    vi.mocked(adminSurveysService.findVersion).mockResolvedValue(version);
    vi.mocked(adminSurveysService.applicabilityMetadata).mockResolvedValue(
      metadata,
    );
    vi.mocked(adminSurveysService.listApplicabilityRules).mockResolvedValue({
      rules,
      versionUpdatedAt: version.updatedAt,
    });
    vi.mocked(adminSurveysService.createApplicabilityRule).mockResolvedValue({
      rule: createdRule,
      versionUpdatedAt: nextRevision,
    });
    vi.mocked(
      adminSurveysService.createApplicabilityRuleBulk,
    ).mockResolvedValue({ rules: [], versionUpdatedAt: nextRevision });
    vi.mocked(adminSurveysService.updateApplicabilityRule).mockResolvedValue({
      rule: rules[0],
      versionUpdatedAt: nextRevision,
    });
    vi.mocked(adminSurveysService.removeApplicabilityRule).mockResolvedValue({
      versionUpdatedAt: nextRevision,
    });
    vi.mocked(adminSurveysService.reorderApplicabilityRules).mockResolvedValue({
      rules,
      versionUpdatedAt: nextRevision,
    });
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
    ).mockResolvedValue({ rules: [], versionUpdatedAt: nextRevision });
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
        name: /p003 · Plan institucional/,
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
        ["question-1", "question-3"],
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
        version.updatedAt,
      ),
    );
    expect(adminSurveysService.createApplicabilityRule).not.toHaveBeenCalled();
  });

  it("muestra los conteos, resalta preguntas con reglas y resume el impacto", async () => {
    renderPage("?questionId=question-1");

    fireEvent.click(
      await screen.findByRole("button", { name: "Varias preguntas" }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Preguntas que recibirán la regla",
      }),
    );

    const questionWithRules = screen.getByRole("option", {
      name: /p002 · Referente institucional.*1 regla/,
    });
    expect(questionWithRules).toHaveAttribute("data-highlighted", "true");
    expect(
      screen.getByRole("option", {
        name: /p001 · Acta compromiso.*0 reglas/,
      }),
    ).not.toHaveAttribute("data-highlighted");

    fireEvent.click(questionWithRules);
    fireEvent.click(screen.getByRole("button", { name: "Listo" }));

    const summary = screen.getByRole("region", {
      name: "Resumen antes de aplicar",
    });
    expect(summary).toHaveTextContent(
      "2 preguntas seleccionadas · 1 regla existente en 1 pregunta.",
    );
    expect(within(summary).getByRole("alert")).toHaveTextContent(
      "p002 ya usa otra acción predeterminada",
    );
    expect(
      screen.getByRole("button", { name: "Aplicar a 2 preguntas" }),
    ).toBeDisabled();
  });

  it("omite una regla equivalente y aplica sólo a las preguntas restantes", async () => {
    const equivalentRule = existingEquivalentRule(
      "rule-equivalent",
      "question-2",
    );
    vi.mocked(adminSurveysService.listApplicabilityRules).mockResolvedValue({
      rules: [equivalentRule],
      versionUpdatedAt: version.updatedAt,
    });
    renderPage("?questionId=question-1");

    fireEvent.click(
      await screen.findByRole("button", { name: "Varias preguntas" }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Preguntas que recibirán la regla",
      }),
    );
    fireEvent.click(
      screen.getByRole("option", {
        name: /p002 · Referente institucional/,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Listo" }));

    const summary = screen.getByRole("region", {
      name: "Resumen antes de aplicar",
    });
    expect(summary).toHaveTextContent(
      "p002 ya tiene una regla equivalente. Se omitirá para no crear duplicados.",
    );
    const applyButton = screen.getByRole("button", {
      name: "Aplicar a 1 pregunta",
    });
    expect(applyButton).toBeEnabled();
    fireEvent.click(applyButton);

    await waitFor(() =>
      expect(adminSurveysService.createApplicabilityRule).toHaveBeenCalledWith(
        "survey-1",
        "version-1",
        "question-1",
        expect.objectContaining({
          action: "omit",
          defaultAction: "show",
          order: 0,
          conditions: [
            expect.objectContaining({
              feature: "has_kiosk",
              expectedValue: true,
            }),
          ],
        }),
        version.updatedAt,
      ),
    );
    expect(
      adminSurveysService.createApplicabilityRuleBulk,
    ).not.toHaveBeenCalled();
  });

  it("impide aplicar cuando todas las preguntas ya tienen una regla equivalente", async () => {
    vi.mocked(adminSurveysService.listApplicabilityRules).mockResolvedValue({
      rules: [
        existingEquivalentRule("rule-equivalent-1", "question-1"),
        existingEquivalentRule("rule-equivalent-2", "question-2"),
      ],
      versionUpdatedAt: version.updatedAt,
    });
    renderPage("?questionId=question-1");

    fireEvent.click(
      await screen.findByRole("button", { name: "Varias preguntas" }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Preguntas que recibirán la regla",
      }),
    );
    fireEvent.click(
      screen.getByRole("option", {
        name: /p002 · Referente institucional/,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Listo" }));

    expect(screen.getAllByText("Ya tiene esta regla")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Aplicar a 0 preguntas" }),
    ).toBeDisabled();
    expect(adminSurveysService.createApplicabilityRule).not.toHaveBeenCalled();
    expect(
      adminSurveysService.createApplicabilityRuleBulk,
    ).not.toHaveBeenCalled();
  });

  it("impide crear una acción opuesta para las mismas condiciones", async () => {
    vi.mocked(adminSurveysService.listApplicabilityRules).mockResolvedValue({
      rules: [
        {
          ...existingEquivalentRule("rule-contradictory", "question-2"),
          action: "show",
        },
      ],
      versionUpdatedAt: version.updatedAt,
    });
    renderPage("?questionId=question-1");

    fireEvent.click(
      await screen.findByRole("button", { name: "Varias preguntas" }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Preguntas que recibirán la regla",
      }),
    );
    fireEvent.click(
      screen.getByRole("option", {
        name: /p002 · Referente institucional/,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Listo" }));

    const summary = screen.getByRole("region", {
      name: "Resumen antes de aplicar",
    });
    expect(within(summary).getByRole("alert")).toHaveTextContent(
      "p002 ya tiene las mismas condiciones con una acción opuesta",
    );
    expect(
      screen.getByRole("button", { name: "Aplicar a 2 preguntas" }),
    ).toBeDisabled();
    expect(adminSurveysService.createApplicabilityRule).not.toHaveBeenCalled();
    expect(
      adminSurveysService.createApplicabilityRuleBulk,
    ).not.toHaveBeenCalled();
  });

  it("no considera completos los valores formados sólo por espacios", async () => {
    vi.mocked(adminSurveysService.applicabilityMetadata).mockResolvedValue({
      ...metadata,
      features: [
        ...metadata.features,
        {
          key: "shift",
          label: "Jornada",
          type: "string",
          operators: ["equals"],
        },
      ],
    });
    renderPage("?questionId=question-1");

    fireEvent.click(
      await screen.findByRole("button", { name: "Varias preguntas" }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Preguntas que recibirán la regla",
      }),
    );
    fireEvent.click(
      screen.getByRole("option", { name: /p003 · Plan institucional/ }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Listo" }));

    fireEvent.click(screen.getByRole("button", { name: "Característica" }));
    fireEvent.click(screen.getByRole("option", { name: "Jornada" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Valor" }), {
      target: { value: "   " },
    });

    expect(
      screen.getByText(
        "Completá todas las condiciones para calcular el impacto.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Aplicar a 2 preguntas" }),
    ).toBeDisabled();
  });

  it("usa la revisión devuelta por una mutación en la siguiente escritura", async () => {
    const secondRevision = "2026-08-01T00:00:00.002Z";
    vi.mocked(adminSurveysService.createApplicabilityRule)
      .mockResolvedValueOnce({
        rule: createdRule,
        versionUpdatedAt: nextRevision,
      })
      .mockResolvedValueOnce({
        rule: { ...createdRule, id: "rule-created-2", order: 1 },
        versionUpdatedAt: secondRevision,
      });
    renderPage("?questionId=question-1");

    await screen.findByText("Pregunta 1 de 3");
    fireEvent.click(screen.getByRole("button", { name: "Guardar regla" }));
    await waitFor(() =>
      expect(adminSurveysService.createApplicabilityRule).toHaveBeenCalledTimes(
        1,
      ),
    );
    fireEvent.click(screen.getByRole("button", { name: "Guardar regla" }));

    await waitFor(() =>
      expect(
        adminSurveysService.createApplicabilityRule,
      ).toHaveBeenLastCalledWith(
        "survey-1",
        "version-1",
        "question-1",
        expect.any(Object),
        nextRevision,
      ),
    );
  });

  it("serializa las mutaciones y no permite cambiar el formulario durante una escritura", async () => {
    let finishCreate: (mutation: {
      rule: ApplicabilityRule;
      versionUpdatedAt: string;
    }) => void = () => undefined;
    vi.mocked(adminSurveysService.createApplicabilityRule).mockReturnValueOnce(
      new Promise((resolve) => {
        finishCreate = resolve;
      }),
    );
    renderPage("?questionId=question-2");

    await screen.findByText("Pregunta 2 de 3");
    const saveButton = screen.getByRole("button", { name: "Guardar regla" });
    fireEvent.click(saveButton);
    await waitFor(() =>
      expect(adminSurveysService.createApplicabilityRule).toHaveBeenCalledTimes(
        1,
      ),
    );

    const actionSelect = screen.getByRole("button", { name: "Entonces" });
    const editButton = screen.getByRole("button", { name: "Editar" });
    const removeButton = screen.getByRole("button", { name: "Eliminar" });
    expect(saveButton).toBeDisabled();
    expect(actionSelect).toBeDisabled();
    expect(editButton).toBeDisabled();
    expect(removeButton).toBeDisabled();

    editButton.click();
    removeButton.click();
    actionSelect.click();
    expect(
      screen.getByRole("heading", { name: "Definí una nueva regla" }),
    ).toBeVisible();
    expect(adminSurveysService.removeApplicabilityRule).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("option", { name: "Mostrar la pregunta" }),
    ).not.toBeInTheDocument();

    finishCreate({
      rule: { ...createdRule, questionId: "question-2", order: 1 },
      versionUpdatedAt: nextRevision,
    });

    await waitFor(() => expect(saveButton).toBeEnabled());
    expect(adminSurveysService.removeApplicabilityRule).not.toHaveBeenCalled();
  });

  it("conserva el formulario y explica un conflicto de revisión", async () => {
    vi.mocked(adminSurveysService.createApplicabilityRule).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          code: "SURVEY_VERSION_EDIT_CONFLICT",
          message:
            "Otra persona modificó esta versión mientras la estabas editando.",
        },
      },
    });
    renderPage("?questionId=question-1");

    await screen.findByText("Pregunta 1 de 3");
    fireEvent.click(screen.getByRole("button", { name: "Guardar regla" }));
    await waitFor(() =>
      expect(adminSurveysService.createApplicabilityRule).toHaveBeenCalledTimes(
        1,
      ),
    );

    expect(
      await screen.findByText("No se sobrescribieron cambios más recientes"),
    ).toBeVisible();
    expect(
      screen.getByRole("button", {
        name: "Descartar mi edición y cargar la versión actual",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Si ninguna regla coincide" }),
    ).toHaveTextContent("Mostrar");
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

function existingEquivalentRule(
  id: string,
  questionId: string,
): ApplicabilityRule {
  return {
    ...rules[0],
    id,
    questionId,
    defaultAction: "show",
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
