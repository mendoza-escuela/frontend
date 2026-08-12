// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { SchoolRectificationStatus } from "../../types/admin-school";
import { RectificationStatusNotice } from "./RectificationStatusNotice";

const baseStatus: SchoolRectificationStatus = {
  periodYear: 2026,
  isRectified: false,
  rectifiedAt: "2026-08-10T15:00:00.000Z",
  rectifiedBy: null,
};

describe("RectificationStatusNotice", () => {
  afterEach(cleanup);

  it("separa una confirmación existente de una ficha que requiere actualización", () => {
    render(
      <RectificationStatusNotice
        status={{
          ...baseStatus,
          isConfirmed: true,
          isEvaluationReady: false,
          missingFields: [
            { code: "hasKiosk", label: "Kiosco" },
            {
              code: "hasFoodService",
              label: "Comedor o servicio alimentario",
            },
          ],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Confirmada el 10/08/2026; requiere actualización",
      }),
    ).toBeVisible();
    expect(screen.queryByText(/pendiente/i)).not.toBeInTheDocument();
    const fields = screen.getByRole("list", {
      name: "Datos pendientes de la ficha",
    });
    expect(fields).toHaveTextContent("Kiosco");
    expect(fields).toHaveTextContent("Comedor o servicio alimentario");
  });

  it("mantiene el fallback de despliegue para una confirmación histórica incompleta", () => {
    render(<RectificationStatusNotice status={baseStatus} />);

    expect(
      screen.getByRole("heading", {
        name: "Confirmada el 10/08/2026; requiere actualización",
      }),
    ).toBeVisible();
  });

  it("formatea la fecha en la zona horaria de Mendoza", () => {
    render(
      <RectificationStatusNotice
        status={{
          ...baseStatus,
          rectifiedAt: "2026-08-10T02:30:00.000Z",
        }}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Confirmada el 09/08/2026; requiere actualización",
      }),
    ).toBeVisible();
  });

  it("distingue una ficha sin confirmación anual", () => {
    render(
      <RectificationStatusNotice
        status={{
          ...baseStatus,
          isConfirmed: false,
          isEvaluationReady: false,
          rectifiedAt: null,
          missingFields: [{ code: "hasKiosk", label: "Kiosco" }],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Confirmación pendiente para 2026",
      }),
    ).toBeVisible();
    expect(screen.getByText("Kiosco")).toBeVisible();
  });

  it("muestra una confirmación completa como lista para evaluar", () => {
    render(
      <RectificationStatusNotice
        status={{
          ...baseStatus,
          isConfirmed: true,
          isEvaluationReady: true,
          isRectified: true,
          missingFields: [],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Confirmada el 10/08/2026 y lista para evaluar",
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole("list", { name: "Datos pendientes de la ficha" }),
    ).not.toBeInTheDocument();
  });
});
