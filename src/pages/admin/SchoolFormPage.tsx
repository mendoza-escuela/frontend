import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { getHttpErrorMessage } from "../../lib/http-error";
import {
  schoolFormSchema,
  type SchoolFormValues,
} from "../../lib/school-form-schema";
import { showError, showSuccess } from "../../lib/toast";
import { adminSchoolsService } from "../../services/admin-schools.service";

const defaults: SchoolFormValues = {
  cue: "",
  name: "",
  directorName: "",
  schoolNumber: "",
  department: "",
  locality: "",
  address: "",
  postalCode: "",
  educationLevel: "",
  managementType: "",
  scope: "",
  shift: "",
  phone: "",
  email: "",
  referentFirstName: "",
  referentLastName: "",
  referentEmail: "",
  referentPhone: "",
  enrollment: 0,
  isActive: true,
};

export function SchoolFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(editing);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolFormSchema),
    defaultValues: defaults,
  });
  useEffect(() => {
    if (!id) return;
    void adminSchoolsService
      .findOne(id)
      .then((school) =>
        reset({
          cue: school.cue,
          name: school.name,
          directorName: school.directorName,
          schoolNumber: school.schoolNumber ?? "",
          department: school.department,
          locality: school.locality,
          address: school.address,
          postalCode: school.postalCode ?? "",
          educationLevel: school.educationLevel,
          managementType: school.managementType,
          scope: school.scope ?? "",
          shift: school.shift ?? "",
          phone: school.phone ?? "",
          email: school.email ?? "",
          referentFirstName: school.referentFirstName,
          referentLastName: school.referentLastName,
          referentEmail: school.referentEmail ?? "",
          referentPhone: school.referentPhone ?? "",
          enrollment: school.enrollment,
          isActive: school.isActive,
        }),
      )
      .catch((error) => showError(getHttpErrorMessage(error)))
      .finally(() => setLoading(false));
  }, [id, reset]);
  const submit = handleSubmit(async (values) => {
    const input = {
      ...values,
      schoolNumber: values.schoolNumber || null,
      postalCode: values.postalCode || null,
      scope: values.scope,
      shift: values.shift,
      phone: values.phone || null,
      email: values.email || null,
      referentEmail: values.referentEmail || null,
      referentPhone: values.referentPhone || null,
    };
    try {
      if (id) {
        await adminSchoolsService.update(id, input);
        await adminSchoolsService.rectify(id, {
          name: values.name,
          cue: values.cue,
          directorName: values.directorName,
          address: values.address,
          locality: values.locality,
          scope: values.scope,
          educationLevel: values.educationLevel,
          shift: values.shift,
        });
      }
      else await adminSchoolsService.create(input);
      showSuccess(
        id
          ? "Colegio actualizado y cambios auditados."
          : "Colegio creado y alta auditada.",
      );
      navigate(id ? `/admin/colegios/${id}` : "/admin/colegios");
    } catch (error) {
      showError(getHttpErrorMessage(error));
    }
  });
  if (loading)
    return <main className="p-8 text-mendoza-blue">Cargando colegio…</main>;
  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-mendoza-blue"
          to={id ? `/admin/colegios/${id}` : "/admin/colegios"}
        >
          <ArrowLeft size={17} />
          Volver
        </Link>
        <section className="mt-5 rounded-2xl border border-mendoza-border bg-white p-5 shadow-sm sm:p-8">
          <div className="h-1 w-14 rounded-full bg-mendoza-gold" />
          <h1 className="mt-4 text-2xl font-bold text-mendoza-blue">
            {editing ? "Editar colegio" : "Crear colegio"}
          </h1>
          <p className="mt-2 text-sm text-mendoza-muted">
            Los campos marcados con * son obligatorios. Cada modificación queda
            registrada.
          </p>
          <form
            className="mt-7 grid gap-5 md:grid-cols-2"
            noValidate
            onSubmit={submit}
          >
            <Field label="CUE *" error={errors.cue?.message}>
              <input className="field" {...register("cue")} />
            </Field>
            <Field label="Número">
              <input className="field" {...register("schoolNumber")} />
            </Field>
            <Field wide label="Nombre *" error={errors.name?.message}>
              <input className="field" {...register("name")} />
            </Field>
            <Field
              wide
              label="Director/a *"
              error={errors.directorName?.message}
            >
              <input className="field" {...register("directorName")} />
            </Field>
            <Section title="Ubicación" />
            <Field label="Departamento *" error={errors.department?.message}>
              <input className="field" {...register("department")} />
            </Field>
            <Field label="Localidad *" error={errors.locality?.message}>
              <input className="field" {...register("locality")} />
            </Field>
            <Field wide label="Dirección *" error={errors.address?.message}>
              <input className="field" {...register("address")} />
            </Field>
            <Field label="Código postal">
              <input className="field" {...register("postalCode")} />
            </Field>
            <div />
            <Section title="Características institucionales" />
            <Field
              label="Nivel educativo *"
              error={errors.educationLevel?.message}
            >
              <input className="field" {...register("educationLevel")} />
            </Field>
            <Field label="Gestión *" error={errors.managementType?.message}>
              <input className="field" {...register("managementType")} />
            </Field>
            <Field label="Ámbito *" error={errors.scope?.message}>
              <input className="field" {...register("scope")} />
            </Field>
            <Field label="Jornada *" error={errors.shift?.message}>
              <input className="field" {...register("shift")} />
            </Field>
            <Field label="Matrícula *" error={errors.enrollment?.message}>
              <input
                className="field"
                min="0"
                type="number"
                {...register("enrollment", { valueAsNumber: true })}
              />
            </Field>
            <Section title="Contacto y referente" />
            <Field label="Correo institucional" error={errors.email?.message}>
              <input className="field" type="email" {...register("email")} />
            </Field>
            <Field label="Teléfono">
              <input className="field" {...register("phone")} />
            </Field>
            <Field
              label="Nombre del referente *"
              error={errors.referentFirstName?.message}
            >
              <input className="field" {...register("referentFirstName")} />
            </Field>
            <Field
              label="Apellido del referente *"
              error={errors.referentLastName?.message}
            >
              <input className="field" {...register("referentLastName")} />
            </Field>
            <Field
              label="Correo del referente"
              error={errors.referentEmail?.message}
            >
              <input
                className="field"
                type="email"
                {...register("referentEmail")}
              />
            </Field>
            <Field label="Teléfono del referente">
              <input className="field" {...register("referentPhone")} />
            </Field>
            <label className="flex items-center gap-3 text-sm font-semibold md:col-span-2">
              <input
                className="h-5 w-5 accent-mendoza-blue"
                type="checkbox"
                {...register("isActive")}
              />
              Colegio activo
            </label>
            <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
              <Link
                className="inline-flex min-h-11 items-center rounded-lg border border-mendoza-blue px-5 text-sm font-semibold text-mendoza-blue"
                to={id ? `/admin/colegios/${id}` : "/admin/colegios"}
              >
                Cancelar
              </Link>
              <Button
                disabled={isSubmitting}
                icon={<Save size={17} />}
                type="submit"
              >
                {isSubmitting ? "Guardando…" : "Guardar colegio"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
function Section({ title }: { title: string }) {
  return (
    <h2 className="border-b border-mendoza-border pb-2 text-lg font-bold text-mendoza-blue md:col-span-2">
      {title}
    </h2>
  );
}
function Field({
  label,
  error,
  wide,
  children,
}: {
  label: string;
  error?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`text-sm font-semibold text-mendoza-text ${wide ? "md:col-span-2" : ""}`}
    >
      {label}
      <span className="mt-2 block [&_.field]:w-full [&_.field]:rounded-lg [&_.field]:border [&_.field]:border-mendoza-border [&_.field]:px-3 [&_.field]:py-2.5 [&_.field]:outline-none focus-within:[&_.field]:border-mendoza-sky">
        {children}
      </span>
      {error && (
        <span className="mt-1 block text-sm font-normal text-mendoza-error">
          {error}
        </span>
      )}
    </label>
  );
}
