// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminDashboardService } from "../../services/admin-dashboard.service";
import { ParticipationDashboardPage } from "./ParticipationDashboardPage";

vi.mock("../../services/admin-dashboard.service", () => ({
  adminDashboardService: {
    participation: vi.fn(),
    results: vi.fn(),
    filterOptions: vi.fn(),
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
  ],
  defaultCampaignId: "campaign-1",
  departments: ["Capital", "Godoy Cruz"],
  localities: ["Ciudad"],
  educationLevels: ["Primario"],
  managementTypes: ["Estatal"],
  scopes: ["Urbano"],
  shifts: ["Completa"],
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
  metrics: { universeSchools: 10, schoolsWithResult: 4, coveragePercentage: 40, generalAverage: 75, dimensionAverages: [] },
  starDistribution: [1, 2, 3, 4, 5].map((stars) => ({ stars, label: `${stars} estrella${stars === 1 ? "" : "s"}`, count: stars === 4 ? 4 : 0, percentage: stars === 4 ? 100 : 0, denominator: 4 })),
  excludedResultsWithoutStars: 0,
};

describe("ParticipationDashboardPage", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminDashboardService.filterOptions).mockResolvedValue(options);
    vi.mocked(adminDashboardService.participation).mockResolvedValue(response);
    vi.mocked(adminDashboardService.results).mockResolvedValue(resultsResponse);
  });

  it("selects the active campaign and renders its indicators", async () => {
    render(
      <MemoryRouter>
        <ParticipationDashboardPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByText("Cargando campañas y filtros…"),
    ).toBeInTheDocument();
    expect(await screen.findByText("Total de escuelas")).toBeInTheDocument();
    expect(screen.getAllByText("40 %")).toHaveLength(2);
    expect(adminDashboardService.participation).toHaveBeenCalledWith(
      expect.objectContaining({ campaignId: "campaign-1" }),
      expect.any(AbortSignal),
    );
  });

  it("updates metrics and dependent options when a department changes", async () => {
    render(
      <MemoryRouter>
        <ParticipationDashboardPage />
      </MemoryRouter>,
    );
    await screen.findByText("Total de escuelas");
    fireEvent.click(screen.getByRole("button", { name: "Departamento" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Buscar en Departamento" }), { target: { value: "Cap" } });
    fireEvent.click(screen.getByRole("option", { name: "Capital" }));
    await waitFor(() =>
      expect(adminDashboardService.participation).toHaveBeenLastCalledWith(
        expect.objectContaining({
          campaignId: "campaign-1",
          department: "Capital",
        }),
        expect.any(AbortSignal),
      ),
    );
    expect(adminDashboardService.filterOptions).toHaveBeenLastCalledWith(
      {
        campaignId: "campaign-1",
        department: "Capital",
        locality: undefined,
      },
      expect.any(AbortSignal),
    );
  });

  it("shows backend errors and offers retry", async () => {
    vi.mocked(adminDashboardService.filterOptions).mockRejectedValueOnce(
      new Error("Fallo de red"),
    );
    render(
      <MemoryRouter>
        <ParticipationDashboardPage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reintentar" }),
    ).toBeInTheDocument();
  });
});
