// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InstitutionalBrand } from "./InstitutionalBrand";

describe("InstitutionalBrand", () => {
  afterEach(() => cleanup());

  it("usa los assets versionados y conserva los organismos sin asset como texto", () => {
    render(<InstitutionalBrand compact />);

    expect(screen.getByAltText("Gobierno de Mendoza")).toHaveAttribute(
      "src",
      "/brand/official/mendoza/marca-gobierno-mendoza.png",
    );
    expect(
      screen.getByAltText(
        "Organización Panamericana de la Salud y Organización Mundial de la Salud",
      ),
    ).toHaveAttribute("src", "/brand/official/ops/ops-horizontal.avif");
    expect(screen.getByText("Salud")).toBeInTheDocument();
    expect(
      screen.getByText("Dirección General de Escuelas"),
    ).toBeInTheDocument();
  });

  it("usa el JPG de OPS como respaldo y finalmente conserva su etiqueta", () => {
    render(
      <InstitutionalBrand compact organizationKeys={["ops"]} />,
    );

    const preferredAsset = screen.getByAltText(
      "Organización Panamericana de la Salud y Organización Mundial de la Salud",
    );
    fireEvent.error(preferredAsset);

    const fallbackAsset = screen.getByAltText(
      "Organización Panamericana de la Salud y Organización Mundial de la Salud",
    );
    expect(fallbackAsset).toHaveAttribute(
      "src",
      "/brand/official/ops/oms-ops.jpg",
    );

    fireEvent.error(fallbackAsset);
    expect(
      screen.getByText(
        "Organización Panamericana de la Salud y Organización Mundial de la Salud",
      ),
    ).toBeInTheDocument();
  });

  it("protege los logos con un contenedor claro sobre la superficie azul", () => {
    render(
      <InstitutionalBrand
        compact
        organizationKeys={["mendoza", "ops"]}
        surface="blue"
      />,
    );

    for (const image of screen.getAllByRole("img")) {
      expect(image).toHaveClass("object-contain");
      expect(image.parentElement).toHaveClass("bg-white");
    }
  });

  it("muestra texto si el asset de Mendoza no se puede cargar", () => {
    render(
      <InstitutionalBrand compact organizationKeys={["mendoza"]} />,
    );

    fireEvent.error(screen.getByAltText("Gobierno de Mendoza"));
    expect(screen.getByText("Gobierno de Mendoza")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
