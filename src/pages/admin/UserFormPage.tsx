import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { getHttpErrorMessage } from "../../lib/http-error";
import { showError, showSuccess } from "../../lib/toast";
import {
  createUserFormSchema,
  type UserFormValues,
} from "../../lib/user-form-schema";
import { adminUsersService } from "../../services/admin-users.service";
import type { SchoolOption } from "../../types/admin-user";

export function UserFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loading, setLoading] = useState(editing);
  const schema = useMemo(() => createUserFormSchema(editing), [editing]);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "school",
      schoolId: "",
      temporaryPassword: "",
      isActive: true,
    },
  });
  const role = watch("role");
  const selectedSchoolId = watch("schoolId");

  useEffect(() => {
    const load = async () => {
      try {
        const schoolOptions = await adminUsersService.schools();
        setSchools(schoolOptions);
        if (id) {
          const user = await adminUsersService.findOne(id);
          reset({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            schoolId: user.school?.id ?? "",
            temporaryPassword: "",
            isActive: user.isActive,
          });
        }
      } catch (error) {
        showError(getHttpErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id, reset]);

  const submit = handleSubmit(async (values) => {
    try {
      const input = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        role: values.role,
        schoolId: values.role === "school" ? values.schoolId : null,
        isActive: values.isActive,
      };
      if (id) {
        await adminUsersService.update(id, input);
        showSuccess("Usuario actualizado y cambios auditados.");
      } else {
        await adminUsersService.create({
          ...input,
          schoolId: input.schoolId ?? undefined,
          temporaryPassword: values.temporaryPassword!,
        });
        showSuccess("Usuario creado con cambio de contraseña obligatorio.");
      }
      navigate("/admin/usuarios");
    } catch (error) {
      showError(getHttpErrorMessage(error));
    }
  });

  if (loading)
    return <main className="p-8 text-[#000F9F]">Cargando usuario…</main>;
  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#000F9F]"
          to="/admin/usuarios"
        >
          <ArrowLeft size={17} />
          Volver al listado
        </Link>
        <section className="mt-5 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm sm:p-8">
          <div className="h-1 w-14 rounded-full bg-[#C8A977]" />
          <h1 className="mt-4 text-2xl font-bold text-[#000F9F]">
            {editing ? "Editar usuario" : "Crear usuario"}
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            {editing
              ? "Los cambios de datos, rol, estado y asociación quedarán auditados."
              : "La cuenta deberá cambiar la contraseña temporal durante su primer acceso."}
          </p>
          <form
            className="mt-7 grid gap-5 sm:grid-cols-2"
            onSubmit={submit}
            noValidate
          >
            <Field label="Nombre" error={errors.firstName?.message}>
              <input
                {...register("firstName")}
                className="field"
                autoComplete="given-name"
              />
            </Field>
            <Field label="Apellido" error={errors.lastName?.message}>
              <input
                {...register("lastName")}
                className="field"
                autoComplete="family-name"
              />
            </Field>
            <Field label="Correo" error={errors.email?.message} wide>
              <input
                {...register("email")}
                className="field"
                autoComplete="email"
                type="email"
              />
            </Field>
            <Field label="Rol" error={errors.role?.message}>
              <select {...register("role")} className="field">
                <option value="school">Colegio</option>
                <option value="admin">Administrador</option>
              </select>
            </Field>
            <Field label="Colegio asociado" error={errors.schoolId?.message}>
              <select
                {...register("schoolId")}
                className="field"
                disabled={role !== "school"}
              >
                <option value="">Seleccionar…</option>
                {schools.map((school) => (
                  <option
                    disabled={
                      school.isActive === false &&
                      school.id !== selectedSchoolId
                    }
                    key={school.id}
                    value={school.id}
                  >
                    {school.cue} - {school.name}
                    {school.isActive === false ? " (inactivo)" : ""}
                  </option>
                ))}
              </select>
            </Field>
            {!editing && (
              <Field
                label="Contraseña temporal"
                error={errors.temporaryPassword?.message}
                wide
              >
                <input
                  {...register("temporaryPassword")}
                  className="field"
                  autoComplete="new-password"
                  type="password"
                />
                <span className="mt-1 block text-xs font-normal text-[#6B7280]">
                  12 caracteres, mayúscula, minúscula, número y símbolo.
                </span>
              </Field>
            )}
            <label className="flex items-center gap-3 text-sm font-semibold sm:col-span-2">
              <input
                {...register("isActive")}
                className="h-5 w-5 accent-[#000F9F]"
                type="checkbox"
              />
              Usuario activo
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Link
                className="inline-flex min-h-11 items-center rounded-lg border border-[#000F9F] px-5 text-sm font-semibold text-[#000F9F]"
                to="/admin/usuarios"
              >
                Cancelar
              </Link>
              <Button
                disabled={isSubmitting}
                icon={<Save size={17} />}
                type="submit"
              >
                {isSubmitting ? "Guardando…" : "Guardar usuario"}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
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
      className={`text-sm font-semibold text-[#1F2937] ${wide ? "sm:col-span-2" : ""}`}
    >
      {label}
      <span className="mt-2 block [&_.field]:w-full [&_.field]:rounded-lg [&_.field]:border [&_.field]:border-[#E5E7EB] [&_.field]:px-3 [&_.field]:py-2.5 [&_.field]:outline-none focus-within:[&_.field]:border-[#3CB4E5]">
        {children}
      </span>
      {error && (
        <span className="mt-1 block text-sm font-normal text-[#DC2626]">
          {error}
        </span>
      )}
    </label>
  );
}
