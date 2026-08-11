import { describe, expect, it } from "vitest";
import { downloadFilename } from "./download";

describe("downloadFilename", () => {
  it("prioriza y decodifica filename* de Content-Disposition", () => {
    expect(
      downloadFilename(
        "attachment; filename=report.xlsx; filename*=UTF-8''reporte%20escuela%20hist%C3%B3rica.xlsx",
        "reporte.xlsx",
      ),
    ).toBe("reporte escuela histórica.xlsx");
  });

  it("elimina separadores y caracteres inseguros del nombre", () => {
    expect(
      downloadFilename(
        'attachment; filename="../reporte:escuela?.xlsx"',
        "reporte.xlsx",
      ),
    ).toBe("reporte-escuela-.xlsx");
  });
});
