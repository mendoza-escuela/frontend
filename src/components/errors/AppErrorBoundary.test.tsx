// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppErrorBoundary } from "./AppErrorBoundary";

describe("AppErrorBoundary", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renderiza normalmente cuando sus descendientes no fallan", () => {
    render(
      <AppErrorBoundary>
        <p>Aplicación disponible</p>
      </AppErrorBoundary>,
    );

    expect(screen.getByText("Aplicación disponible")).toBeVisible();
  });

  it("muestra un 500 saneado sin exponer el mensaje ni el stack", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const TechnicalFailure = () => {
      throw new Error(
        "password=secreto SQLSTATE 28P01 at /srv/backend/database.ts:42",
      );
    };

    render(
      <AppErrorBoundary>
        <TechnicalFailure />
      </AppErrorBoundary>,
    );

    expect(screen.getByText("Error 500")).toBeVisible();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "No pudimos completar la solicitud",
      }),
    ).toBeVisible();
    expect(screen.queryByText(/password=secreto/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/SQLSTATE/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/database\.ts/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Volver" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
