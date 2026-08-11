// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminDashboardService } from "../../services/admin-dashboard.service";
import { ParticipationDashboardPage } from "./ParticipationDashboardPage";

vi.mock("../../services/admin-dashboard.service", () => ({
  adminDashboardService: {
    participation: vi.fn(),
    results: vi.fn(),
    criticalAlerts: vi.fn(),
    comparison: vi.fn(),
    filterOptions: vi.fn(),
    export: vi.fn(),
  },
}));

const options = {
  campaigns: [
    {
      id: "campaign-1",
      name: "Campaña 2026",
      status: "active" as const,
      startsAt: "2026-01-01",
      endsAt: "2026-12-31",
    },
    {
      id: "campaign-2",
      name: "Campaña 2025",
      status: "closed" as const,
      startsAt: "2025-01-01",
      endsAt: "2025-12-31",
    },
  ],
  defaultCampaignId: "campaign-1",
  departments: ["Capital", "Godoy Cruz"],
  localities: ["Ciudad"],
  educationLevels: ["Común"],
  educationLevelOptions: [{ value: "primary", label: "Primario" }],
  educationTypes: ["Común"],
  managementTypes: ["Estatal"],
  scopes: ["Urbano"],
  shifts: ["Completa"],
  criticalAreas: [
    { value: "salud_mental", label: "Salud Mental y Bienestar Emocional" },
  ],
  schools: [{ id: "school-1", cue: "123", name: "Escuela prueba" }],
};
const response = {
  campaign: {
    id: "campaign-1",
    name: "Campaña 2026",
    status: "active" as const,
    startsAt: "2026-01-01",
    endsAt: "2026-12-31",
  },
  metrics: {
    totalSchools: 10,
    notStarted: 4,
    draft: 2,
    submitted: 4,
    participationPercentage: 40,
  },
};
const resultsResponse = {
  campaign: response.campaign,
  denominators: { universeSchools: 10, submittedSchools: 4, schoolsWithCurrentResult: 4, averages: 4, starDistribution: 4 },
  metrics: { universeSchools: 10, schoolsWithResult: 4, coveragePercentage: 40, generalAverage: 75, dimensionAverages: [
    "Compromiso Institucional y Planificación Estratégica",
    "Articulación con los Equipos de Salud",
    "Entorno Alimentario Seguro y Saludable",
    "Actividad Física y Entorno Favorecedor",
    "Espacios 100% Libres de Humo de Tabaco",
    "Salud Mental y Bienestar Emocional",
  ].map((title, order) => ({ code: `dimension-${order}`, title, order, average: 70 + order, denominator: 4 })) },
  starDistribution: [1, 2, 3, 4, 5].map((stars) => ({ stars, label: `${stars} estrella${stars === 1 ? "" : "s"}`, count: stars === 4 ? 4 : 0, percentage: stars === 4 ? 100 : 0, denominator: 4 })),
  excludedResultsWithoutStars: 0,
};
const criticalAlertsResponse = {
  summary: {
    schoolsCount: 1,
    schoolsWithResult: 4,
    schoolsPercentage: 25,
    alertsCount: 1,
    affectedDimensionCount: 1,
    affectedDimensions: [{ code: "salud_mental", title: "Salud Mental y Bienestar Emocional", order: 5, schoolsCount: 1 }],
  },
  items: [{
    school: { id: "school-1", cue: "123", name: "Escuela prueba", department: "Capital", locality: "Ciudad" },
    generalScore: 50,
    stars: 2,
    dimensions: [{ code: "salud_mental", title: "Salud Mental y Bienestar Emocional", order: 5, score: 20, threshold: 33 }],
  }],
  pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
};
const comparisonResponse = {
  baselineCampaignId: "campaign-1",
  comparisonPolicy: {
    standardizedMetrics: ["generalScore", "stars"] as Array<
      "generalScore" | "stars"
    >,
    dimensionSeries: "visual_trajectory" as const,
    cohortMode: "independent_campaign_universes" as const,
    schoolProfileSource: "current" as const,
    filterScope: "institutional_only" as const,
    excludedOutcomeFilters: [
      "submissionStatuses",
      "stars",
      "criticalAreas",
    ] as Array<"submissionStatuses" | "stars" | "criticalAreas">,
    notice: "Comparación histórica normalizada.",
  },
  radarComparison: {
    available: false,
    comparable: false,
    mode: "unavailable" as const,
    reason: "single_school_required" as const,
    selectedSchoolId: null,
  },
  commonDimensions: [],
  periods: [],
};

describe("ParticipationDashboardPage", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminDashboardService.filterOptions).mockResolvedValue(options);
    vi.mocked(adminDashboardService.participation).mockResolvedValue(response);
    vi.mocked(adminDashboardService.results).mockResolvedValue(resultsResponse);
    vi.mocked(adminDashboardService.criticalAlerts).mockResolvedValue(criticalAlertsResponse);
    vi.mocked(adminDashboardService.comparison).mockResolvedValue(comparisonResponse);
  });

  it("selects the active campaign and renders its indicators", async () => {
    renderPage();
    expect(
      screen.getByText("Cargando campañas y filtros…"),
    ).toBeInTheDocument();
    expect(await screen.findByText("Total de escuelas")).toBeInTheDocument();
    expect(screen.getAllByText("40 %")).toHaveLength(2);
    expect(screen.getByText("Radar administrativo por dimensiones")).toBeInTheDocument();
    expect(screen.getByText("Alertas críticas consolidadas")).toBeInTheDocument();
    expect(screen.getByText(/25 % de 4 con resultado/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver detalle" })).toHaveAttribute(
      "href",
      expect.stringContaining("/admin/campanas/campaign-1/colegios/school-1/resultado"),
    );
    expect(adminDashboardService.participation).toHaveBeenCalledWith(
      expect.objectContaining({ campaignId: "campaign-1" }),
      expect.any(AbortSignal),
    );
  });

  it("inicia los filtros cerrados y permite expandirlos y colapsarlos", async () => {
    renderPage();
    await screen.findByText("Total de escuelas");

    const openFiltersButton = screen.getByRole("button", {
      name: "Abrir filtros de consulta",
    });
    expect(openFiltersButton).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("button", { name: "Campaña" }),
    ).not.toBeInTheDocument();

    fireEvent.click(openFiltersButton);
    expect(
      screen.getByRole("button", { name: "Cerrar filtros de consulta" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Campaña" })).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: "Cerrar filtros de consulta" }),
    );
    expect(
      screen.queryByRole("button", { name: "Campaña" }),
    ).not.toBeInTheDocument();
  });

  it("updates metrics and dependent options when a department changes", async () => {
    renderPage();
    await screen.findByText("Total de escuelas");
    expandFilters();
    fireEvent.click(screen.getByRole("button", { name: "Departamento" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Buscar en Departamento" }), { target: { value: "Cap" } });
    fireEvent.click(screen.getByRole("option", { name: "Capital" }));
    await waitFor(() =>
      expect(adminDashboardService.participation).toHaveBeenLastCalledWith(
        expect.objectContaining({
          campaignId: "campaign-1",
          departments: ["Capital"],
        }),
        expect.any(AbortSignal),
      ),
    );
    expect(adminDashboardService.filterOptions).toHaveBeenLastCalledWith(
      {
        campaignId: "campaign-1",
        departments: ["Capital"],
        localities: undefined,
      },
      expect.any(AbortSignal),
    );
  });

  it("combina valores, conserva claves repetidas y elimina un solo chip", async () => {
    renderPage(["/admin/participacion?campaignId=campaign-1"]);
    await screen.findByText("Total de escuelas");
    expandFilters();

    fireEvent.click(screen.getByRole("button", { name: "Departamento" }));
    fireEvent.click(screen.getByRole("option", { name: "Capital" }));
    fireEvent.click(screen.getByRole("option", { name: "Godoy Cruz" }));

    await waitFor(() =>
      expect(adminDashboardService.participation).toHaveBeenLastCalledWith(
        expect.objectContaining({
          campaignId: "campaign-1",
          departments: ["Capital", "Godoy Cruz"],
        }),
        expect.any(AbortSignal),
      ),
    );
    expect(screen.getByRole("listbox")).toBeVisible();
    let locationParams = currentLocationParams();
    expect(locationParams.getAll("departments")).toEqual([
      "Capital",
      "Godoy Cruz",
    ]);
    expect(locationParams.has("departments[]")).toBe(false);

    fireEvent.click(
      screen.getByTitle("Quitar filtro Departamento: Capital"),
    );
    await waitFor(() => {
      locationParams = currentLocationParams();
      expect(locationParams.getAll("departments")).toEqual(["Godoy Cruz"]);
    });
  });

  it("limpia localidad y escuelas al modificar departamentos", async () => {
    renderPage([
      "/admin/participacion?campaignId=campaign-1&departments=Capital&localities=Ciudad&schoolIds=school-1",
    ]);
    await screen.findByText("Total de escuelas");
    expandFilters();

    fireEvent.click(screen.getByRole("button", { name: "Departamento" }));
    fireEvent.click(screen.getByRole("option", { name: "Godoy Cruz" }));

    await waitFor(() => {
      const params = currentLocationParams();
      expect(params.getAll("departments")).toEqual([
        "Capital",
        "Godoy Cruz",
      ]);
      expect(params.getAll("localities")).toEqual([]);
      expect(params.getAll("schoolIds")).toEqual([]);
    });
  });

  it("lee enlaces legados y restaura multiselecciones con atrás y adelante", async () => {
    const base = "/admin/participacion?campaignId=campaign-1";
    const selected = `${base}&departments=Godoy%20Cruz&department=Capital&locality=Villa%2C%20Nueva&educationLevel=Com%C3%BAn`;
    renderPage([base, selected], 1);

    await waitFor(() =>
      expect(adminDashboardService.participation).toHaveBeenLastCalledWith(
        expect.objectContaining({
          departments: ["Godoy Cruz", "Capital"],
          localities: ["Villa, Nueva"],
          educationTypes: ["Común"],
        }),
        expect.any(AbortSignal),
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Atrás de prueba" }));
    await waitFor(() =>
      expect(adminDashboardService.participation).toHaveBeenLastCalledWith(
        expect.not.objectContaining({ departments: expect.anything() }),
        expect.any(AbortSignal),
      ),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Adelante de prueba" }),
    );
    await waitFor(() =>
      expect(adminDashboardService.participation).toHaveBeenLastCalledWith(
        expect.objectContaining({ departments: ["Godoy Cruz", "Capital"] }),
        expect.any(AbortSignal),
      ),
    );
  });

  it("filtra por estados, estrellas y áreas críticas y los limpia al cambiar campaña", async () => {
    renderPage([
      "/admin/participacion?campaignId=campaign-1&comparisonCampaignIds=campaign-2",
    ]);
    await screen.findByText("Total de escuelas");
    expandFilters();

    selectMultiple("Estado de carga", ["No iniciada", "Enviada"]);
    selectMultiple("Nivel", ["Primario"]);
    selectMultiple("Tipo de educación", ["Común"]);
    selectMultiple("Estrellas", ["4 estrellas", "5 estrellas"]);
    selectMultiple("Área crítica", ["Salud Mental y Bienestar Emocional"]);

    await waitFor(() =>
      expect(adminDashboardService.results).toHaveBeenLastCalledWith(
        expect.objectContaining({
          submissionStatuses: ["not_started", "submitted"],
          educationLevels: ["primary"],
          educationTypes: ["Común"],
          stars: ["4", "5"],
          criticalAreas: ["salud_mental"],
        }),
        expect.any(AbortSignal),
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Campaña" }));
    fireEvent.click(
      screen.getByRole("option", { name: "Campaña 2025 · Cerrada" }),
    );
    await waitFor(() => {
      const params = currentLocationParams();
      expect(params.get("campaignId")).toBe("campaign-2");
      expect(params.getAll("submissionStatuses")).toEqual([]);
      expect(params.getAll("educationLevels")).toEqual([]);
      expect(params.getAll("educationTypes")).toEqual([]);
      expect(params.getAll("stars")).toEqual([]);
      expect(params.getAll("criticalAreas")).toEqual([]);
      expect(params.getAll("comparisonCampaignIds")).toEqual([]);
    });
  });

  it("reinicia el refinamiento local al cambiar el área crítica global", async () => {
    renderPage(["/admin/participacion?campaignId=campaign-1"]);
    await screen.findByText("Alertas críticas consolidadas");
    expandFilters();

    fireEvent.change(
      screen.getByRole("combobox", { name: /Dimensión crítica/ }),
      { target: { value: "salud_mental" } },
    );
    await waitFor(() =>
      expect(adminDashboardService.criticalAlerts).toHaveBeenLastCalledWith(
        expect.objectContaining({ campaignId: "campaign-1" }),
        "salud_mental",
        1,
        expect.any(AbortSignal),
      ),
    );

    selectMultiple("Área crítica", ["Salud Mental y Bienestar Emocional"]);
    await waitFor(() =>
      expect(adminDashboardService.criticalAlerts).toHaveBeenLastCalledWith(
        expect.objectContaining({ criticalAreas: ["salud_mental"] }),
        "",
        1,
        expect.any(AbortSignal),
      ),
    );
  });

  it("restablece la campaña predeterminada y limpia todos los filtros", async () => {
    renderPage([
      "/admin/participacion?campaignId=campaign-2&departments=Capital&submissionStatuses=submitted&stars=5",
    ]);
    await screen.findByText("Total de escuelas");
    expandFilters();

    fireEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));

    await waitFor(() => {
      const params = currentLocationParams();
      expect(params.get("campaignId")).toBe("campaign-1");
      expect([...params.keys()]).toEqual(["campaignId"]);
    });
  });

  it("persiste los períodos comparativos y envía los mismos filtros DASH-04", async () => {
    renderPage([
      "/admin/participacion?campaignId=campaign-1&departments=Capital",
    ]);
    await screen.findByText("Comparación entre períodos");

    fireEvent.click(
      screen.getByRole("button", { name: "Períodos a comparar" }),
    );
    fireEvent.click(
      screen.getByRole("option", { name: "Campaña 2025 · Cerrada" }),
    );

    await waitFor(() => {
      expect(currentLocationParams().getAll("comparisonCampaignIds")).toEqual([
        "campaign-2",
      ]);
      expect(adminDashboardService.comparison).toHaveBeenCalledWith(
        ["campaign-1", "campaign-2"],
        expect.objectContaining({
          campaignId: "campaign-1",
          departments: ["Capital"],
        }),
        expect.any(AbortSignal),
      );
    });
  });

  it("abre detalle sólo cuando hay exactamente una escuela seleccionada", async () => {
    renderPage([
      "/admin/participacion?campaignId=campaign-1&schoolIds=school-1",
    ]);
    expect(
      await screen.findByRole("link", { name: "Ver detalle de la escuela" }),
    ).toHaveAttribute(
      "href",
      expect.stringContaining("/colegios/school-1/resultado"),
    );

    cleanup();
    renderPage([
      "/admin/participacion?campaignId=campaign-1&schoolIds=school-1&schoolIds=school-2",
    ]);
    expect(
      await screen.findByRole("link", { name: "Ver resultados por escuela" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Ver detalle de la escuela" }),
    ).not.toBeInTheDocument();
  });

  it("shows backend errors and offers retry", async () => {
    vi.mocked(adminDashboardService.filterOptions).mockRejectedValueOnce(
      new Error("Fallo de red"),
    );
    renderPage();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reintentar" }),
    ).toBeInTheDocument();
  });
});

function renderPage(
  initialEntries: string[] = ["/admin/participacion"],
  initialIndex = initialEntries.length - 1,
) {
  return render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      <ParticipationDashboardPage />
      <LocationProbe />
    </MemoryRouter>,
  );
}

function LocationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div className="sr-only">
      <output data-testid="location-search">{location.search}</output>
      <button onClick={() => navigate(-1)} type="button">
        Atrás de prueba
      </button>
      <button onClick={() => navigate(1)} type="button">
        Adelante de prueba
      </button>
    </div>
  );
}

function currentLocationParams() {
  return new URLSearchParams(
    screen.getByTestId("location-search").textContent ?? "",
  );
}

function expandFilters() {
  fireEvent.click(
    screen.getByRole("button", { name: "Abrir filtros de consulta" }),
  );
}

function selectMultiple(label: string, optionLabels: string[]) {
  fireEvent.click(screen.getByRole("button", { name: label }));
  optionLabels.forEach((optionLabel) =>
    fireEvent.click(screen.getByRole("option", { name: optionLabel })),
  );
  fireEvent.click(screen.getByRole("button", { name: "Listo" }));
}
