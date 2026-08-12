import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../lib/api";
import { downloadBlob } from "../lib/download";
import { schoolResultsService } from "./school-results.service";

vi.mock("../lib/api", () => ({
  api: { get: vi.fn() },
}));

vi.mock("../lib/download", async (importOriginal) => {
  const original = await importOriginal<typeof import("../lib/download")>();
  return { ...original, downloadBlob: vi.fn() };
});

describe("schoolResultsService.downloadExcel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("descarga el workbook del envío con el nombre indicado por backend", async () => {
    const workbook = new Blob(["xlsx"], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    vi.mocked(api.get).mockResolvedValue({
      data: workbook,
      headers: {
        "content-disposition":
          'attachment; filename="reporte-500012300.xlsx"',
      },
    });

    await schoolResultsService.downloadExcel("campaign-1", "500012300");

    expect(api.get).toHaveBeenCalledWith(
      "/school/campaigns/campaign-1/submission/report.xlsx",
      { responseType: "blob" },
    );
    expect(downloadBlob).toHaveBeenCalledWith(
      workbook,
      "reporte-500012300.xlsx",
    );
  });

  it("usa un nombre seguro de respaldo si el proxy no expone Content-Disposition", async () => {
    const workbook = new Blob(["xlsx"]);
    vi.mocked(api.get).mockResolvedValue({ data: workbook, headers: {} });

    await schoolResultsService.downloadExcel("campaign-1", "500/012300");

    expect(downloadBlob).toHaveBeenCalledWith(
      workbook,
      "reporte-500-012300.xlsx",
    );
  });
});
