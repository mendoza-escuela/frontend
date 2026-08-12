import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check, Minus, Save, UserPlus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  useForm,
} from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import { checkboxClassName } from "../../components/ui/form-styles";
import { getHttpErrorDetails, getHttpErrorMessage } from "../../lib/http-error";
import {
  createAdminSchoolFormSchema,
  type SchoolFormValues,
} from "../../lib/school-form-schema";
import { showError, showSuccess, showWarning } from "../../lib/toast";
import { adminSchoolsService } from "../../services/admin-schools.service";
import type {
  SchoolCatalogOption,
  SchoolDetail,
  SchoolNamedCatalogOption,
  SchoolRectificationCatalogs,
  SchoolUpdateAndRectifyInput,
  SchoolWriteInput,
} from "../../types/admin-school";

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
  shiftCatalogId: null,
  educationLevels: [],
  hasKiosk: null,
  hasFoodService: null,
  isBoarding: null,
  characteristics: {
    isMultigrade: null,
    isInterculturalBilingual: null,
  },
  phone: "",
  email: "",
  referentFirstName: "",
  referentLastName: "",
  referentEmail: "",
  referentPhone: "",
  respondentPosition: "",
  enrollment: null,
  isActive: true,
};

type BooleanFieldName =
  | "hasKiosk"
  | "hasFoodService"
  | "isBoarding"
  | "characteristics.isMultigrade"
  | "characteristics.isInterculturalBilingual";

export function SchoolFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const schema = useMemo(
    () => createAdminSchoolFormSchema(editing),
    [editing],
  );
  const navigate = useNavigate();
  const [catalogs, setCatalogs] = useState<SchoolRectificationCatalogs | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadedSchool, setLoadedSchool] = useState<SchoolDetail | null>(null);
  const {
    control,
    getValues,
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SchoolFormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  useEffect(() => {
    let mounted = true;
    Promise.all([
      adminSchoolsService.rectificationCatalogs(),
      id ? adminSchoolsService.findOne(id) : Promise.resolve(null),
    ])
      .then(([availableCatalogs, school]) => {
        if (!mounted) return;
        setCatalogs(availableCatalogs);
        if (school) {
          setLoadedSchool(school);
          reset(schoolFormValues(school, availableCatalogs));
        }
      })
      .catch((error) => {
        if (!mounted) return;
        const message = getHttpErrorMessage(error);
        setLoadError(message);
        showError(message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id, reset]);

  const selectedLevels = watch("educationLevels") ?? [];
  const toggleLevel = (level: SchoolCatalogOption, checked: boolean) => {
    const current = getValues("educationLevels");
    const selected = current.some(({ levelId }) => levelId === level.id);
    if (checked && !selected) {
      setValue(
        "educationLevels",
        [...current, { levelId: level.id, enrollment: null }],
        { shouldDirty: true, shouldValidate: true },
      );
    } else if (!checked && selected) {
      setValue(
        "educationLevels",
        current.filter(({ levelId }) => levelId !== level.id),
        { shouldDirty: true, shouldValidate: true },
      );
    }
  };

  const submit = handleSubmit(async (values) => {
    const shift = catalogs?.shifts.items.find(
      ({ id: shiftId }) => shiftId === values.shiftCatalogId,
    );
    if (!shift || values.hasKiosk === null || values.hasFoodService === null) {
      showError("Revisá los campos institucionales obligatorios.");
      return;
    }

    const contacts = [{
      type: "RESPONDENT" as const,
      firstName: values.referentFirstName,
      lastName: values.referentLastName,
      position: values.respondentPosition || null,
      email: values.referentEmail || null,
      phone: values.referentPhone || null,
    }];
    const {
      respondentPosition: _respondentPosition,
      characteristics: _characteristics,
      ...schoolValues
    } = values;
    void _respondentPosition;
    void _characteristics;
    const characteristics = simpleCharacteristics(values.characteristics);

    const input: SchoolWriteInput = {
      ...schoolValues,
      schoolNumber: values.schoolNumber || null,
      postalCode: values.postalCode || null,
      shift: shift.label,
      shiftCatalogId: shift.id,
      phone: values.phone || null,
      email: values.email || null,
      referentEmail: values.referentEmail || null,
      referentPhone: values.referentPhone || null,
      hasKiosk: values.hasKiosk,
      hasFoodService: values.hasFoodService,
      isBoarding: values.isBoarding,
      enrollment: values.enrollment,
      ...(characteristics ? { characteristics } : {}),
      educationLevels: values.educationLevels,
      contacts,
    };

    try {
      if (id) {
        if (!loadedSchool) {
          showError("No se pudo verificar la versión actual del colegio.");
          return;
        }
        const rectificationInput: SchoolUpdateAndRectifyInput = {
          name: input.name,
          cue: input.cue,
          directorName: input.directorName,
          schoolNumber: input.schoolNumber,
          department: input.department,
          address: input.address,
          locality: input.locality,
          postalCode: input.postalCode,
          managementType: input.managementType,
          scope: input.scope,
          educationLevel: input.educationLevel,
          shift: input.shift,
          shiftCatalogId: shift.id,
          educationLevels: input.educationLevels,
          enrollment: input.enrollment,
          phone: input.phone,
          email: input.email,
          hasKiosk: values.hasKiosk,
          hasFoodService: values.hasFoodService,
          isBoarding: input.isBoarding,
          expectedUpdatedAt: loadedSchool.updatedAt,
          ...(input.characteristics
            ? { characteristics: input.characteristics }
            : {}),
          contacts,
        };
        await adminSchoolsService.updateAndRectify(id, rectificationInput);
        showSuccess("Colegio actualizado y cambios auditados.");
      } else {
        const created = await adminSchoolsService.create(input);
        if (created.responsibleUserInvitationEmailSent) {
          showSuccess(
            "Colegio y usuario responsable creados. Enviamos las credenciales por correo.",
          );
        } else {
          showWarning(
            "Colegio y usuario responsable creados, pero no se pudo enviar el correo. Verificá la configuración SMTP y restablecé la clave desde Usuarios.",
          );
        }
      }
      navigate(id ? `/admin/colegios/${id}` : "/admin/colegios");
    } catch (error) {
      const details = getHttpErrorDetails(error);
      if (details?.field === "referentEmail") {
        setError("referentEmail", {
          type: "server",
          message: details.message,
        });
        setFocus("referentEmail");
      }
      showError(getHttpErrorMessage(error));
    }
  });

  if (loading)
    return <main className="p-4 sm:p-8"><LoadingState label="Cargando colegio…" /></main>;
  if (loadError) return <ErrorState message={loadError} />;
  if (!catalogs) return null;

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
            Todos los campos marcados con * son obligatorios. Cada modificación
            queda registrada.
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

            <Section title="Perfil educativo" />
            <CatalogField
              control={control}
              error={errors.managementType?.message}
              label="Sector / gestión *"
              name="managementType"
              options={catalogs.managementTypes}
            />
            <CatalogField
              control={control}
              error={errors.scope?.message}
              label="Ámbito *"
              name="scope"
              options={catalogs.scopes}
            />
            <CatalogField
              control={control}
              error={errors.educationLevel?.message}
              label="Tipo de educación *"
              name="educationLevel"
              options={catalogs.educationTypes}
            />
            <Controller
              control={control}
              name="shiftCatalogId"
              render={({ field }) => (
                <SearchableSelect
                  allLabel="Seleccioná una jornada"
                  disabled={!catalogs.shifts.available}
                  error={errors.shiftCatalogId?.message}
                  label="Jornada *"
                  onBlur={field.onBlur}
                  onChange={(value) => {
                    const shiftId = value || null;
                    field.onChange(shiftId);
                    const selected = catalogs.shifts.items.find(
                      ({ id: optionId }) => optionId === shiftId,
                    );
                    setValue("shift", selected?.label ?? "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  options={catalogs.shifts.items
                    .filter((shift) => shift.isActive || shift.id === field.value)
                    .map((shift) => ({ value: shift.id, label: shift.label }))}
                  value={field.value ?? ""}
                />
              )}
            />
            <input type="hidden" {...register("shift")} />

            <EducationLevelsField
              catalogs={catalogs}
              errors={errors}
              register={register}
              selectedLevels={selectedLevels}
              toggleLevel={toggleLevel}
            />

            <Field label="Matrícula total" error={errors.enrollment?.message}>
              <input
                className="field"
                min="0"
                type="number"
                {...register("enrollment", { setValueAs: nullableInteger })}
              />
            </Field>
            <div />

            <Section title="Características institucionales" />
            <BooleanField
              control={control}
              error={errors.hasKiosk?.message}
              label="¿Tiene kiosco? *"
              name="hasKiosk"
            />
            <BooleanField
              control={control}
              error={errors.hasFoodService?.message}
              label="¿Tiene comedor o servicio alimentario? *"
              name="hasFoodService"
            />
            <BooleanField
              control={control}
              error={errors.isBoarding?.message}
              label="¿Es albergue?"
              name="isBoarding"
              optional
            />
            <BooleanField
              control={control}
              error={errors.characteristics?.isMultigrade?.message}
              label={characteristicLabel(
                catalogs,
                "isMultigrade",
                "¿Es Plurogrado?",
              )}
              name="characteristics.isMultigrade"
              optional
            />
            <BooleanField
              control={control}
              error={errors.characteristics?.isInterculturalBilingual?.message}
              label={characteristicLabel(
                catalogs,
                "isInterculturalBilingual",
                "¿Es intercultural y bilingüe?",
              )}
              name="characteristics.isInterculturalBilingual"
              optional
            />

            <Section title="Contacto institucional" />
            <Field label="Correo institucional" error={errors.email?.message}>
              <input className="field" type="email" {...register("email")} />
            </Field>
            <Field label="Teléfono institucional">
              <input className="field" {...register("phone")} />
            </Field>

            <Section title="Referente responsable" />
            {!editing && (
              <div className="flex gap-3 rounded-xl border border-mendoza-sky/40 bg-mendoza-sky-soft p-4 text-sm leading-6 text-mendoza-text md:col-span-2">
                <UserPlus
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-mendoza-blue"
                  size={20}
                />
                <p>
                  Al guardar, se creará automáticamente una cuenta asociada
                  al colegio. El responsable recibirá por correo una clave
                  temporal aleatoria y deberá cambiarla en su primer ingreso.
                </p>
              </div>
            )}
            <Field label="Nombre *" error={errors.referentFirstName?.message}>
              <input className="field" {...register("referentFirstName")} />
            </Field>
            <Field label="Apellido *" error={errors.referentLastName?.message}>
              <input className="field" {...register("referentLastName")} />
            </Field>
            <Field label="Cargo" error={errors.respondentPosition?.message}>
              <input className="field" {...register("respondentPosition")} />
            </Field>
            <Field label="Celular" error={errors.referentPhone?.message}>
              <input className="field" {...register("referentPhone")} />
            </Field>
            <Field
              label={editing ? "Correo" : "Correo *"}
              error={errors.referentEmail?.message}
            >
              <input
                className="field"
                type="email"
                {...register("referentEmail")}
              />
            </Field>

            {!editing && (
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-mendoza-border bg-white p-4 text-sm font-semibold transition hover:border-mendoza-sky md:col-span-2">
                <input
                  className={checkboxClassName}
                  type="checkbox"
                  {...register("isActive")}
                />
                Colegio activo
              </label>
            )}
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

function CatalogField({
  control,
  error,
  label,
  name,
  options,
}: {
  control: Control<SchoolFormValues>;
  error?: string;
  label: string;
  name: "managementType" | "scope" | "educationLevel";
  options: { code: string; label: string }[];
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <SearchableSelect
          allLabel={options.length ? "Seleccioná una opción" : "Catálogo no disponible"}
          disabled={!options.length}
          error={error}
          label={label}
          onBlur={field.onBlur}
          onChange={field.onChange}
          options={options.map((option) => ({
            value: option.label,
            label: option.label,
          }))}
          value={field.value}
        />
      )}
    />
  );
}

function EducationLevelsField({
  catalogs,
  errors,
  register,
  selectedLevels,
  toggleLevel,
}: {
  catalogs: SchoolRectificationCatalogs;
  errors: FieldErrors<SchoolFormValues>;
  register: UseFormRegister<SchoolFormValues>;
  selectedLevels: SchoolFormValues["educationLevels"];
  toggleLevel: (level: SchoolCatalogOption, checked: boolean) => void;
}) {
  const levelError =
    errors.educationLevels?.message ?? errors.educationLevels?.root?.message;
  return (
    <fieldset aria-invalid={Boolean(levelError)} className="md:col-span-2">
      <legend className="font-bold text-mendoza-text">
        Niveles educativos *
      </legend>
      <p className="mt-1 text-sm text-mendoza-muted">
        Seleccioná al menos un nivel. La matrícula por nivel es opcional.
      </p>
      {catalogs.educationLevels.available ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {catalogs.educationLevels.items.map((level) => {
            const selected = selectedLevels.some(
              ({ levelId }) => levelId === level.id,
            );
            return (
              <label
                className={`flex min-h-14 items-center gap-3 rounded-xl border p-3 text-sm transition focus-within:ring-4 focus-within:ring-mendoza-sky/15 ${selected ? "border-mendoza-blue bg-mendoza-blue-soft font-semibold text-mendoza-blue shadow-sm" : "border-mendoza-border bg-white text-mendoza-text hover:border-mendoza-sky"} ${!level.isActive && !selected ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                key={level.id}
              >
                <input
                  className={checkboxClassName}
                  checked={selected}
                  disabled={!level.isActive && !selected}
                  onChange={(event) => toggleLevel(level, event.target.checked)}
                  type="checkbox"
                />
                {level.label}
                {!level.isActive ? " (inactivo)" : ""}
              </label>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-mendoza-gold bg-amber-50 p-3 text-sm text-amber-900">
          {catalogs.educationLevels.message ?? "Catálogo no disponible."}
        </p>
      )}
      {levelError && (
        <p className="mt-2 text-sm text-mendoza-error" role="alert">
          {levelError}
        </p>
      )}
      {selectedLevels.length > 0 && (
        <div className="mt-4 grid gap-4 rounded-xl bg-mendoza-background p-4 sm:grid-cols-2">
          {selectedLevels.map((selection, index) => {
            const level = catalogs.educationLevels.items.find(
              ({ id }) => id === selection.levelId,
            );
            return (
              <Field
                error={errors.educationLevels?.[index]?.enrollment?.message}
                key={selection.levelId}
                label={`Matrícula de ${level?.label ?? "nivel"}`}
              >
                <input
                  className="field"
                  min="0"
                  type="number"
                  {...register(`educationLevels.${index}.enrollment`, {
                    setValueAs: nullableInteger,
                  })}
                />
              </Field>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

function BooleanField({
  control,
  error,
  label,
  name,
  optional = false,
}: {
  control: Control<SchoolFormValues>;
  error?: string;
  label: string;
  name: BooleanFieldName;
  optional?: boolean;
}) {
  return (
    <fieldset
      aria-invalid={Boolean(error)}
      className={`rounded-2xl border bg-white p-4 transition ${error ? "border-mendoza-error" : "border-mendoza-border"}`}
    >
      <legend className="px-2 text-sm font-bold text-mendoza-text">
        {label}
      </legend>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <div
            className={`mt-2 grid gap-2 ${optional ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"}`}
          >
            {[
              { icon: Check, label: "Sí", value: true },
              { icon: X, label: "No", value: false },
              ...(optional
                ? [{ icon: Minus, label: "Sin informar", value: null }]
                : []),
            ].map((option) => {
              const selected = field.value === option.value;
              const Icon = option.icon;
              return (
                <label
                  className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition focus-within:ring-4 focus-within:ring-mendoza-sky/15 ${selected ? "border-mendoza-blue bg-mendoza-blue-soft text-mendoza-blue shadow-sm" : "border-mendoza-border bg-white text-mendoza-muted hover:border-mendoza-sky hover:bg-mendoza-background"}`}
                  key={option.label}
                >
                  <input
                    checked={selected}
                    className="sr-only"
                    name={field.name}
                    onBlur={field.onBlur}
                    onChange={() => field.onChange(option.value)}
                    ref={field.ref}
                    type="radio"
                  />
                  <Icon aria-hidden="true" size={17} strokeWidth={2.5} />
                  {option.label}
                </label>
              );
            })}
          </div>
        )}
      />
      {error && (
        <p className="mt-2 text-sm text-mendoza-error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function schoolFormValues(
  school: SchoolDetail,
  catalogs: SchoolRectificationCatalogs,
): SchoolFormValues {
  const respondent = school.contacts?.find(({ type }) => type === "RESPONDENT");
  const shift = catalogs.shifts.items.find(
    (option) =>
      option.id === school.shiftCatalogId ||
      option.label === school.shift ||
      option.code === school.shift,
  );
  return {
    cue: school.cue,
    name: school.name,
    directorName: school.directorName,
    schoolNumber: school.schoolNumber ?? "",
    department: school.department,
    locality: school.locality,
    address: school.address,
    postalCode: school.postalCode ?? "",
    educationLevel: catalogLabel(
      catalogs.educationTypes,
      school.educationLevel,
    ),
    managementType: catalogLabel(
      catalogs.managementTypes,
      school.managementType,
    ),
    scope: catalogLabel(catalogs.scopes, school.scope),
    shift: shift?.label ?? "",
    shiftCatalogId: shift?.id ?? null,
    educationLevels: school.educationLevels.map(({ levelId, enrollment }) => ({
      levelId,
      enrollment,
    })),
    hasKiosk: school.hasKiosk,
    hasFoodService: school.hasFoodService,
    isBoarding: school.isBoarding,
    characteristics: {
      ...school.characteristics,
      isMultigrade: booleanCharacteristic(school, "isMultigrade"),
      isInterculturalBilingual: booleanCharacteristic(
        school,
        "isInterculturalBilingual",
      ),
    },
    phone: school.phone ?? "",
    email: school.email ?? "",
    referentFirstName: respondent?.firstName ?? school.referentFirstName,
    referentLastName: respondent?.lastName ?? school.referentLastName,
    referentEmail: respondent?.email ?? school.referentEmail ?? "",
    referentPhone: respondent?.phone ?? school.referentPhone ?? "",
    respondentPosition: respondent?.position ?? "",
    enrollment: school.enrollment ?? null,
    isActive: school.isActive,
  };
}

function catalogLabel(options: SchoolNamedCatalogOption[], current: string) {
  return (
    options.find(({ code, label }) => code === current || label === current)
      ?.label ?? ""
  );
}

function characteristicLabel(
  catalogs: SchoolRectificationCatalogs,
  code: string,
  fallback: string,
) {
  return (
    catalogs.characteristics.find((option) => option.code === code)?.label ??
    fallback
  );
}

function booleanCharacteristic(school: SchoolDetail, code: string) {
  const value = school.characteristics[code];
  return typeof value === "boolean" ? value : null;
}

function simpleCharacteristics(
  characteristics: SchoolFormValues["characteristics"],
) {
  return {
    isMultigrade: characteristics.isMultigrade ?? null,
    isInterculturalBilingual: characteristics.isInterculturalBilingual ?? null,
  };
}

const nullableInteger = (value: unknown) =>
  value === "" || value === null || value === undefined ? null : Number(value);

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
        <span
          className="mt-1 block text-sm font-normal text-mendoza-error"
          role="alert"
        >
          {error}
        </span>
      )}
    </label>
  );
}
