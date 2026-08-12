import {
  BarChart3,
  Building2,
  ClipboardList,
  Home,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { LogoutButton } from "../auth/LogoutButton";
import { useAuth } from "../../hooks/useAuth";
import { InstitutionalBrand } from "./InstitutionalBrand";

const links = [
  { to: "/colegio", label: "Inicio", icon: Home, end: true },
  {
    to: "/colegio/establecimiento",
    label: "Mi establecimiento",
    icon: Building2,
  },
  {
    to: "/colegio/cuestionario",
    label: "Cuestionario",
    icon: ClipboardList,
  },
  { to: "/colegio/resultados", label: "Resultados", icon: BarChart3 },
];

export function SchoolLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-mendoza-background lg:flex">
      <aside className="bg-mendoza-blue p-4 text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:self-start lg:overflow-y-auto lg:p-6" data-print-hidden="true">
        <div className="flex items-center gap-3 border-b border-white/20 pb-5">
          <Building2 aria-hidden="true" />
          <div>
            <p className="font-bold">Escuelas Promotoras</p>
            <p className="text-xs text-white/75">Portal del establecimiento</p>
          </div>
        </div>
        <nav
          aria-label="Portal del establecimiento"
          className="mt-5 flex gap-2 overflow-x-auto lg:flex-col"
        >
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              className={({ isActive }) =>
                `flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                  isActive
                    ? "bg-mendoza-sky text-mendoza-text"
                    : "text-white hover:bg-white/10"
                }`
              }
              end={end}
              key={to}
              to={to}
            >
              <Icon aria-hidden="true" size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header
          className="border-b border-mendoza-border bg-white px-4 py-4 sm:px-8"
          data-print-hidden="true"
        >
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
            <InstitutionalBrand
              className="min-w-0 max-w-full flex-1"
              compact
              organizationKeys={["mendoza", "ops"]}
            />
            <div className="flex flex-wrap items-center gap-4 sm:justify-end">
              <div className="min-w-0">
                <p className="text-sm text-mendoza-muted">
                  Portal del establecimiento
                </p>
                <p className="truncate font-semibold text-mendoza-text">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
