import { describe, expect, it } from "vitest";
import {
  legacyCatalogValue,
  officialCatalogLabel,
} from "./official-catalog";

const educationTypes = [{ code: "common", label: "Común" }];

describe("official catalog helpers", () => {
  it("normaliza espacios de un código o etiqueta oficial", () => {
    expect(officialCatalogLabel(educationTypes, " common ")).toBe("Común");
    expect(officialCatalogLabel(educationTypes, " Común ")).toBe("Común");
  });

  it("conserva un nivel legado sin inferir un tipo de educación", () => {
    expect(officialCatalogLabel(educationTypes, "Primario")).toBeUndefined();
    expect(legacyCatalogValue(educationTypes, " Primario ")).toBe("Primario");
  });
});
