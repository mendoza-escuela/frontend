// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorPage } from "./ErrorPage";

describe("ErrorPage", () => {
  afterEach(cleanup);

  it.each([401, 403, 404, 500, 503])(
    "muestra el estado %s con una jerarquía accesible",
    (statusCode) => {
      render(
        <ErrorPage
          message="Mensaje comprensible para la persona usuaria."
          statusCode={statusCode}
          title={`Título ${statusCode}`}
        />,
      );

      expect(screen.getByText(`Error ${statusCode}`)).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 1, name: `Título ${statusCode}` }),
      ).toHaveFocus();
      expect(
        screen.getByText("Mensaje comprensible para la persona usuaria."),
      ).toBeInTheDocument();
    },
  );

  it("representa el error genérico sin inventar un código", () => {
    render(
      <ErrorPage
        message="No pudimos completar la operación."
        showBackButton={false}
        showHomeButton={false}
        title="Ocurrió un error"
      />,
    );

    expect(screen.getByText("Error")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Ocurrió un error" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Acciones para resolver el error"),
    ).not.toBeInTheDocument();
  });

  it("ofrece volver y navegar al inicio por defecto", () => {
    const onBack = vi.fn();
    render(
      <ErrorPage
        homePath="/inicio"
        message="La página no existe."
        onBack={onBack}
        statusCode={404}
        title="Página no encontrada"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Volver" }));

    expect(onBack).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute(
      "href",
      "/inicio",
    );
    expect(
      screen.getByAltText("Escuelas Promotoras de Salud"),
    ).toBeInTheDocument();
    expect(screen.getByAltText("Gobierno de Mendoza")).toBeInTheDocument();
  });

  it("permite dirigir una sesión inválida al login", () => {
    render(
      <ErrorPage
        loginPath="/ingresar"
        message="Tu sesión venció."
        showBackButton={false}
        showHomeButton={false}
        showLoginButton
        statusCode={401}
        title="Sesión expirada"
      />,
    );

    expect(
      screen.getByRole("link", { name: "Iniciar sesión nuevamente" }),
    ).toHaveAttribute("href", "/ingresar");
    expect(
      screen.queryByRole("button", { name: "Volver" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Ir al inicio" }),
    ).not.toBeInTheDocument();
  });

  it("solo expone identificadores de correlación con formato seguro", () => {
    const { rerender } = render(
      <ErrorPage
        correlationId="req_01J9-8f3a"
        message="No pudimos procesar la solicitud."
        statusCode={500}
        title="Error interno"
      />,
    );

    expect(screen.getByText("Identificador del error")).toBeInTheDocument();
    expect(screen.getByText("req_01J9-8f3a")).toBeInTheDocument();

    rerender(
      <ErrorPage
        correlationId={"Error: SELECT * FROM users\n/internal/server/path"}
        message="No pudimos procesar la solicitud."
        statusCode={500}
        title="Error interno"
      />,
    );

    expect(
      screen.queryByText("Identificador del error"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/SELECT \* FROM users/)).not.toBeInTheDocument();
  });
});
