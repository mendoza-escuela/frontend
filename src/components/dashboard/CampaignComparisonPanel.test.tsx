// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminDashboardService } from "../../services/admin-dashboard.service";
import type { CampaignComparisonResponse } from "../../types/admin-dashboard";
import { CampaignComparisonPanel } from "./CampaignComparisonPanel";

vi.mock("../../services/admin-dashboard.service", () => ({
  adminDashboardService: { comparison: vi.fn() },
}));

const campaigns = [
  {
    id: "campaign-2026",
    name: "Etapa 2026",
    status: "active" as const,
    startsAt: "2026-01-01T03:00:00.000Z",
    endsAt: "2026-09-01T02:59:59.999Z",
  },
  {
    id: "campaign-2025",
    name: "Etapa 2025",
    status: "closed" as const,
    startsAt: "2025-01-01T03:00:00.000Z",
    endsAt: "2026-01-01T02:59:59.999Z",
  },
];

const dimensions = [
  "Compromiso Institucional",
  "Articulación con Salud",
  "Entorno Alimentario",
  "Actividad Física",
  "Espacios Libres de Humo",
  "Salud Mental",
].map((title, order) => ({ code: `dimension-${order}`, title, order }));

const response: CampaignComparisonResponse = {
  baselineCampaignId: "campaign-2026",
  comparisonPolicy: {
    standardizedMetrics: ["generalScore", "stars"],
    dimensionSeries: "visual_trajectory",
    cohortMode: "independent_campaign_universes",
    schoolProfileSource: "current",
    filterScope: "institutional_only",
    excludedOutcomeFilters: [
      "submissionStatuses",
      "stars",
      "criticalAreas",
    ],
    notice: "Sólo el puntaje general y las estrellas son métricas estandarizadas.",
  },
  radarComparison: {
    available: true,
    comparable: true,
    mode: "comparable",
    reason: null,
    selectedSchoolId: "school-1",
  },
  commonDimensions: dimensions,
  periods: [
    comparisonPeriod("campaign-2026", "Etapa 2026", 82, 5),
    comparisonPeriod("campaign-2025", "Etapa 2025", 70, 4),
  ],
};

describe("CampaignComparisonPanel", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminDashboardService.comparison).mockResolvedValue(response);
  });

  it("consulta en orden, muestra métricas comunes y superpone la trayectoria de una escuela", async () => {
    render(
      <CampaignComparisonPanel
        baselineCampaignId="campaign-2026"
        campaigns={campaigns}
        comparisonCampaignIds={["campaign-2025"]}
        filters={{
          campaignId: "campaign-2026",
          departments: ["Capital"],
          schoolIds: ["school-1"],
          submissionStatuses: ["submitted"],
          stars: ["5"],
          criticalAreas: ["salud_mental"],
        }}
        onComparisonCampaignIdsChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Comparando períodos…")).toBeInTheDocument();
    expect(
      await screen.findByText("Métricas estandarizadas"),
    ).toBeInTheDocument();
    expect(adminDashboardService.comparison).toHaveBeenCalledWith(
      ["campaign-2026", "campaign-2025"],
      {
        campaignId: "campaign-2026",
        departments: ["Capital"],
        schoolIds: ["school-1"],
      },
      expect.any(AbortSignal),
    );
    expect(
      screen.getByRole("img", {
        name: "Distribución de estrellas por período",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Radar superpuesto de la trayectoria por períodos",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Alternativa textual del radar histórico"),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Resultado vigente calculado el/)).toHaveLength(2);
    expect(
      screen.getAllByText(/01\/01\/2026 al 31\/08\/2026/).length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/01\/09\/2026/)).not.toBeInTheDocument();
  });

  it("explica que el radar requiere exactamente una escuela sin inventar un agregado territorial", async () => {
    vi.mocked(adminDashboardService.comparison).mockResolvedValueOnce({
      ...response,
      radarComparison: {
        available: false,
        comparable: false,
        mode: "unavailable",
        reason: "single_school_required",
        selectedSchoolId: null,
      },
      commonDimensions: [],
      periods: response.periods.map((period) => ({
        ...period,
        metrics: { ...period.metrics, dimensionAverages: [] },
      })),
    });

    render(
      <CampaignComparisonPanel
        baselineCampaignId="campaign-2026"
        campaigns={campaigns}
        comparisonCampaignIds={["campaign-2025"]}
        filters={{ campaignId: "campaign-2026" }}
        onComparisonCampaignIdsChange={vi.fn()}
      />,
    );

    expect(
      await screen.findByText(/Seleccioná exactamente una escuela/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("img", {
        name: "Radar superpuesto de la trayectoria por períodos",
      }),
    ).not.toBeInTheDocument();
  });

  it("ofrece reintentar si falla el endpoint comparativo", async () => {
    vi.mocked(adminDashboardService.comparison).mockRejectedValueOnce(
      new Error("Fallo de comparación"),
    );
    render(
      <CampaignComparisonPanel
        baselineCampaignId="campaign-2026"
        campaigns={campaigns}
        comparisonCampaignIds={["campaign-2025"]}
        filters={{ campaignId: "campaign-2026" }}
        onComparisonCampaignIdsChange={vi.fn()}
      />,
    );

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeVisible();
  });
});

function comparisonPeriod(
  id: string,
  name: string,
  generalAverage: number,
  stars: number,
): CampaignComparisonResponse["periods"][number] {
  return {
    campaign: {
      id,
      name,
      status: id === "campaign-2026" ? "active" : "closed",
      type: "annual",
      isPartial: id === "campaign-2026",
      surveyVersionId: "survey-version-1",
      startsAt: `${id === "campaign-2026" ? "2026" : "2025"}-01-01T03:00:00.000Z`,
      endsAt:
        id === "campaign-2026"
          ? "2026-09-01T02:59:59.999Z"
          : "2026-01-01T02:59:59.999Z",
    },
    calculationMetadata: {
      algorithmVersion: "1.0.0",
      evaluationConfigurationVersion: "config-1",
      calculatedAt: `${id === "campaign-2026" ? "2026" : "2025"}-12-20T15:00:00.000Z`,
      calculationSource: "submission_finalization",
    },
    denominators: {
      universeSchools: 1,
      submittedSchools: 1,
      schoolsWithCurrentResult: 1,
      averages: 1,
      starDistribution: 1,
    },
    metrics: {
      universeSchools: 1,
      schoolsWithResult: 1,
      coveragePercentage: 100,
      generalAverage,
      dimensionAverages: dimensions.map((dimension) => ({
        ...dimension,
        average: generalAverage - dimension.order,
        denominator: 1,
      })),
    },
    starDistribution: [1, 2, 3, 4, 5].map((bucketStars) => ({
      stars: bucketStars,
      label: `${bucketStars} estrella${bucketStars === 1 ? "" : "s"}`,
      count: bucketStars === stars ? 1 : 0,
      percentage: bucketStars === stars ? 100 : 0,
      denominator: 1,
    })),
    excludedResultsWithoutStars: 0,
  };
}
