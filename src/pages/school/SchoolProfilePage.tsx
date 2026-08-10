import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Save,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Controller,
  type Control,
  useForm,
} from "react-hook-form";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { ErrorState } from "../../components/ui/ErrorState";
import { getHttpErrorMessage } from "../../lib/http-error";
import {
  schoolRectificationSchema,
  type SchoolRectificationValues,
} from "../../lib/school-form-schema";
import { showError, showSuccess } from "../../lib/toast";
import { schoolPortalService } from "../../services/school-portal.service";
import type {
  SchoolCatalogOption,
  SchoolProfile,
  SchoolRectificationCatalogs,
  SchoolRectificationSnapshot,
} from "../../types/admin-school";

type TriStateName = "hasKiosk" | "hasFoodService" | "isBoarding";

export function SchoolProfilePage() {
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [catalogs, setCatalogs] =
    useState<SchoolRectificationCatalogs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [pendingRemoval, setPendingRemoval] =
    useState<SchoolCatalogOption | null>(null);
  const {
    control,
    getValues,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SchoolRectificationValues>({
    resolver: zodResolver(schoolRectificationSchema),
  });

  useEffect(() => {
    Promise.all([
      schoolPortalService.ownSchool(),
      schoolPortalService.rectificationCatalogs(),
    ])
      .then(([profile, availableCatalogs]) => {
        setSchool(profile);
        setCatalogs(availableCatalogs);
        reset(rectificationValues(profile));
      })
      .catch((error) => {
        const message = getHttpErrorMessage(error);
        setLoadError(message);
        showError(message);
      })
      .finally(() => setIsLoading(false));
  }, [reset]);

  if (isLoading) {
    return (
      <main className="p-8 text-mendoza-blue">Cargando establecimiento…</main>
    );
  }

  if (loadError) {
    return <ErrorState message={loadError} />;
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

  const selectedLevels = watch("educationLevels") ?? [];
  const contacts = watch("contacts") ?? [];
  const removeLevel = (levelId: string) => {
    setValue(
      "educationLevels",
      getValues("educationLevels").filter(
        (selection) => selection.levelId !== levelId,
      ),
      { shouldDirty: true, shouldValidate: true },
    );
  };
  const toggleLevel = (level: SchoolCatalogOption, checked: boolean) => {
    const current = getValues("educationLevels");
    const selection = current.find(({ levelId }) => levelId === level.id);
    if (checked && !selection) {
      const orderById = new Map(
        (catalogs?.educationLevels.items ?? []).map((item, order) => [
          item.id,
          order,
        ]),
      );
      setValue(
        "educationLevels",
        [...current, { levelId: level.id, enrollment: null }].sort(
          (left, right) =>
            (orderById.get(left.levelId) ?? 0) -
            (orderById.get(right.levelId) ?? 0),
        ),
        { shouldDirty: true, shouldValidate: true },
      );
      return;
    }
    if (!checked && selection) {
      if (selection.enrollment !== null) setPendingRemoval(level);
      else removeLevel(level.id);
    }
  };

  const submit = handleSubmit(async (values) => {
    try {
      const profile = await schoolPortalService.rectify({
        ...values,
        contacts: values.contacts.map((contact) => ({
          ...contact,
          position: contact.position || null,
          phone: contact.phone || null,
          email: contact.email || null,
        })),
      });
      setSchool(profile);
      reset(rectificationValues(profile));
      showSuccess(
        `Ficha rectificada para el período ${profile.rectification.periodYear}.`,
      );
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
            {school.isActive
              ? "Establecimiento activo"
              : "Establecimiento inactivo"}
          </span>
        </div>

        <RectificationStatus school={school} />

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
            <Definition
              label="Niveles estructurados"
              value={
                school.educationLevels.map(({ label }) => label).join(", ") ||
                null
              }
            />
            <Definition
              label="Nivel heredado"
              value={school.educationLevel}
            />
            <Definition label="Gestión" value={school.managementType} />
            <Definition label="Ámbito" value={school.scope} />
            <Definition
              label="Jornada estructurada"
              value={school.shiftCatalog?.label}
            />
            <Definition label="Jornada heredada" value={school.shift} />
            <Definition label="Matrícula total" value={school.enrollment} />
          </ProfileCard>

          <ProfileCard icon={Users} title="Características">
            <Definition
              label="Tiene kiosco"
              value={formatBoolean(school.hasKiosk)}
            />
            <Definition
              label="Tiene comedor o servicio alimentario"
              value={formatBoolean(school.hasFoodService)}
            />
            <Definition
              label="Es albergue"
              value={formatBoolean(school.isBoarding)}
            />
          </ProfileCard>

          <ProfileCard icon={Mail} title="Contacto">
            <Definition
              label="Referente"
              value={`${school.referentFirstName} ${school.referentLastName}`}
            />
            <Definition
              label="Correo del referente"
              value={school.referentEmail}
            />
            <Definition
              label="Teléfono del referente"
              value={school.referentPhone}
            />
            <Definition label="Correo" value={school.email} icon={Mail} />
            <Definition label="Teléfono" value={school.phone} icon={Phone} />
          </ProfileCard>
        </div>

        <section className="mt-5 rounded-2xl border border-mendoza-border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-mendoza-blue">
            Revisar y rectificar ficha anual
          </h2>
          <p className="mt-2 text-sm text-mendoza-muted">
            Al confirmar se guardará una copia histórica e inmutable con tu
            usuario, fecha y período. Los datos sin definición de obligatoriedad
            pueden mantenerse como “Sin informar”.
          </p>
          <form
            className="mt-6 grid gap-5 md:grid-cols-2"
            noValidate
            onSubmit={submit}
          >
            <RectificationField
              error={errors.name?.message}
              label="Nombre del establecimiento"
            >
              <input className="field" {...register("name")} />
            </RectificationField>
            <RectificationField error={errors.cue?.message} label="CUE">
              <input className="field" {...register("cue")} />
            </RectificationField>
            <RectificationField
              error={errors.directorName?.message}
              label="Director/a"
            >
              <input className="field" {...register("directorName")} />
            </RectificationField>
            <RectificationField
              error={errors.address?.message}
              label="Dirección"
            >
              <input className="field" {...register("address")} />
            </RectificationField>
            <RectificationField
              error={errors.locality?.message}
              label="Localidad"
            >
              <input className="field" {...register("locality")} />
            </RectificationField>
            <RectificationField error={errors.scope?.message} label="Ámbito">
              <input className="field" {...register("scope")} />
            </RectificationField>

            <div className="md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-mendoza-text">Referentes escolares</h3>
                  <p className="mt-1 text-sm text-mendoza-muted">
                    Estos datos quedarán congelados en la rectificación y en la presentación de la campaña.
                  </p>
                </div>
                {!contacts.some(({ type }) => type === "HEALTH_PROMOTION") && (
                  <Button
                    onClick={() =>
                      setValue(
                        "contacts",
                        [
                          ...contacts,
                          {
                            type: "HEALTH_PROMOTION",
                            firstName: "",
                            lastName: "",
                            position: "",
                            phone: "",
                            email: "",
                          },
                        ],
                        { shouldDirty: true },
                      )
                    }
                    variant="outline"
                  >
                    Agregar referente de promoción
                  </Button>
                )}
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {contacts.map((contact, index) => (
                  <fieldset className="rounded-xl border border-mendoza-border p-4" key={contact.type}>
                    <legend className="px-2 font-bold text-mendoza-blue">
                      {contact.type === "RESPONDENT"
                        ? "Referente respondente"
                        : "Promoción de la salud"}
                    </legend>
                    <input type="hidden" {...register(`contacts.${index}.type` as const)} />
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      <RectificationField error={errors.contacts?.[index]?.firstName?.message} label="Nombre">
                        <input className="field" {...register(`contacts.${index}.firstName` as const)} />
                      </RectificationField>
                      <RectificationField error={errors.contacts?.[index]?.lastName?.message} label="Apellido">
                        <input className="field" {...register(`contacts.${index}.lastName` as const)} />
                      </RectificationField>
                      <RectificationField error={errors.contacts?.[index]?.position?.message} label="Cargo">
                        <input className="field" {...register(`contacts.${index}.position` as const)} />
                      </RectificationField>
                      <RectificationField error={errors.contacts?.[index]?.email?.message} label="Correo" required={false}>
                        <input className="field" type="email" {...register(`contacts.${index}.email` as const)} />
                      </RectificationField>
                      <RectificationField label="Teléfono" required={false}>
                        <input className="field" {...register(`contacts.${index}.phone` as const)} />
                      </RectificationField>
                    </div>
                    {contact.type === "HEALTH_PROMOTION" && (
                      <button
                        className="mt-3 text-sm font-semibold text-mendoza-error"
                        onClick={() => setValue("contacts", contacts.filter((_, contactIndex) => contactIndex !== index), { shouldDirty: true })}
                        type="button"
                      >
                        Quitar este referente
                      </button>
                    )}
                  </fieldset>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="font-bold text-mendoza-text">
                Características del establecimiento
              </h3>
              <div className="mt-3 grid gap-4 lg:grid-cols-3">
                <TriStateField
                  control={control}
                  label="¿Tiene kiosco?"
                  name="hasKiosk"
                />
                <TriStateField
                  control={control}
                  label="¿Tiene comedor o servicio alimentario?"
                  name="hasFoodService"
                />
                <TriStateField
                  control={control}
                  label="¿Es albergue?"
                  name="isBoarding"
                />
              </div>
            </div>

            {catalogs?.shifts.available ? (
              <RectificationField
                error={errors.shiftCatalogId?.message}
                label="Jornada"
                required={false}
              >
                <select
                  className="field"
                  {...register("shiftCatalogId", {
                    setValueAs: (value) => value || null,
                  })}
                >
                  <option value="">Sin informar</option>
                  {catalogs.shifts.items.map((shift) => (
                    <option
                      disabled={
                        !shift.isActive &&
                        school.shiftCatalogId !== shift.id
                      }
                      key={shift.id}
                      value={shift.id}
                    >
                      {shift.label}
                      {!shift.isActive ? " (inactiva)" : ""}
                    </option>
                  ))}
                </select>
              </RectificationField>
            ) : (
              <div>
                <p className="text-sm font-semibold text-mendoza-text">
                  Jornada
                </p>
                <div className="mt-2">
                <CatalogUnavailable message={catalogs?.shifts.message} />
                </div>
              </div>
            )}

            <RectificationField
              error={errors.enrollment?.message}
              label="Matrícula total"
              required={false}
            >
              <input
                className="field"
                inputMode="numeric"
                min="0"
                step="1"
                type="number"
                {...register("enrollment", {
                  setValueAs: nullableInteger,
                })}
              />
            </RectificationField>

            <fieldset className="md:col-span-2">
              <legend className="font-bold text-mendoza-text">
                Niveles educativos
              </legend>
              <p className="mt-1 text-sm text-mendoza-muted">
                Seleccioná todos los niveles que correspondan. La matrícula por
                nivel es opcional y no tiene que coincidir obligatoriamente con
                el total.
              </p>
              {catalogs?.educationLevels.available ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {catalogs.educationLevels.items.map((level) => {
                    const selected = selectedLevels.some(
                      ({ levelId }) => levelId === level.id,
                    );
                    const currentSelection = school.educationLevels.some(
                      ({ levelId }) => levelId === level.id,
                    );
                    return (
                      <label
                        className="flex items-center gap-3 rounded-xl border border-mendoza-border p-3 text-sm"
                        key={level.id}
                      >
                        <input
                          checked={selected}
                          disabled={!level.isActive && !currentSelection}
                          onChange={(event) =>
                            toggleLevel(level, event.target.checked)
                          }
                          type="checkbox"
                        />
                        <span>
                          {level.label}
                          {!level.isActive ? " (inactivo)" : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-3">
                  <CatalogUnavailable
                    message={catalogs?.educationLevels.message}
                  />
                </div>
              )}
              {errors.educationLevels?.root?.message && (
                <p className="mt-2 text-sm text-mendoza-error">
                  {errors.educationLevels.root.message}
                </p>
              )}
            </fieldset>

            {selectedLevels.length > 0 && (
              <div className="grid gap-4 rounded-xl bg-mendoza-background p-4 md:col-span-2 sm:grid-cols-2">
                {selectedLevels.map((selection, index) => {
                  const level = catalogs?.educationLevels.items.find(
                    ({ id }) => id === selection.levelId,
                  );
                  return (
                    <RectificationField
                      error={
                        errors.educationLevels?.[index]?.enrollment?.message
                      }
                      key={selection.levelId}
                      label={`Matrícula de ${level?.label ?? "nivel"}`}
                      required={false}
                    >
                      <input
                        className="field"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        type="number"
                        {...register(
                          `educationLevels.${index}.enrollment` as const,
                          { setValueAs: nullableInteger },
                        )}
                      />
                    </RectificationField>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end md:col-span-2">
              <Button
                disabled={isSubmitting}
                icon={<Save size={17} />}
                type="submit"
              >
                {isSubmitting
                  ? "Rectificando…"
                  : "Confirmar rectificación anual"}
              </Button>
            </div>
          </form>
        </section>

        <RectificationHistory entries={school.rectifications ?? []} />
      </div>

      <ConfirmDialog
        confirmLabel="Quitar nivel"
        description={`El nivel ${pendingRemoval?.label ?? ""} tiene una matrícula informada. Si lo quitás, ese dato se eliminará únicamente de esta nueva rectificación; el historial anterior no cambiará.`}
        open={Boolean(pendingRemoval)}
        title="¿Quitar el nivel y su matrícula?"
        onCancel={() => setPendingRemoval(null)}
        onConfirm={() => {
          if (pendingRemoval) removeLevel(pendingRemoval.id);
          setPendingRemoval(null);
        }}
      />
    </main>
  );
}

function RectificationStatus({ school }: { school: SchoolProfile }) {
  return (
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
  );
}

function TriStateField({
  control,
  label,
  name,
}: {
  control: Control<SchoolRectificationValues>;
  label: string;
  name: TriStateName;
}) {
  return (
    <fieldset className="rounded-xl border border-mendoza-border p-4">
      <legend className="px-1 text-sm font-semibold text-mendoza-text">
        {label}
      </legend>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <div className="mt-1 flex flex-wrap gap-4">
            {[
              { label: "Sí", value: true },
              { label: "No", value: false },
              { label: "Sin informar", value: null },
            ].map((option) => (
              <label className="flex items-center gap-2 text-sm" key={option.label}>
                <input
                  checked={field.value === option.value}
                  name={field.name}
                  onBlur={field.onBlur}
                  onChange={() => field.onChange(option.value)}
                  ref={field.ref}
                  type="radio"
                />
                {option.label}
              </label>
            ))}
          </div>
        )}
      />
    </fieldset>
  );
}

function RectificationField({
  label,
  error,
  required = true,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="text-sm font-semibold text-mendoza-text">
      {label}
      {required ? " *" : ""}
      <span className="mt-2 block [&_.field]:w-full [&_.field]:rounded-lg [&_.field]:border [&_.field]:border-mendoza-border [&_.field]:bg-white [&_.field]:px-3 [&_.field]:py-2.5 [&_.field]:outline-none focus-within:[&_.field]:border-mendoza-sky">
        {children}
      </span>
      {error && (
        <span className="mt-1 block font-normal text-mendoza-error">
          {error}
        </span>
      )}
    </label>
  );
}

function CatalogUnavailable({ message }: { message?: string | null }) {
  return (
    <span className="block rounded-lg border border-mendoza-gold bg-amber-50 p-3 font-normal text-amber-900">
      {message ?? "El catálogo no está disponible."}
    </span>
  );
}

function RectificationHistory({
  entries,
}: {
  entries: SchoolProfile["rectifications"];
}) {
  if (!entries.length) return null;
  return (
    <section className="mt-5 rounded-2xl border border-mendoza-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3 text-mendoza-blue">
        <CalendarDays aria-hidden="true" size={21} />
        <h2 className="text-xl font-bold">Historial de rectificaciones</h2>
      </div>
      <p className="mt-2 text-sm text-mendoza-muted">
        Estas copias son de sólo lectura y conservan las etiquetas vigentes al
        momento de confirmar.
      </p>
      <div className="mt-4 space-y-3">
        {entries.map((entry) => (
          <details
            className="rounded-xl border border-mendoza-border p-4"
            key={entry.id}
          >
            <summary className="cursor-pointer font-semibold text-mendoza-text">
              Período {entry.periodYear} · {formatDate(entry.rectifiedAt)}
            </summary>
            <SnapshotDetails snapshot={entry.snapshot} />
          </details>
        ))}
      </div>
    </section>
  );
}

function SnapshotDetails({
  snapshot,
}: {
  snapshot: SchoolRectificationSnapshot;
}) {
  return (
    <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Definition label="Nombre" value={snapshot.name} />
      <Definition label="CUE" value={snapshot.cue} />
      <Definition label="Director/a" value={snapshot.directorName} />
      <Definition
        label="Jornada"
        value={snapshot.shiftCatalog?.label ?? snapshot.shift}
      />
      <Definition
        label="Niveles"
        value={
          snapshot.educationLevels?.map(({ label }) => label).join(", ") ??
          snapshot.educationLevel
        }
      />
      <Definition
        label="Matrícula total"
        value={snapshot.enrollmentTotal}
      />
      <Definition
        label="Tiene kiosco"
        value={formatBoolean(snapshot.hasKiosk)}
      />
      <Definition
        label="Tiene comedor o servicio alimentario"
        value={formatBoolean(snapshot.hasFoodService)}
      />
      <Definition
        label="Es albergue"
        value={formatBoolean(snapshot.isBoarding)}
      />
    </dl>
  );
}

function rectificationValues(
  school: SchoolProfile,
): SchoolRectificationValues {
  return {
    name: school.name,
    cue: school.cue,
    directorName: school.directorName,
    address: school.address,
    locality: school.locality,
    scope: school.scope,
    hasKiosk: school.hasKiosk ?? null,
    hasFoodService: school.hasFoodService ?? null,
    isBoarding: school.isBoarding ?? null,
    shiftCatalogId: school.shiftCatalogId ?? null,
    enrollment: school.enrollment ?? null,
    educationLevels: school.educationLevels.map(
      ({ levelId, enrollment }) => ({
        levelId,
        enrollment,
      }),
    ),
    contacts: (() => {
      const saved = school.contacts ?? [];
      const respondent = saved.find(({ type }) => type === "RESPONDENT");
      const healthPromotion = saved.find(
        ({ type }) => type === "HEALTH_PROMOTION",
      );
      return [
        {
          type: "RESPONDENT" as const,
          firstName: respondent?.firstName ?? school.referentFirstName,
          lastName: respondent?.lastName ?? school.referentLastName,
          position: respondent?.position ?? "",
          phone: respondent?.phone ?? school.referentPhone ?? "",
          email: respondent?.email ?? school.referentEmail ?? "",
        },
        ...(healthPromotion
          ? [
              {
                type: "HEALTH_PROMOTION" as const,
                firstName: healthPromotion.firstName,
                lastName: healthPromotion.lastName,
                position: healthPromotion.position ?? "",
                phone: healthPromotion.phone ?? "",
                email: healthPromotion.email ?? "",
              },
            ]
          : []),
      ];
    })(),
    expectedUpdatedAt: school.updatedAt,
  };
}

const nullableInteger = (value: unknown) =>
  value === "" || value === null || value === undefined ? null : Number(value);

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
        {value === null || value === undefined || value === ""
          ? "—"
          : String(value)}
      </dd>
    </div>
  );
}

function formatBoolean(value: boolean | null | undefined) {
  if (value === null || value === undefined) return "Sin informar";
  return value ? "Sí" : "No";
}
