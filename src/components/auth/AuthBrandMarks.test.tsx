// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AuthBrandMarks } from "./AuthBrandMarks";

describe("AuthBrandMarks", () => {
  afterEach(cleanup);

  it("presenta las tres marcas institucionales del acceso", () => {
    render(<AuthBrandMarks />);

    expect(
      screen.getByAltText("Escuelas Promotoras de Salud Mendoza"),
    ).toBeInTheDocument();
    expect(screen.getByAltText("Gobierno de Mendoza")).toBeInTheDocument();
    expect(
      screen.getByAltText("Organización Panamericana de la Salud"),
    ).toHaveAttribute("src", "/brand/official/ops/ops-blue-horizontal.png");
    expect(
      screen.getByLabelText("Identidad institucional"),
    ).toHaveClass("grid-cols-1", "sm:grid-cols-[1.3fr_1fr_0.9fr]");
    expect(
      screen.queryByLabelText("Instituciones acompañantes"),
    ).not.toBeInTheDocument();
  });
});
