// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AuthBrandMarks } from "./AuthBrandMarks";

describe("AuthBrandMarks", () => {
  afterEach(cleanup);

  it("presenta las dos marcas institucionales del acceso", () => {
    render(<AuthBrandMarks />);

    expect(
      screen.getByAltText("Escuelas Promotoras de Salud"),
    ).toBeInTheDocument();
    expect(screen.getByAltText("Gobierno de Mendoza")).toBeInTheDocument();
  });
});
