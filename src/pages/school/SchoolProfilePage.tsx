import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Save,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { getHttpErrorMessage } from "../../lib/http-error";
import {
  schoolRectificationSchema,
  type SchoolRectificationValues,
} from "../../lib/school-form-schema";
import { showError, showSuccess } from "../../lib/toast";
import { schoolPortalService } from "../../services/school-portal.service";
import type { SchoolProfile } from "../../types/admin-school";

export function SchoolProfilePage() {
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SchoolRectificationValues>({
    resolver: zodResolver(schoolRectificationSchema),
  });

  useEffect(() => {
    schoolPortalService
      .ownSchool()
      .then((profile) => {
        setSchool(profile);
        reset(rectificationValues(profile));
      })
      .catch((error) => showError(getHttpErrorMessage(error)))
      .finally(() => setIsLoading(false));
  }, [reset]);

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
  const submit = handleSubmit(async (values) => {
    try {
      const profile = await schoolPortalService.rectify(values);
      setSchool(profile);
      reset(rectificationValues(profile));
      showSuccess(`Ficha rectificada para el período ${profile.rectification.periodYear}.`);
    } catch (error) {
      showError(getHttpErrorMessage(error));
    }
  });

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

        <section
          className={`mt-6 rounded-2xl border p-5 shadow-sm ${
            school.rectification.isRectified
              ? "border-green-200 bg-green-50"
              : "border-mendoza-gold bg-white"
          }`}
        >
          <div className="flex items-start gap-3">
            {school.rectification.isRectified ? (
              <CheckCircle2 className="shrink-0 text-mendoza-success" />
            ) : (
              <AlertCircle className="shrink-0 text-mendoza-warning" />
            )}
            <div>
              <h2 className="font-bold text-mendoza-text">
                {school.rectification.isRectified
                  ? `Ficha rectificada para ${school.rectification.periodYear}`
                  : `Rectificación pendiente para ${school.rectification.periodYear}`}
              </h2>
              <p className="mt-1 text-sm text-mendoza-muted">
                {school.rectification.rectifiedAt
                  ? `Última confirmación: ${formatDate(school.rectification.rectifiedAt)}.`
                  : "Revisá los datos obligatorios y confirmalos para el período vigente."}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <ProfileCard icon={MapPin} title="Ubicación">
            <Definition label="Departamento" value={school.department} />
            <Definition label="Localidad" value={school.locality} />
            <Definition label="Dirección" value={school.address} />
            <Definition label="Código postal" value={school.postalCode} />
          </ProfileCard>

          <ProfileCard icon={Building2} title="Datos educativos">
            <Definition label="Director/a" value={school.directorName} />
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

        <section className="mt-5 rounded-2xl border border-mendoza-border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-mendoza-blue">
            Revisar y rectificar ficha anual
          </h2>
          <p className="mt-2 text-sm text-mendoza-muted">
            Estos datos son obligatorios. Al confirmar se guardará una copia
            histórica con tu usuario, fecha y período.
          </p>
          <form
            className="mt-6 grid gap-5 md:grid-cols-2"
            noValidate
            onSubmit={submit}
          >
            <RectificationField label="Nombre del establecimiento" error={errors.name?.message}>
              <input className="field" {...register("name")} />
            </RectificationField>
            <RectificationField label="CUE" error={errors.cue?.message}>
              <input className="field" {...register("cue")} />
            </RectificationField>
            <RectificationField label="Director/a" error={errors.directorName?.message}>
              <input className="field" {...register("directorName")} />
            </RectificationField>
            <RectificationField label="Dirección" error={errors.address?.message}>
              <input className="field" {...register("address")} />
            </RectificationField>
            <RectificationField label="Localidad" error={errors.locality?.message}>
              <input className="field" {...register("locality")} />
            </RectificationField>
            <RectificationField label="Ámbito" error={errors.scope?.message}>
              <input className="field" {...register("scope")} />
            </RectificationField>
            <RectificationField label="Tipo de educación" error={errors.educationLevel?.message}>
              <input className="field" {...register("educationLevel")} />
            </RectificationField>
            <RectificationField label="Jornada" error={errors.shift?.message}>
              <input className="field" {...register("shift")} />
            </RectificationField>
            <div className="flex justify-end md:col-span-2">
              <Button disabled={isSubmitting} icon={<Save size={17} />} type="submit">
                {isSubmitting ? "Rectificando…" : "Confirmar rectificación anual"}
              </Button>
            </div>
          </form>
        </section>

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

      </div>
    </main>
  );
}

function RectificationField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="text-sm font-semibold text-mendoza-text">
      {label} *
      <span className="mt-2 block [&_.field]:w-full [&_.field]:rounded-lg [&_.field]:border [&_.field]:border-mendoza-border [&_.field]:px-3 [&_.field]:py-2.5 [&_.field]:outline-none focus-within:[&_.field]:border-mendoza-sky">
        {children}
      </span>
      {error && <span className="mt-1 block font-normal text-mendoza-error">{error}</span>}
    </label>
  );
}

function rectificationValues(school: SchoolProfile): SchoolRectificationValues {
  return {
    name: school.name,
    cue: school.cue,
    directorName: school.directorName,
    address: school.address,
    locality: school.locality,
    scope: school.scope,
    educationLevel: school.educationLevel,
    shift: school.shift,
  };
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

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
