import {
  Building2,
  CalendarRange,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  School,
  Settings2,
  Users,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { LogoutButton } from "../auth/LogoutButton";
import { InstitutionalBrand } from "./InstitutionalBrand";

const links = [
  {
    to: "/admin/participacion",
    label: "Participación",
    icon: LayoutDashboard,
  },
  {
    to: "/admin/configuracion-evaluacion",
    label: "Evaluación",
    icon: Settings2,
  },
  { to: "/admin/usuarios", label: "Usuarios", icon: Users, end: true },
  { to: "/admin/colegios", label: "Colegios", icon: School, end: true },
  {
    to: "/admin/cuestionarios",
    label: "Cuestionarios",
    icon: ClipboardList,
  },
  {
    to: "/admin/campanas",
    label: "Etapas",
    icon: CalendarRange,
  },
  {
    to: "/admin/seguimiento",
    label: "Seguimiento",
    icon: ListChecks,
  },
];

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-mendoza-background lg:flex">
      <aside className="bg-mendoza-blue p-4 text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:self-start lg:overflow-y-auto lg:p-6" data-print-hidden="true">
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
        <header
          className="border-b border-mendoza-border bg-white px-4 py-4 sm:px-8"
          data-print-hidden="true"
        >
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center">
            <InstitutionalBrand
              className="min-w-0 max-w-full flex-1"
              compact
              organizationKeys={["ops", "eps", "mendoza"]}
            />
            <LogoutButton />
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
