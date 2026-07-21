import { School, Upload, UserPlus, Users } from "lucide-react";
import { Link } from "react-router-dom";

export function AdminHomePage() {
  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-bold uppercase tracking-wide text-[#000F9F]">
          Panel administrativo
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[#1F2937]">
          Gestión del programa
        </h1>
        <p className="mt-2 text-[#6B7280]">
          Administrá usuarios, colegios, accesos y asociaciones institucionales.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              to: "/admin/usuarios",
              label: "Ver usuarios",
              text: "Buscar, filtrar, editar y bloquear cuentas.",
              icon: Users,
            },
            {
              to: "/admin/usuarios/nuevo",
              label: "Crear usuario",
              text: "Registrar una cuenta con contraseña temporal.",
              icon: UserPlus,
            },
            {
              to: "/admin/usuarios/importar",
              label: "Importación masiva",
              text: "Validar e importar archivos CSV o Excel.",
              icon: Upload,
            },
            {
              to: "/admin/colegios",
              label: "Padrón de colegios",
              text: "Gestionar establecimientos, contactos y asociaciones.",
              icon: School,
            },
          ].map(({ to, label, text, icon: Icon }) => (
            <Link
              className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#3CB4E5]"
              key={to}
              to={to}
            >
              <Icon className="text-[#000F9F]" />
              <h2 className="mt-4 font-bold text-[#1F2937]">{label}</h2>
              <p className="mt-2 text-sm text-[#6B7280]">{text}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
