import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { LoadingState } from "../../components/ui/LoadingState";
import { SchoolCombobox } from "../../components/users/SchoolCombobox";
import { getHttpErrorDetails, getHttpErrorMessage } from "../../lib/http-error";
import { showError, showSuccess, showWarning } from "../../lib/toast";
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
  const [selectedSchool, setSelectedSchool] = useState<SchoolOption | null>(
    null,
  );
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false);
  const [loading, setLoading] = useState(editing);
  const schema = useMemo(() => createUserFormSchema(editing), [editing]);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    watch,
    control,
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

  useEffect(() => {
    const load = async () => {
      try {
        if (id) {
          const user = await adminUsersService.findOne(id);
          setSelectedSchool(user.school);
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
        schoolId: values.role === "school" ? values.schoolId || null : null,
        isActive: values.isActive,
      };
      if (id) {
        await adminUsersService.update(id, input);
        showSuccess("Usuario actualizado y cambios auditados.");
      } else {
        const createdUser = await adminUsersService.create({
          ...input,
          schoolId: input.schoolId ?? undefined,
          temporaryPassword: values.temporaryPassword!,
        });
        if (createdUser.invitationEmailSent) {
          showSuccess(
            "Usuario creado. Enviamos sus datos e instrucciones de acceso por correo.",
          );
        } else {
          showWarning(
            "Usuario creado, pero el correo no pudo enviarse. Verificá SMTP y entregá las credenciales por un canal seguro.",
          );
        }
      }
      navigate("/admin/usuarios");
    } catch (error) {
      const details = getHttpErrorDetails(error);
      if (
        details?.code === "USER_EMAIL_CONFLICT" &&
        details.field === "email"
      ) {
        setError("email", { type: "server", message: details.message });
        setFocus("email");
        showError(details.message);
        return;
      }
      showError(getHttpErrorMessage(error));
    }
  });

  if (loading)
    return (
      <main className="p-4 sm:p-8">
        <LoadingState label="Cargando usuario…" />
      </main>
    );
  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-mendoza-blue"
          to="/admin/usuarios"
        >
          <ArrowLeft size={17} />
          Volver al listado
        </Link>
        <section className="mt-5 rounded-2xl border border-mendoza-border bg-white p-6 shadow-sm sm:p-8">
          <div className="h-1 w-14 rounded-full bg-mendoza-gold" />
          <h1 className="mt-4 text-2xl font-bold text-mendoza-blue">
            {editing ? "Editar usuario" : "Crear usuario"}
          </h1>
          <p className="mt-2 text-sm text-mendoza-muted">
            {editing
              ? "Los cambios de datos, rol, estado y asociación quedarán auditados."
              : "La cuenta recibirá por correo sus datos de acceso y deberá cambiar la contraseña temporal durante el primer ingreso."}
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
                <option value="school">Escuela</option>
                <option value="admin">Administrador Central</option>
              </select>
            </Field>
            <Controller
              control={control}
              name="schoolId"
              render={({ field }) => (
                <SchoolCombobox
                  allowClear={editing}
                  clearLabel="Sin asignar"
                  disabled={role !== "school"}
                  error={errors.schoolId?.message}
                  onChange={(school) => {
                    setSelectedSchool(school);
                    field.onChange(school?.id ?? "");
                  }}
                  selectedSchool={selectedSchool}
                />
              )}
            />
            {editing && role === "school" && (
              <p className="text-xs leading-5 text-mendoza-muted sm:col-start-2">
                Podés dejar el usuario sin asignar. Si elegís un colegio que ya
                tiene otro usuario, la asociación será reemplazada y el cambio
                quedará registrado.
              </p>
            )}
            {!editing && (
              <Field
                label="Contraseña temporal"
                error={errors.temporaryPassword?.message}
                wide
              >
                <span className="relative block">
                  <input
                    {...register("temporaryPassword")}
                    className="field pr-11"
                    autoComplete="new-password"
                    type={showTemporaryPassword ? "text" : "password"}
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
                <span className="mt-1 block text-xs font-normal text-mendoza-muted">
                  12 caracteres, mayúscula, minúscula, número y símbolo.
                </span>
              </Field>
            )}
            <label className="flex items-center gap-3 text-sm font-semibold sm:col-span-2">
              <input
                {...register("isActive")}
                className="h-5 w-5 accent-mendoza-blue"
                type="checkbox"
              />
              Usuario activo
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Link
                className="inline-flex min-h-11 items-center rounded-lg border border-mendoza-blue px-5 text-sm font-semibold text-mendoza-blue"
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
      className={`text-sm font-semibold text-mendoza-text ${wide ? "sm:col-span-2" : ""}`}
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
