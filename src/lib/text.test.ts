import { describe, expect, it } from "vitest";
import { normalizeSearchText, wrapChartLabel } from "./text";

describe("normalizeSearchText", () => {
  it("ignora mayúsculas y diacríticos sin alterar el texto original", () => {
    const value = "Educación Intercultural Bilingüe";

    expect(normalizeSearchText(value)).toBe(
      "educacion intercultural bilingue",
    );
    expect(value).toBe("Educación Intercultural Bilingüe");
  });
});

describe("wrapChartLabel", () => {
  it("conserva las palabras y limita las líneas cuando es posible", () => {
    expect(wrapChartLabel("Participación institucional completa", 15)).toEqual(
      ["Participación", "institucional", "completa"],
    );
    expect(wrapChartLabel("Salud mental", 15)).toEqual(["Salud mental"]);
  });

  it("conserva una palabra que supera por sí sola el máximo", () => {
    expect(wrapChartLabel("Interculturalidad", 8)).toEqual([
      "Interculturalidad",
    ]);
  });
});
