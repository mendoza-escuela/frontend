import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import { adminDashboardService } from "./admin-dashboard.service";

vi.mock("../lib/api", () => ({
  api: { get: vi.fn() },
}));

vi.mock("../lib/download", () => ({
  downloadBlob: vi.fn(),
}));

describe("adminDashboardService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.get).mockResolvedValue({ data: {} });
  });

  it("serializa filtros múltiples como claves repetidas sin corchetes", async () => {
    await adminDashboardService.participation({
      campaignId: "campaign-1",
      departments: ["Capital", "Godoy Cruz"],
      educationLevels: ["primary", "secondary"],
      educationTypes: ["Común"],
      submissionStatuses: ["not_started", "submitted"],
      stars: ["4", "5"],
      criticalAreas: ["salud_mental", "entorno_alimentario"],
    });

    const config = vi.mocked(api.get).mock.calls[0][1];
    const params = config?.params as URLSearchParams;
    expect(params).toBeInstanceOf(URLSearchParams);
    expect(params.get("campaignId")).toBe("campaign-1");
    expect(params.getAll("departments")).toEqual([
      "Capital",
      "Godoy Cruz",
    ]);
    expect(params.getAll("educationLevels")).toEqual([
      "primary",
      "secondary",
    ]);
    expect(params.getAll("submissionStatuses")).toEqual([
      "not_started",
      "submitted",
    ]);
    expect(params.getAll("stars")).toEqual(["4", "5"]);
    expect(params.getAll("criticalAreas")).toEqual([
      "salud_mental",
      "entorno_alimentario",
    ]);
    expect(params.toString()).not.toContain("%5B%5D");
    expect(params.toString()).not.toContain("[]");
  });

  it("propaga filtros a métricas y exportación, y limita los catálogos dependientes", async () => {
    const filters = {
      campaignId: "campaign-1",
      departments: ["Capital", "Lavalle"],
      localities: ["Ciudad", "Costa de Araujo"],
      schoolIds: ["school-1", "school-2"],
      managementTypes: ["Estatal", "Privada"],
    };

    await adminDashboardService.results(filters);
    await adminDashboardService.criticalAlerts(
      filters,
      "salud_mental",
      3,
    );
    await adminDashboardService.filterOptions(filters);
    await adminDashboardService.export("results", "xlsx", filters);

    const calls = vi.mocked(api.get).mock.calls;
    for (const [, config] of calls) {
      const params = config?.params as URLSearchParams;
      expect(params.getAll("departments")).toEqual(["Capital", "Lavalle"]);
      expect(params.getAll("localities")).toEqual([
        "Ciudad",
        "Costa de Araujo",
      ]);
    }
    const alertParams = calls[1][1]?.params as URLSearchParams;
    expect(alertParams.get("dimensionCode")).toBe("salud_mental");
    expect(alertParams.get("page")).toBe("3");
    const optionsParams = calls[2][1]?.params as URLSearchParams;
    expect(optionsParams.getAll("schoolIds")).toEqual([]);
    expect(optionsParams.getAll("managementTypes")).toEqual([]);
    const exportParams = calls[3][1]?.params as URLSearchParams;
    expect(exportParams.getAll("schoolIds")).toEqual([
      "school-1",
      "school-2",
    ]);
    expect(exportParams.getAll("managementTypes")).toEqual([
      "Estatal",
      "Privada",
    ]);
    expect(exportParams.get("format")).toBe("xlsx");
  });

  it("compara campañas con claves repetidas y omite filtros de resultado sesgados", async () => {
    await adminDashboardService.comparison(
      ["campaign-2026", "campaign-2025", "campaign-2024"],
      {
        campaignId: "campaign-2026",
        departments: ["Capital", "Godoy Cruz"],
        schoolIds: ["school-1"],
        educationLevels: ["primary"],
        submissionStatuses: ["submitted"],
        stars: ["4", "5"],
        criticalAreas: ["salud_mental"],
      },
    );

    expect(api.get).toHaveBeenCalledWith(
      "/admin/dashboard/results/comparison",
      expect.objectContaining({ params: expect.any(URLSearchParams) }),
    );
    const params = vi.mocked(api.get).mock.calls[0][1]
      ?.params as URLSearchParams;
    expect(params.getAll("campaignIds")).toEqual([
      "campaign-2026",
      "campaign-2025",
      "campaign-2024",
    ]);
    expect(params.has("campaignId")).toBe(false);
    expect(params.getAll("departments")).toEqual([
      "Capital",
      "Godoy Cruz",
    ]);
    expect(params.getAll("schoolIds")).toEqual(["school-1"]);
    expect(params.getAll("educationLevels")).toEqual(["primary"]);
    expect(params.has("submissionStatuses")).toBe(false);
    expect(params.has("stars")).toBe(false);
    expect(params.has("criticalAreas")).toBe(false);
  });

  it("tolera durante el despliegue una respuesta de catálogos anterior", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        educationLevels: ["Común"],
      },
    });

    const response = await adminDashboardService.filterOptions({});

    expect(response.educationLevelOptions).toEqual([]);
    expect(response.educationTypes).toEqual(["Común"]);
    expect(response.criticalAreas).toEqual([]);
  });
});
