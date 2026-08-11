// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { PublicHeader } from "./PublicHeader";

describe("PublicHeader", () => {
  afterEach(() => cleanup());

  it("mantiene la identidad del programa e incorpora la marca Mendoza", () => {
    render(
      <MemoryRouter>
        <PublicHeader />
      </MemoryRouter>,
    );

    expect(
      screen.getByAltText("Escuelas Promotoras de Salud"),
    ).toBeInTheDocument();
    expect(screen.getByAltText("Gobierno de Mendoza")).toHaveAttribute(
      "src",
      "/brand/official/mendoza/marca-gobierno-mendoza.png",
    );
  });
});
