// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InstitutionalBrand } from "./InstitutionalBrand";

describe("InstitutionalBrand", () => {
  afterEach(() => cleanup());

  it("usa los assets versionados de OPS, Escuelas Promotoras y Mendoza", () => {
    render(<InstitutionalBrand compact />);

    expect(screen.getByAltText("Gobierno de Mendoza")).toHaveAttribute(
      "src",
      "/brand/official/mendoza/marca-gobierno-mendoza.png",
    );
    expect(
      screen.getByAltText("Organización Panamericana de la Salud"),
    ).toHaveAttribute("src", "/brand/official/ops/ops-blue-horizontal.png");
    expect(
      screen.getByAltText("Escuelas Promotoras de Salud Mendoza"),
    ).toHaveAttribute("src", "/brand/official/eps/eps-mendoza.jpg");
    expect(screen.getAllByRole("img")).toHaveLength(3);
  });

  it("conserva la identificación textual de OPS si el asset falla", () => {
    render(<InstitutionalBrand compact organizationKeys={["ops"]} />);

    fireEvent.error(
      screen.getByAltText("Organización Panamericana de la Salud"),
    );
    expect(
      screen.getByText("Organización Panamericana de la Salud"),
    ).toBeInTheDocument();
  });

  it("usa la variante blanca de OPS directamente sobre la superficie azul", () => {
    render(
      <InstitutionalBrand
        compact
        organizationKeys={["mendoza", "ops"]}
        surface="blue"
      />,
    );

    expect(
      screen.getByAltText("Organización Panamericana de la Salud"),
    ).toHaveAttribute("src", "/brand/official/ops/ops-white-stacked.png");
    expect(
      screen.getByAltText("Organización Panamericana de la Salud").parentElement,
    ).not.toHaveClass("bg-white");
    expect(screen.getByAltText("Gobierno de Mendoza").parentElement).toHaveClass(
      "bg-white",
    );
  });

  it("muestra texto si el asset de Mendoza no se puede cargar", () => {
    render(
      <InstitutionalBrand compact organizationKeys={["mendoza"]} />,
    );

    fireEvent.error(screen.getByAltText("Gobierno de Mendoza"));
    expect(screen.getByText("Gobierno de Mendoza")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("respeta el orden solicitado para la composición institucional", () => {
    render(
      <InstitutionalBrand organizationKeys={["ops", "eps", "mendoza"]} />,
    );

    expect(screen.getAllByRole("img").map((image) => image.getAttribute("alt"))).toEqual([
      "Organización Panamericana de la Salud",
      "Escuelas Promotoras de Salud Mendoza",
      "Gobierno de Mendoza",
    ]);
  });
});
