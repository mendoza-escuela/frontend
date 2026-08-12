// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DimensionRadar } from "./PreliminaryResultRadar";

const titles = [
  "Compromiso Institucional y Planificación Estratégica",
  "Articulación con los Equipos de Salud",
  "Entorno Alimentario Seguro y Saludable",
  "Actividad Física y Entorno Favorecedor",
  "Espacios 100% Libres de Humo de Tabaco",
  "Salud Mental y Bienestar Emocional",
];

describe("DimensionRadar", () => {
  afterEach(cleanup);

  it("renders the 0 and 100 boundaries with a complete textual alternative", () => {
    render(
      <DimensionRadar
        dimensions={titles.map((title, order) => ({
          code: `dimension-${order}`,
          title,
          order,
          score: order === 0 ? 0 : order === 5 ? 100 : 50,
        }))}
      />,
    );

    expect(
      screen.getByRole("img", {
        name: "Gráfico radar con los resultados de las seis dimensiones",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("0 / 100")).toBeVisible();
    expect(screen.getByText("100 / 100")).toBeVisible();
    for (const title of titles)
      expect(screen.getAllByText(title).at(-1)).toBeVisible();
  });

  it("does not invent zero when a dimension is missing", () => {
    render(
      <DimensionRadar
        dimensions={titles.map((title, order) => ({
          code: `dimension-${order}`,
          title,
          order,
          score: order === 2 ? null : 75,
        }))}
      />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "sin los seis puntajes",
    );
    expect(screen.getByText("No disponible")).toBeVisible();
  });
});
