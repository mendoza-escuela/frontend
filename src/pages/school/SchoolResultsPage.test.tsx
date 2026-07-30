// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { schoolResultsService } from "../../services/school-results.service";
import type { SchoolPreliminaryResult } from "../../types/school-result";
import { SchoolResultsPage } from "./SchoolResultsPage";

vi.mock("../../services/school-results.service", () => ({
  schoolResultsService: {
    list: vi.fn(),
    getByCampaign: vi.fn(),
  },
}));

class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("SchoolResultsPage", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", TestResizeObserver);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("shows the persisted result, six-axis radar, answers and exclusions without stars", async () => {
    vi.mocked(schoolResultsService.getByCampaign).mockResolvedValue(
      preliminaryResultFixture(32.99, true),
    );

    renderResultRoute();

    expect(
      await screen.findByRole("heading", { name: "Resultado preliminar" }),
    ).toBeVisible();
    expect(screen.getByText("Escuela Histórica")).toBeVisible();
    expect(screen.getByText("Campaña 2026")).toBeVisible();
    expect(
      screen.getByText("Cuestionario institucional · versión 3"),
    ).toBeVisible();
    expect(screen.getByText("58,17")).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Área crítica: Salud Mental y Bienestar Emocional",
      }),
    ).toBeVisible();
    expect(screen.getByText(/32,99 puntos/)).toBeVisible();
    expect(
      screen.getByRole("img", {
        name: "Gráfico radar con los resultados de las seis dimensiones",
      }),
    ).toBeVisible();
    expect(
      screen.getByLabelText("Alternativa textual del gráfico radar").children,
    ).toHaveLength(6);
    expect(screen.getByText("La escuela no posee kiosco.")).toBeVisible();
    expect(screen.getByText("Sí, completamente")).toBeVisible();
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(screen.queryByText(/estrella/i)).not.toBeInTheDocument();
  });

  it("does not show the critical alert when Mental Health equals 33", async () => {
    vi.mocked(schoolResultsService.getByCampaign).mockResolvedValue(
      preliminaryResultFixture(33, false),
    );

    renderResultRoute();

    await screen.findByRole("heading", { name: "Resultado preliminar" });
    expect(
      screen.queryByRole("heading", {
        name: "Área crítica: Salud Mental y Bienestar Emocional",
      }),
    ).not.toBeInTheDocument();
  });

  it("keeps an unavailable dimension out of the radar instead of using zero", async () => {
    const result = preliminaryResultFixture(33, false);
    result.result.dimensions[2] = {
      ...result.result.dimensions[2],
      score: null,
      available: false,
    };
    result.dataQuality = {
      complete: false,
      warnings: [
        "No se encontró el resultado histórico de Entorno Alimentario.",
      ],
    };
    vi.mocked(schoolResultsService.getByCampaign).mockResolvedValue(result);

    renderResultRoute();

    expect(await screen.findAllByText("No disponible")).not.toHaveLength(0);
    expect(
      screen.queryByRole("img", {
        name: "Gráfico radar con los resultados de las seis dimensiones",
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/sin reemplazar los faltantes por cero/i),
    ).toBeVisible();
    expect(screen.getByText("Datos históricos incompletos")).toBeVisible();
  });

  it("shows a specific read-only state for a draft presentation", async () => {
    vi.mocked(schoolResultsService.getByCampaign).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          code: "SUBMISSION_DRAFT",
          message:
            "La presentación todavía está en borrador. El resultado estará disponible después del envío.",
        },
      },
    });

    renderResultRoute();

    expect(
      await screen.findByRole("heading", { name: "Presentación en borrador" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Volver al cuestionario" }),
    ).toHaveAttribute("href", "/colegio/cuestionario");
  });

  it("lists historical results with keyboard-accessible links", async () => {
    vi.mocked(schoolResultsService.list).mockResolvedValue({
      items: [
        {
          id: "result-1",
          submissionId: "submission-1",
          campaign: {
            id: "campaign-1",
            name: "Campaña 2026",
            type: "annual",
          },
          schoolName: "Escuela Histórica",
          submittedAt: "2026-07-30T15:00:00.000Z",
          generalScore: 58.17,
          calculatedAt: "2026-07-30T15:00:01.000Z",
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={["/colegio/resultados"]}>
        <Routes>
          <Route
            element={<SchoolResultsPage />}
            path="/colegio/resultados"
          />
        </Routes>
      </MemoryRouter>,
    );

    const link = await screen.findByRole("link", {
      name: "Ver resultado preliminar",
    });
    expect(link).toHaveAttribute(
      "href",
      "/colegio/resultados/campaign-1",
    );
    link.focus();
    expect(link).toHaveFocus();
  });

  it("shows the result-not-generated state returned by the backend", async () => {
    vi.mocked(schoolResultsService.getByCampaign).mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 404,
        data: {
          code: "PRELIMINARY_RESULT_NOT_GENERATED",
          message:
            "La presentación fue enviada, pero el resultado preliminar todavía no fue generado.",
        },
      },
    });

    renderResultRoute();

    expect(
      await screen.findByRole("heading", {
        name: "Resultado todavía no generado",
      }),
    ).toBeVisible();
    await waitFor(() =>
      expect(schoolResultsService.getByCampaign).toHaveBeenCalledWith(
        "campaign-1",
      ),
    );
  });
});

function renderResultRoute() {
  return render(
    <MemoryRouter
      initialEntries={["/colegio/resultados/campaign-1"]}
    >
      <Routes>
        <Route
          element={<SchoolResultsPage />}
          path="/colegio/resultados/:campaignId"
        />
      </Routes>
    </MemoryRouter>,
  );
}

function preliminaryResultFixture(
  mentalHealthScore: number,
  mentalHealthCritical: boolean,
): SchoolPreliminaryResult {
  const dimensionTitles = [
    "Compromiso Institucional y Planificación Estratégica",
    "Articulación con los Equipos de Salud",
    "Entorno Alimentario Seguro y Saludable",
    "Actividad Física y Entorno Favorecedor",
    "Espacios 100% Libres de Humo de Tabaco",
    "Salud Mental y Bienestar Emocional",
  ];
  const dimensionCodes = [
    "compromiso_institucional",
    "articulacion_equipos_salud",
    "entorno_alimentario",
    "actividad_fisica",
    "espacios_libres_humo",
    "salud_mental",
  ];
  const dimensions = dimensionTitles.map((title, index) => ({
    id: `dimension-${index + 1}`,
    code: dimensionCodes[index],
    title,
    order: index + 1,
    score: index === 5 ? mentalHealthScore : 50 + index,
    available: true,
    isCritical: index === 5 && mentalHealthCritical,
    criticalValue: index === 5 ? mentalHealthScore : null,
    criticalThreshold: index === 5 ? 33 : null,
  }));
  const questionContext = {
    id: "question-1",
    code: "p001",
    prompt: "¿La escuela cuenta con un compromiso institucional?",
    order: 1,
    dimension: {
      id: "dimension-1",
      code: dimensionCodes[0],
      title: dimensionTitles[0],
      order: 1,
    },
    section: {
      id: "section-1",
      code: "compromiso",
      title: "Compromiso institucional",
      order: 1,
    },
  };

  return {
    id: "result-1",
    submission: {
      id: "submission-1",
      submittedAt: "2026-07-30T15:00:00.000Z",
    },
    school: {
      id: "school-1",
      cue: "500012300",
      name: "Escuela Histórica",
    },
    campaign: {
      id: "campaign-1",
      name: "Campaña 2026",
      type: "annual",
    },
    survey: {
      id: "survey-1",
      code: "institucional",
      name: "Cuestionario institucional",
      version: {
        id: "version-3",
        number: 3,
        title: "Versión aprobada",
        publishedAt: "2026-07-01T12:00:00.000Z",
      },
    },
    result: {
      generalScore: 58.17,
      dimensions,
      mentalHealthCritical: {
        isCritical: mentalHealthCritical,
        value: mentalHealthScore,
        threshold: 33,
      },
    },
    applicableQuestions: [questionContext],
    excludedQuestions: [
      {
        ...questionContext,
        id: "question-2",
        code: "p007",
        prompt: "¿El kiosco ofrece alimentos saludables?",
        exclusion: {
          reasonCode: "MATCHED_EXCLUSION_RULE",
          reason: "La escuela no posee kiosco.",
        },
      },
    ],
    answers: [
      {
        ...questionContext,
        answer: {
          optionId: "option-1",
          optionLabel: "Sí, completamente",
          value: null,
          scoreUsed: 100,
        },
      },
    ],
    calculation: {
      calculatedAt: "2026-07-30T15:00:01.000Z",
      algorithmVersion: "question-average-dynamic-denominator-v1",
      snapshotSchemaVersion: 2,
    },
    dataQuality: {
      complete: true,
      warnings: [],
    },
  };
}
