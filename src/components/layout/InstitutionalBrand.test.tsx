// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InstitutionalBrand } from "./InstitutionalBrand";

describe("InstitutionalBrand", () => {
  afterEach(() => cleanup());

  it("usa los assets versionados de Escuelas Promotoras y Mendoza", () => {
    render(<InstitutionalBrand compact />);

    expect(screen.getByAltText("Gobierno de Mendoza")).toHaveAttribute(
      "src",
      "/brand/official/mendoza/marca-gobierno-mendoza.png",
    );
    expect(
      screen.getByAltText("Escuelas Promotoras de Salud Mendoza"),
    ).toHaveAttribute("src", "/brand/official/eps/eps-mendoza.jpg");
    expect(screen.getAllByRole("img")).toHaveLength(2);
  });

  it("presenta ambas marcas sobre una base blanca en superficies azules", () => {
    render(<InstitutionalBrand compact surface="blue" />);

    for (const image of screen.getAllByRole("img")) {
      expect(image.parentElement).toHaveClass("bg-white");
    }
    expect(screen.getAllByRole("img")).toHaveLength(2);
  });

  it("muestra texto si el asset de Mendoza no se puede cargar", () => {
    render(<InstitutionalBrand compact organizationKeys={["mendoza"]} />);

    fireEvent.error(screen.getByAltText("Gobierno de Mendoza"));
    expect(screen.getByText("Gobierno de Mendoza")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("respeta el orden solicitado para la composición institucional", () => {
    render(<InstitutionalBrand organizationKeys={["eps", "mendoza"]} />);

    expect(
      screen.getAllByRole("img").map((image) => image.getAttribute("alt")),
    ).toEqual(["Escuelas Promotoras de Salud Mendoza", "Gobierno de Mendoza"]);
  });
});
