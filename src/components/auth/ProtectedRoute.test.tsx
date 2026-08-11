// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { AuthContext, type AuthContextValue } from "../../hooks/auth-context";
import type { AuthUser, UserRole } from "../../types/auth";
import { ProtectedRoute } from "./ProtectedRoute";

describe("ProtectedRoute", () => {
  afterEach(cleanup);

  it("muestra un estado de espera mientras verifica la sesión", () => {
    renderProtectedRoute({ isLoading: true });

    expect(screen.getByText("Verificando sesión…")).toBeVisible();
    expect(screen.queryByText("Contenido privado")).not.toBeInTheDocument();
  });

  it("envía al login una sesión inexistente y conserva el origen completo", async () => {
    renderProtectedRoute({
      initialEntry: "/privada?campana=2026#detalle",
      user: null,
    });

    expect(
      await screen.findByRole("heading", { name: "Destino login" }),
    ).toBeVisible();
    expect(screen.getByTestId("destination-path")).toHaveTextContent("/login");
    expect(screen.getByTestId("destination-from")).toHaveTextContent(
      "/privada?campana=2026#detalle",
    );
  });

  it("distingue una sesión expirada de una visita no autenticada", async () => {
    renderProtectedRoute({ sessionExpired: true, user: null });

    expect(
      await screen.findByRole("heading", { name: "Destino error 401" }),
    ).toBeVisible();
    expect(screen.getByTestId("destination-path")).toHaveTextContent(
      "/error/401",
    );
    expect(screen.getByTestId("destination-from")).toHaveTextContent(
      "/privada",
    );
  });

  it.each([403, 500, 503] as const)(
    "envía un fallo de autenticación %s a su página global",
    async (authenticationErrorStatus) => {
      renderProtectedRoute({ authenticationErrorStatus, user: null });

      expect(
        await screen.findByRole("heading", {
          name: `Destino error ${authenticationErrorStatus}`,
        }),
      ).toBeVisible();
      expect(screen.getByTestId("destination-path")).toHaveTextContent(
        `/error/${authenticationErrorStatus}`,
      );
    },
  );

  it("muestra 403 cuando el rol no está autorizado", async () => {
    renderProtectedRoute({ roles: ["school"], user: user("admin") });

    expect(
      await screen.findByRole("heading", { name: "Destino error 403" }),
    ).toBeVisible();
    expect(screen.getByTestId("destination-from")).toHaveTextContent(
      "/privada",
    );
  });

  it("obliga a cambiar la contraseña antes de abrir una ruta privada", async () => {
    renderProtectedRoute({
      user: { ...user("admin"), mustChangePassword: true },
    });

    expect(
      await screen.findByRole("heading", { name: "Cambiar contraseña" }),
    ).toBeVisible();
    expect(screen.getByTestId("destination-path")).toHaveTextContent(
      "/cambiar-clave",
    );
  });

  it("permite la ruta de cambio de contraseña cuando se solicita", () => {
    renderProtectedRoute({
      allowPasswordChange: true,
      user: { ...user("admin"), mustChangePassword: true },
    });

    expect(screen.getByText("Contenido privado")).toBeVisible();
  });

  it("renderiza el contenido para un rol permitido", () => {
    renderProtectedRoute({ roles: ["admin"], user: user("admin") });

    expect(screen.getByText("Contenido privado")).toBeVisible();
  });
});

type RenderProtectedRouteOptions = Partial<
  Pick<
    AuthContextValue,
    | "authenticationErrorStatus"
    | "isLoading"
    | "sessionExpired"
    | "user"
  >
> & {
  allowPasswordChange?: boolean;
  initialEntry?: string;
  roles?: UserRole[];
};

function renderProtectedRoute({
  allowPasswordChange,
  authenticationErrorStatus = null,
  initialEntry = "/privada",
  isLoading = false,
  roles,
  sessionExpired = false,
  user: currentUser = user("admin"),
}: RenderProtectedRouteOptions = {}) {
  const authValue: AuthContextValue = {
    authenticationErrorStatus,
    isLoading,
    login: async () => user("admin"),
    logout: async () => undefined,
    refreshUser: async () => undefined,
    sessionExpired,
    user: currentUser,
  };

  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route
            element={
              <ProtectedRoute
                allowPasswordChange={allowPasswordChange}
                roles={roles}
              />
            }
          >
            <Route element={<p>Contenido privado</p>} path="/privada" />
          </Route>
          <Route element={<Destination title="Destino login" />} path="/login" />
          <Route
            element={<Destination title="Cambiar contraseña" />}
            path="/cambiar-clave"
          />
          <Route element={<ErrorDestination />} path="/error/:statusCode" />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

function ErrorDestination() {
  const { statusCode } = useParams();
  return <Destination title={`Destino error ${statusCode}`} />;
}

function Destination({ title }: { title: string }) {
  const location = useLocation();
  const state = location.state as { from?: string } | null;

  return (
    <main>
      <h1>{title}</h1>
      <output data-testid="destination-path">{location.pathname}</output>
      <output data-testid="destination-from">{state?.from ?? ""}</output>
    </main>
  );
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
