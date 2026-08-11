import {
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Plus,
  Search,
  ShieldBan,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { SchoolCombobox } from "../../components/users/SchoolCombobox";
import { getHttpErrorMessage } from "../../lib/http-error";
import { showError, showSuccess } from "../../lib/toast";
import { strongPasswordSchema } from "../../lib/validation";
import {
  adminUsersService,
  type UserFilters,
} from "../../services/admin-users.service";
import type {
  ManagedUser,
  SchoolOption,
  UserListResponse,
} from "../../types/admin-user";

const emptyList: UserListResponse = {
  items: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
};

export function UsersAdminPage() {
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 20,
    role: "",
    isActive: "",
    schoolId: "",
  });
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState(emptyList);
  const [selectedSchool, setSelectedSchool] = useState<SchoolOption | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const listRequest = useRef<AbortController | null>(null);
  const [resetUser, setResetUser] = useState<ManagedUser | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false);

  const openPasswordReset = (user: ManagedUser) => {
    setResetUser(user);
    setTemporaryPassword("");
    setShowTemporaryPassword(false);
  };

  const closePasswordReset = () => {
    setResetUser(null);
    setTemporaryPassword("");
    setShowTemporaryPassword(false);
  };

  const loadUsers = async (nextFilters = filters) => {
    listRequest.current?.abort();
    const controller = new AbortController();
    listRequest.current = controller;
    setLoading(true);
    try {
      setUsers(await adminUsersService.list(nextFilters, controller.signal));
    } catch (error) {
      if (!controller.signal.aborted) showError(getHttpErrorMessage(error));
    } finally {
      if (listRequest.current === controller) setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
    return () => listRequest.current?.abort();
  }, []);

  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    const next = { ...filters, search: search.trim(), page: 1 };
    setFilters(next);
    void loadUsers(next);
  };

  const changePage = (page: number) => {
    const next = { ...filters, page };
    setFilters(next);
    void loadUsers(next);
  };

  const toggleStatus = async (user: ManagedUser) => {
    try {
      await adminUsersService.setStatus(user.id, !user.isActive);
      showSuccess(
        user.isActive
          ? "Usuario bloqueado y sesiones cerradas."
          : "Usuario desbloqueado.",
      );
      await loadUsers();
    } catch (error) {
      showError(getHttpErrorMessage(error));
    }
  };

  const resetPassword = async () => {
    if (!resetUser) return;
    const validation = strongPasswordSchema.safeParse(temporaryPassword);
    if (!validation.success)
      return showError(
        validation.error.issues[0]?.message ?? "Contraseña inválida.",
      );
    try {
      await adminUsersService.resetPassword(resetUser.id, temporaryPassword);
      showSuccess(
        "Contraseña restablecida. Se cerraron las sesiones del usuario.",
      );
      closePasswordReset();
      await loadUsers();
    } catch (error) {
      showError(getHttpErrorMessage(error));
    }
  };

  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-mendoza-blue">
              Administración
            </p>
            <h1 className="mt-1 text-3xl font-bold text-mendoza-text">Usuarios</h1>
            <p className="mt-2 text-mendoza-muted">
              {users.pagination.total} cuentas registradas
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-mendoza-blue bg-white px-4 text-sm font-semibold text-mendoza-blue"
              to="/admin/usuarios/importar"
            >
              <Upload size={17} />
              Importar usuarios
            </Link>
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-mendoza-blue px-4 text-sm font-semibold text-white"
              to="/admin/usuarios/nuevo"
            >
              <Plus size={17} />
              Nuevo usuario
            </Link>
          </div>
        </div>
        <form
          className="mt-6 grid gap-3 rounded-2xl border border-mendoza-border bg-white p-4 shadow-sm md:grid-cols-5"
          onSubmit={applyFilters}
        >
          <label className="text-sm font-semibold md:col-span-2">
            Buscar
            <input
              className="mt-1 w-full rounded-lg border border-mendoza-border px-3 py-2.5"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nombre, apellido o correo"
              value={search}
            />
          </label>
          <label className="text-sm font-semibold">
            Rol
            <select
              className="mt-1 w-full rounded-lg border border-mendoza-border px-3 py-2.5"
              onChange={(e) =>
                setFilters({
                  ...filters,
                  role: e.target.value as UserFilters["role"],
                })
              }
              value={filters.role}
            >
              <option value="">Todos</option>
              <option value="admin">Administrador Central</option>
              <option value="school">Escuela</option>
            </select>
          </label>
          <label className="text-sm font-semibold">
            Estado
            <select
              className="mt-1 w-full rounded-lg border border-mendoza-border px-3 py-2.5"
              onChange={(e) =>
                setFilters({
                  ...filters,
                  isActive:
                    e.target.value === "" ? "" : e.target.value === "true",
                })
              }
              value={String(filters.isActive)}
            >
              <option value="">Todos</option>
              <option value="true">Activo</option>
              <option value="false">Bloqueado</option>
            </select>
          </label>
          <SchoolCombobox
            allowClear
            disableInactive={false}
            label="Colegio"
            onChange={(school) => {
              setSelectedSchool(school);
              setFilters({ ...filters, schoolId: school?.id ?? "" });
            }}
            placeholder="Todos"
            selectedSchool={selectedSchool}
          />
          <Button
            className="md:col-start-5"
            icon={<Search size={17} />}
            type="submit"
          >
            Aplicar filtros
          </Button>
        </form>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-mendoza-border bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-mendoza-blue text-white">
              <tr>
                {[
                  "Usuario",
                  "Rol",
                  "Colegio",
                  "Estado",
                  "Último acceso",
                  "Acciones",
                ].map((header) => (
                  <th className="px-4 py-3 font-semibold" key={header}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-mendoza-border">
              {loading ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-mendoza-muted"
                    colSpan={6}
                  >
                    Cargando usuarios…
                  </td>
                </tr>
              ) : users.items.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-mendoza-muted"
                    colSpan={6}
                  >
                    No hay usuarios para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                users.items.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-mendoza-text">
                        {user.lastName}, {user.firstName}
                      </p>
                      <p className="text-mendoza-muted">{user.email}</p>
                      {user.mustChangePassword && (
                        <span className="mt-1 inline-block text-xs font-semibold text-mendoza-gold">
                          Cambio de clave pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.role === "admin"
                        ? "Administrador Central"
                        : "Escuela"}
                    </td>
                    <td className="px-4 py-3">
                      {user.school
                        ? `${user.school.cue} - ${user.school.name}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {user.isActive ? "Activo" : "Bloqueado"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-mendoza-muted">
                      {user.lastLoginAt
                        ? new Intl.DateTimeFormat("es-AR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(user.lastLoginAt))
                        : "Sin accesos"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Link
                          aria-label={`Editar ${user.email}`}
                          className="rounded-lg p-2 text-mendoza-blue hover:bg-mendoza-blue-soft"
                          to={`/admin/usuarios/${user.id}/editar`}
                        >
                          <Pencil size={17} />
                        </Link>
                        <button
                          aria-label={`Restablecer contraseña de ${user.email}`}
                          className="rounded-lg p-2 text-mendoza-blue hover:bg-mendoza-blue-soft"
                          onClick={() => openPasswordReset(user)}
                          type="button"
                        >
                          <KeyRound size={17} />
                        </button>
                        <button
                          aria-label={
                            user.isActive
                              ? `Bloquear ${user.email}`
                              : `Desbloquear ${user.email}`
                          }
                          className={`rounded-lg p-2 ${user.isActive ? "text-mendoza-error hover:bg-red-50" : "text-green-700 hover:bg-green-50"}`}
                          onClick={() => void toggleStatus(user)}
                          type="button"
                        >
                          {user.isActive ? (
                            <ShieldBan size={17} />
                          ) : (
                            <ShieldCheck size={17} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          loading={loading}
          onPageChange={changePage}
          pagination={users.pagination}
        />
      </div>
      {resetUser && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-40 grid place-items-center bg-black/45 p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-bold text-mendoza-blue">
              Restablecer contraseña
            </h2>
            <p className="mt-2 text-sm text-mendoza-muted">
              Se cerrarán todas las sesiones de {resetUser.email} y se exigirá
              cambiar la clave al ingresar.
            </p>
            <label className="mt-5 block text-sm font-semibold">
              Contraseña temporal
              <span className="relative mt-2 block">
                <input
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-mendoza-border px-3 py-2.5 pr-11 outline-none focus:border-mendoza-sky focus:ring-2 focus:ring-mendoza-sky/25"
                  onChange={(event) =>
                    setTemporaryPassword(event.target.value)
                  }
                  type={showTemporaryPassword ? "text" : "password"}
                  value={temporaryPassword}
                />
                <button
                  aria-label={
                    showTemporaryPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  aria-pressed={showTemporaryPassword}
                  className="absolute inset-y-0 right-0 rounded-r-lg px-3 text-mendoza-muted outline-none hover:text-mendoza-blue focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mendoza-sky"
                  onClick={() =>
                    setShowTemporaryPassword((current) => !current)
                  }
                  type="button"
                >
                  {showTemporaryPassword ? (
                    <EyeOff aria-hidden="true" size={18} />
                  ) : (
                    <Eye aria-hidden="true" size={18} />
                  )}
                </button>
              </span>
            </label>
            <p className="mt-2 text-xs text-mendoza-muted">
              Mínimo 12 caracteres con mayúscula, minúscula, número y símbolo.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                onClick={closePasswordReset}
                variant="outline"
              >
                Cancelar
              </Button>
              <Button onClick={() => void resetPassword()}>Restablecer</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
