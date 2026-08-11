// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  createMemoryRouter,
  MemoryRouter,
  Route,
  RouterProvider,
  Routes,
  type InitialEntry,
} from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthContextValue } from "../hooks/auth-context";
import type { AuthUser, UserRole } from "../types/auth";
import { ErrorRoutePage, RouteErrorBoundaryPage } from "./ErrorRoutePage";

const supportedErrors = [
  [401, "Tu sesión finalizó"],
  [403, "No tenés permisos para acceder"],
  [404, "No encontramos esta página"],
  [500, "No pudimos completar la solicitud"],
  [503, "Servicio temporalmente no disponible"],
] as const;

describe("ErrorRoutePage", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it.each(supportedErrors)(
    "resuelve /error/%s con su contenido institucional",
    (statusCode, title) => {
      renderErrorRoute(`/error/${statusCode}`);

      expect(screen.getByText(`Error ${statusCode}`)).toBeVisible();
      expect(
        screen.getByRole("heading", { level: 1, name: title }),
      ).toBeVisible();
    },
  );

  it("usa el estado genérico para un código no contemplado", () => {
    renderErrorRoute("/error/418");

    expect(screen.getByText(/^Error$/)).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 1, name: "Ocurrió un problema" }),
    ).toBeVisible();
    expect(screen.queryByText("Error 418")).not.toBeInTheDocument();
  });

  it("usa el estado genérico explícito sin inventar un código", () => {
    renderErrorRoute("/error", "generic");

    expect(screen.getByText(/^Error$/)).toBeVisible();
    expect(
      screen.getByText(
        "No pudimos completar la operación. Volvé a intentarlo o regresá al inicio.",
      ),
    ).toBeVisible();
  });

  it("ignora título, mensaje, stack e identificador técnico de la query", () => {
    renderErrorRoute(
      "/error/500?title=Base%20de%20datos&message=SELECT%20*%20FROM%20users&stack=%2Finternal%2Fserver.ts&correlationId=sql-secret",
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "No pudimos completar la solicitud",
      }),
    ).toBeVisible();
    expect(screen.queryByText(/Base de datos/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/SELECT \* FROM users/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/internal\/server\.ts/i)).not.toBeInTheDocument();
    expect(screen.queryByText("sql-secret")).not.toBeInTheDocument();
  });

  it("muestra sólo un correlation ID seguro recibido por estado interno", () => {
    renderErrorRoute({
      pathname: "/error/503",
      state: { correlationId: "req_01J9-8f3a" },
    });

    expect(screen.getByText("Identificador del error")).toBeVisible();
    expect(screen.getByText("req_01J9-8f3a")).toBeVisible();

    cleanup();
    renderErrorRoute({
      pathname: "/error/503",
      state: {
        correlationId: "Error: SELECT * FROM users\n/internal/server/path",
      },
    });

    expect(
      screen.queryByText("Identificador del error"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/SELECT \* FROM users/i)).not.toBeInTheDocument();
  });

  it("conserva un retorno interno seguro en el enlace de una sesión expirada", () => {
    renderErrorRoute({
      pathname: "/error/401",
      state: { from: "/admin/usuarios?pagina=2#usuario" },
    });

    expect(
      screen.getByRole("link", { name: "Iniciar sesión nuevamente" }),
    ).toHaveAttribute(
      "href",
      "/login?returnTo=%2Fadmin%2Fusuarios%3Fpagina%3D2%23usuario",
    );
  });

  it("descarta retornos externos o inyectados", () => {
    renderErrorRoute({
      pathname: "/error/401",
      state: { from: "//malicioso.example/robo" },
    });

    expect(
      screen.getByRole("link", { name: "Iniciar sesión nuevamente" }),
    ).toHaveAttribute("href", "/login");
  });

  it("dirige al panel correspondiente cuando existe una sesión", () => {
    renderErrorRoute("/error/403", undefined, user("school"));

    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute(
      "href",
      "/colegio",
    );
  });

  it("vuelve al historial seguro sin reabrir el recurso que produjo el error", async () => {
    render(
      <AuthContext.Provider value={authValue(user("admin"))}>
        <MemoryRouter
          initialEntries={[
            "/admin",
            {
              pathname: "/error/403",
              state: { from: "/colegio/recurso-denegado" },
            },
          ]}
          initialIndex={1}
        >
          <Routes>
            <Route element={<h1>Panel seguro</h1>} path="/admin" />
            <Route element={<ErrorRoutePage />} path="/error/:statusCode" />
            <Route
              element={<h1>Recurso denegado</h1>}
              path="/colegio/recurso-denegado"
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Volver" }));

    expect(
      await screen.findByRole("heading", { name: "Panel seguro" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "Recurso denegado" }),
    ).not.toBeInTheDocument();
  });
});

describe("RouteErrorBoundaryPage", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it.each(supportedErrors)(
    "traduce una respuesta de ruta %s sin reflejar detalles técnicos",
    async (statusCode, title) => {
      renderRouteBoundary(() => {
        throw new Response(
          JSON.stringify({
            message: "SELECT password_hash FROM users",
            stack: "/srv/app/private.ts:42",
          }),
          {
            headers: { "Content-Type": "application/json" },
            status: statusCode,
          },
        );
      });

      expect(
        await screen.findByRole("heading", { level: 1, name: title }),
      ).toBeVisible();
      expect(
        screen.queryByText(/SELECT password_hash FROM users/i),
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/private\.ts/i)).not.toBeInTheDocument();
    },
  );

  it("convierte una respuesta no contemplada en un 500 seguro", async () => {
    renderRouteBoundary(() => {
      throw new Response("Ruta interna /srv/api", { status: 418 });
    });

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "No pudimos completar la solicitud",
      }),
    ).toBeVisible();
    expect(screen.getByText("Error 500")).toBeVisible();
    expect(screen.queryByText(/\/srv\/api/i)).not.toBeInTheDocument();
  });

  it("acepta un correlation ID seguro y descarta el resto del payload", async () => {
    renderRouteBoundary(() => {
      throw new Response(
        JSON.stringify({
          correlationId: "req-2026.08.11:abc",
          message: "SQLSTATE 28P01",
          stack: "/srv/backend/main.ts",
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 503,
        },
      );
    });

    expect(await screen.findByText("req-2026.08.11:abc")).toBeVisible();
    expect(screen.queryByText(/SQLSTATE/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/backend\/main\.ts/i)).not.toBeInTheDocument();
  });

  it("sanea un error inesperado durante el render", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const TechnicalFailure = () => {
      throw new Error(
        "SELECT * FROM credentials at /internal/server/database.ts",
      );
    };
    const router = createMemoryRouter(
      [
        {
          element: <TechnicalFailure />,
          errorElement: <RouteErrorBoundaryPage />,
          path: "/falla",
        },
      ],
      { initialEntries: ["/falla"] },
    );

    render(<RouterProvider router={router} />);

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "No pudimos completar la solicitud",
      }),
    ).toBeVisible();
    expect(screen.getByText("Error 500")).toBeVisible();
    expect(screen.queryByText(/SELECT \* FROM credentials/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/database\.ts/i)).not.toBeInTheDocument();
  });
});

function renderErrorRoute(
  initialEntry: InitialEntry,
  explicitStatusCode?: "generic",
  currentUser: AuthUser | null = null,
) {
  return render(
    <AuthContext.Provider value={authValue(currentUser)}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            element={<ErrorRoutePage statusCode={explicitStatusCode} />}
            path={explicitStatusCode ? "/error" : "/error/:statusCode"}
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

function renderRouteBoundary(loader: () => never) {
  const router = createMemoryRouter(
    [
      {
        element: <p>No debería renderizarse</p>,
        errorElement: <RouteErrorBoundaryPage />,
        loader,
        path: "/falla",
      },
    ],
    { initialEntries: ["/falla"] },
  );

  return render(<RouterProvider router={router} />);
}

function authValue(currentUser: AuthUser | null): AuthContextValue {
  return {
    authenticationErrorStatus: null,
    isLoading: false,
    login: async () => user("admin"),
    logout: async () => undefined,
    refreshUser: async () => undefined,
    sessionExpired: false,
    user: currentUser,
  };
}

function user(role: UserRole): AuthUser {
  return {
    email: `${role}@example.com`,
    firstName: "Usuario",
    id: `${role}-1`,
    lastLoginAt: "2026-08-11T12:00:00.000Z",
    lastName: "Prueba",
    mustChangePassword: false,
    role,
  };
}
