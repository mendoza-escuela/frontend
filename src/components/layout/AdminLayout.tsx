import {
  Building2,
  CalendarRange,
  ClipboardList,
  Home,
  LogOut,
  School,
  Upload,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { showError } from "../../lib/toast";

const links = [
  { to: "/admin", label: "Inicio", icon: Home, end: true },
  { to: "/admin/usuarios", label: "Usuarios", icon: Users, end: true },
  { to: "/admin/usuarios/importar", label: "Importar usuarios", icon: Upload },
  { to: "/admin/colegios", label: "Colegios", icon: School, end: true },
  { to: "/admin/colegios/importar", label: "Importar colegios", icon: Upload },
  {
    to: "/admin/cuestionarios",
    label: "Cuestionarios",
    icon: ClipboardList,
  },
  {
    to: "/admin/campanas",
    label: "Campañas",
    icon: CalendarRange,
  },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const closeSession = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      showError("No se pudo cerrar la sesión correctamente.");
    }
  };

  return (
    <div className="min-h-screen bg-mendoza-background lg:flex">
      <aside className="bg-mendoza-blue p-4 text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:self-start lg:overflow-y-auto lg:p-6">
        <div className="flex items-center gap-3 border-b border-white/20 pb-5">
          <Building2 aria-hidden="true" />
          <div>
            <p className="font-bold">Escuelas Promotoras</p>
            <p className="text-xs text-white/75">Administración</p>
          </div>
        </div>
        <nav
          aria-label="Administración"
          className="mt-5 flex gap-2 overflow-x-auto lg:flex-col"
        >
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              className={({ isActive }) =>
                `flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? "bg-mendoza-sky text-mendoza-text" : "text-white hover:bg-white/10"}`
              }
              end={end}
              key={to}
              to={to}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-mendoza-border bg-white px-4 py-4 sm:px-8">
          <div>
            <p className="text-sm text-mendoza-muted">Sesión de administrador</p>
            <p className="font-semibold text-mendoza-text">
              {user?.firstName} {user?.lastName}
            </p>
          </div>
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-mendoza-blue px-4 text-sm font-semibold text-mendoza-blue hover:bg-mendoza-blue-soft"
            onClick={closeSession}
            type="button"
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
