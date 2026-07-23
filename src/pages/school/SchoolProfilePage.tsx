import { Building2, Mail, MapPin, Phone, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { getHttpErrorMessage } from "../../lib/http-error";
import { showError } from "../../lib/toast";
import { schoolPortalService } from "../../services/school-portal.service";
import type { School } from "../../types/admin-school";

export function SchoolProfilePage() {
  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    schoolPortalService
      .ownSchool()
      .then(setSchool)
      .catch((error) => showError(getHttpErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <main className="p-8 text-mendoza-blue">Cargando establecimiento…</main>
    );
  }

  if (!school) {
    return (
      <main className="p-4 sm:p-8">
        <section className="mx-auto max-w-3xl rounded-2xl border border-dashed border-mendoza-gold bg-white p-8 text-center text-mendoza-muted">
          Tu cuenta todavía no tiene un establecimiento asociado.
        </section>
      </main>
    );
  }

  const characteristics = Object.entries(school.characteristics);

  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-bold uppercase tracking-wide text-mendoza-blue">
          Mi establecimiento
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-mendoza-text">
              {school.name}
            </h1>
            <p className="mt-2 text-mendoza-muted">CUE {school.cue}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              school.isActive
                ? "bg-green-50 text-mendoza-success"
                : "bg-red-50 text-mendoza-error"
            }`}
          >
            {school.isActive ? "Establecimiento activo" : "Establecimiento inactivo"}
          </span>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <ProfileCard icon={MapPin} title="Ubicación">
            <Definition label="Departamento" value={school.department} />
            <Definition label="Localidad" value={school.locality} />
            <Definition label="Dirección" value={school.address} />
            <Definition label="Código postal" value={school.postalCode} />
          </ProfileCard>

          <ProfileCard icon={Building2} title="Datos educativos">
            <Definition label="Número" value={school.schoolNumber} />
            <Definition label="Nivel" value={school.educationLevel} />
            <Definition label="Gestión" value={school.managementType} />
            <Definition label="Ámbito" value={school.scope} />
            <Definition label="Jornada" value={school.shift} />
            <Definition label="Matrícula total" value={school.enrollment} />
          </ProfileCard>

          <ProfileCard icon={Users} title="Referente institucional">
            <Definition
              label="Nombre y apellido"
              value={`${school.referentFirstName} ${school.referentLastName}`}
            />
            <Definition label="Correo" value={school.referentEmail} />
            <Definition label="Teléfono" value={school.referentPhone} />
          </ProfileCard>

          <ProfileCard icon={Mail} title="Contacto del establecimiento">
            <Definition label="Correo" value={school.email} icon={Mail} />
            <Definition label="Teléfono" value={school.phone} icon={Phone} />
          </ProfileCard>
        </div>

        {characteristics.length > 0 && (
          <section className="mt-5 rounded-2xl border border-mendoza-border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-mendoza-blue">
              Características registradas
            </h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {characteristics.map(([key, value]) => (
                <Definition key={key} label={key} value={formatValue(value)} />
              ))}
            </dl>
          </section>
        )}

        <p className="mt-6 rounded-xl border border-mendoza-gold/50 bg-white p-4 text-sm text-mendoza-muted">
          Los datos son de consulta. Si detectás información incorrecta,
          comunicate con el equipo administrador del programa.
        </p>
      </div>
    </main>
  );
}

function ProfileCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Building2;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-mendoza-border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 text-mendoza-blue">
        <Icon aria-hidden="true" size={21} />
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

function Definition({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number | boolean | null | undefined;
  icon?: typeof Mail;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-mendoza-muted">
        {label}
      </dt>
      <dd className="mt-1 flex items-center gap-2 break-words text-sm text-mendoza-text">
        {Icon && <Icon aria-hidden="true" size={15} />}
        {value === null || value === undefined || value === "" ? "—" : String(value)}
      </dd>
    </div>
  );
}

function formatValue(value: string | number | boolean | null) {
  if (value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return value;
}
