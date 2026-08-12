import {
  ArrowLeft,
  CalendarDays,
  ClipboardCheck,
  KeyRound,
  Pencil,
  Save,
  ShieldCheck,
  ShieldOff,
  UserRound,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SchoolCampaignActivity } from "../../components/schools/SchoolCampaignActivity";
import { RectificationStatusNotice } from "../../components/schools/RectificationStatusNotice";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { LoadingState } from "../../components/ui/LoadingState";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import { getHttpErrorMessage } from "../../lib/http-error";
import { showError, showSuccess } from "../../lib/toast";
import { adminSchoolsService } from "../../services/admin-schools.service";
import type { SchoolDetail } from "../../types/admin-school";
import type { SchoolUserSummary } from "../../types/admin-school";

const emptyAssignableUsers = {
  items: [] as SchoolUserSummary[],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
};

export function SchoolDetailPage() {
  const { id } = useParams();
  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [eligibleUsers, setEligibleUsers] = useState(emptyAssignableUsers);
  const [userSearch, setUserSearch] = useState("");
  const [appliedUserSearch, setAppliedUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<SchoolUserSummary | null>(
    null,
  );
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const detailRequest = useRef<AbortController | null>(null);
  const usersRequest = useRef<AbortController | null>(null);

  const loadSchool = useCallback(async () => {
    if (!id) return;
    detailRequest.current?.abort();
    const controller = new AbortController();
    detailRequest.current = controller;
    try {
      const detail = await adminSchoolsService.findOne(id);
      if (controller.signal.aborted) return;
      setSchool(detail);
      setSelectedUser(detail.users[0] ?? null);
    } catch (error) {
      if (!controller.signal.aborted) showError(getHttpErrorMessage(error));
    }
  }, [id]);

  const loadEligibleUsers = useCallback(
    async (page = 1, search = appliedUserSearch) => {
      if (!id) return;
      usersRequest.current?.abort();
      const controller = new AbortController();
      usersRequest.current = controller;
      setLoadingUsers(true);
      try {
        const response = await adminSchoolsService.assignableUsers(
          id,
          { search: search || undefined, page, limit: 20 },
          controller.signal,
        );
        if (!controller.signal.aborted) setEligibleUsers(response);
      } catch (error) {
        if (!controller.signal.aborted) showError(getHttpErrorMessage(error));
      } finally {
        if (usersRequest.current === controller) setLoadingUsers(false);
      }
    },
    [appliedUserSearch, id],
  );

  useEffect(() => {
    void loadSchool();
    return () => detailRequest.current?.abort();
  }, [loadSchool]);
  useEffect(() => {
    void loadEligibleUsers(1);
    return () => usersRequest.current?.abort();
  }, [loadEligibleUsers]);

  const selectableUsers =
    selectedUser &&
    !eligibleUsers.items.some((candidate) => candidate.id === selectedUser.id)
      ? [selectedUser, ...eligibleUsers.items]
      : eligibleUsers.items;
  const changeStatus = async () => {
    if (!school) return;
    const wasActive = school.isActive;
    setChangingStatus(true);
    try {
      setSchool(await adminSchoolsService.setStatus(school.id, !wasActive));
      showSuccess(
        wasActive
          ? "Colegio desactivado: acceso bloqueado, sesiones cerradas e historial conservado."
          : "Colegio activado. El usuario debe iniciar una sesión nueva.",
      );
      setStatusDialogOpen(false);
    } catch (error) {
      showError(getHttpErrorMessage(error));
    } finally {
      setChangingStatus(false);
    }
  };
  const assign = async () => {
    if (!school) return;
    setSaving(true);
    try {
      setSchool(
        await adminSchoolsService.assignUser(
          school.id,
          selectedUser?.id ?? null,
        ),
      );
      showSuccess(
        selectedUser
          ? "Usuario asociado y cambio registrado."
          : "Usuario desvinculado y cambio registrado.",
      );
      await loadSchool();
      await loadEligibleUsers(eligibleUsers.pagination.page);
    } catch (error) {
      showError(getHttpErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };
  if (!school)
    return (
      <main className="p-4 sm:p-8">
        <LoadingState label="Cargando detalle…" />
      </main>
    );
  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-semibold text-mendoza-blue"
          to="/admin/colegios"
        >
          <ArrowLeft size={17} />
          Volver al padrón
        </Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-mendoza-text">
                {school.name}
              </h1>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${school.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {school.isActive ? "Activo" : "Inactivo"}
              </span>
            </div>
            <p className="mt-2 text-mendoza-muted">
              CUE {school.cue}
              {school.schoolNumber ? ` · N.º ${school.schoolNumber}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-mendoza-blue px-4 text-sm font-semibold text-mendoza-blue"
              to={`/admin/colegios/${school.id}/editar`}
            >
              <Pencil size={17} />
              Editar
            </Link>
            <Button
              icon={
                school.isActive ? (
                  <ShieldOff size={17} />
                ) : (
                  <ShieldCheck size={17} />
                )
              }
              onClick={() => setStatusDialogOpen(true)}
              variant={school.isActive ? "outline" : "primary"}
            >
              {school.isActive ? "Desactivar" : "Activar"}
            </Button>
          </div>
        </div>
        <RectificationStatusNotice
          className="mt-5"
          status={school.rectification}
        />
        {!school.isActive && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            El colegio conserva todo su historial, pero su usuario no puede
            iniciar sesión ni realizar nuevas cargas mientras esté inactivo. Las
            sesiones anteriores permanecen revocadas aunque se reactive.
          </div>
        )}
        <div className="mt-6 grid gap-5 xl:grid-cols-3">
          <section className="rounded-2xl border border-mendoza-border bg-white p-5 shadow-sm xl:col-span-2">
            <h2 className="text-xl font-bold text-mendoza-blue">
              Datos institucionales
            </h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Datum
                label="Ubicación"
                value={`${school.address}, ${school.locality}, ${school.department}`}
              />
              <Datum label="Tipo de educación" value={school.educationLevel} />
              <Datum
                label="Niveles estructurados"
                value={
                  school.educationLevels.map(({ label }) => label).join(", ") ||
                  "Sin informar"
                }
              />
              <Datum label="Director/a" value={school.directorName} />
              <Datum label="Gestión" value={school.managementType} />
              <Datum
                label="Ámbito / Jornada"
                value={
                  [school.scope, school.shift].filter(Boolean).join(" · ") ||
                  "Sin informar"
                }
              />
              <Datum
                label="Jornada estructurada"
                value={school.shiftCatalog?.label ?? "Sin informar"}
              />
              <Datum
                label="Matrícula"
                value={
                  school.enrollment === null
                    ? "Sin informar"
                    : school.enrollment.toLocaleString("es-AR")
                }
              />
              <Datum label="Kiosco" value={yesNoUnknown(school.hasKiosk)} />
              <Datum
                label="Comedor o servicio alimentario"
                value={yesNoUnknown(school.hasFoodService)}
              />
              <Datum label="Albergue" value={yesNoUnknown(school.isBoarding)} />
              <Datum
                label="Contacto"
                value={
                  [school.email, school.phone].filter(Boolean).join(" · ") ||
                  "Sin informar"
                }
              />
              <Datum
                label="Referente responsable"
                value={`${school.referentFirstName} ${school.referentLastName}`}
              />
              <Datum
                label="Contacto del responsable"
                value={
                  [school.referentEmail, school.referentPhone]
                    .filter(Boolean)
                    .join(" · ") || "Sin informar"
                }
              />
              <Datum
                label="Última actualización"
                value={date(school.updatedAt)}
              />
            </dl>
            {Object.keys(school.characteristics).length > 0 && (
              <div className="mt-5 border-t border-mendoza-border pt-4">
                <h3 className="font-semibold">Características</h3>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  {Object.entries(school.characteristics).map(
                    ([key, value]) => (
                      <Datum key={key} label={key} value={String(value)} />
                    ),
                  )}
                </dl>
              </div>
            )}
          </section>
          <section className="rounded-2xl border border-mendoza-border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <UserRound className="text-mendoza-blue" />
              <h2 className="text-xl font-bold text-mendoza-blue">
                Usuario Colegio
              </h2>
            </div>
            {school.users.length ? (
              school.users.map((user) => (
                <div
                  className="mt-4 rounded-xl bg-mendoza-background p-4"
                  key={user.id}
                >
                  <p className="font-semibold">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="break-all text-sm text-mendoza-muted">
                    {user.email}
                  </p>
                  <p className="mt-2 text-xs">
                    {user.isActive ? "Activo" : "Bloqueado"} ·{" "}
                    {user.lastLoginAt
                      ? `Último acceso ${date(user.lastLoginAt)}`
                      : "Sin accesos"}
                  </p>
                </div>
              ))
            ) : (
              <p className="mt-4 text-sm text-mendoza-muted">
                No hay un usuario asociado.
              </p>
            )}
            <label className="mt-5 block text-sm font-semibold">
              Buscar usuario
              <span className="mt-2 flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded-lg border border-mendoza-border px-3 py-2.5 font-normal"
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Nombre o correo"
                  value={userSearch}
                />
                <Button
                  onClick={() => {
                    const nextSearch = userSearch.trim();
                    if (nextSearch === appliedUserSearch)
                      void loadEligibleUsers(1, nextSearch);
                    else setAppliedUserSearch(nextSearch);
                  }}
                  variant="outline"
                >
                  Buscar
                </Button>
              </span>
            </label>
            <div className="mt-4">
              <SearchableSelect
                allLabel="Sin usuario"
                disabled={loadingUsers}
                label="Asociar o reemplazar"
                onChange={(userId) =>
                  setSelectedUser(
                    selectableUsers.find(
                      (candidate) => candidate.id === userId,
                    ) ?? null,
                  )
                }
                options={selectableUsers.map((user) => ({
                  value: user.id,
                  label: `${user.lastName}, ${user.firstName} · ${user.email}${
                    user.assignedSchool && user.assignedSchool.id !== school.id
                      ? ` · Actualmente en ${user.assignedSchool.name}`
                      : ""
                  }`,
                }))}
                value={selectedUser?.id ?? ""}
              />
            </div>
            <PaginationControls
              loading={loadingUsers}
              onPageChange={(page) => void loadEligibleUsers(page)}
              pagination={eligibleUsers.pagination}
            />
            <Button
              className="mt-3 w-full"
              disabled={saving}
              icon={<Save size={17} />}
              onClick={() => void assign()}
            >
              {saving ? "Guardando…" : "Guardar asociación"}
            </Button>
            <p className="mt-2 text-xs text-mendoza-muted">
              Se muestran usuarios activos con rol Colegio. Si elegís uno
              asociado a otro establecimiento, se trasladará a este colegio y el
              cambio quedará registrado en ambos historiales.
            </p>
          </section>
        </div>
        <SchoolCampaignActivity
          campaigns={school.campaigns}
          evaluations={school.evaluations}
          schoolId={school.id}
        />
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <Timeline
            title="Historial de asociaciones"
            icon={<Users />}
            empty="Todavía no hay cambios de asociación."
            entries={school.assignmentHistory.map((entry) => ({
              id: entry.id,
              date: entry.createdAt,
              title:
                entry.action === "assigned"
                  ? "Usuario asociado"
                  : entry.action === "replaced"
                    ? "Usuario reemplazado"
                    : "Usuario desvinculado",
              detail: `${entry.previousUser?.email ?? "Sin usuario"} → ${entry.newUser?.email ?? "Sin usuario"}`,
            }))}
          />
          <Timeline
            title="Accesos recientes"
            icon={<KeyRound />}
            empty="No hay accesos registrados."
            entries={school.accesses.map((entry) => ({
              id: entry.id,
              date: entry.createdAt,
              title: entry.user?.email ?? "Usuario del colegio",
              detail: entry.revokedAt
                ? "Sesión revocada"
                : new Date(entry.expiresAt) < new Date()
                  ? "Sesión vencida"
                  : "Sesión vigente",
            }))}
          />
        </div>
        <Timeline
          className="mt-5"
          title="Rectificaciones anuales"
          icon={<CalendarDays />}
          empty="Todavía no hay rectificaciones registradas."
          entries={school.rectifications.map((entry) => ({
            id: entry.id,
            date: entry.rectifiedAt,
            title: `Período ${entry.periodYear}`,
            detail: entry.actorUser
              ? `${entry.actorUser.firstName} ${entry.actorUser.lastName} · ${snapshotSummary(entry.snapshot)}`
              : `Usuario eliminado · ${snapshotSummary(entry.snapshot)}`,
          }))}
        />
        <Timeline
          className="mt-5"
          title="Auditoría del colegio"
          icon={<ClipboardCheck />}
          empty="No hay acciones auditadas."
          entries={school.audits.map((entry) => ({
            id: entry.id,
            date: entry.createdAt,
            title: auditLabel(entry.action),
            detail: `${Object.keys(entry.changes).length} dato(s) registrado(s)`,
          }))}
        />
      </div>
      <ConfirmDialog
        confirmLabel={
          school.isActive ? "Desactivar colegio" : "Activar colegio"
        }
        description={
          school.isActive
            ? "Se impedirá el inicio de sesión, se cerrarán todas las sesiones vigentes y se bloquearán nuevas cargas. La escuela, sus asociaciones y todo el historial se conservarán."
            : "La escuela volverá a estar habilitada, pero las sesiones anteriores no se recuperarán: el usuario deberá iniciar sesión nuevamente."
        }
        destructive={school.isActive}
        isProcessing={changingStatus}
        onCancel={() => setStatusDialogOpen(false)}
        onConfirm={changeStatus}
        open={statusDialogOpen}
        title={school.isActive ? "¿Desactivar colegio?" : "¿Activar colegio?"}
      />
    </main>
  );
}
function Datum({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-mendoza-muted">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-mendoza-text">{value}</dd>
    </div>
  );
}

function yesNoUnknown(value: boolean | null) {
  if (value === null) return "Sin informar";
  return value ? "Sí" : "No";
}

function snapshotSummary(
  snapshot: SchoolDetail["rectifications"][number]["snapshot"],
) {
  const shift = snapshot.shiftCatalog?.label ?? snapshot.shift;
  const levels =
    snapshot.educationLevels?.map(({ label }) => label).join(", ") ||
    snapshot.educationLevel;
  return `Jornada: ${shift || "Sin informar"} · Niveles: ${levels || "Sin informar"} · Matrícula: ${snapshot.enrollmentTotal ?? "Sin informar"}`;
}
function Timeline({
  title,
  icon,
  entries,
  empty,
  className = "",
}: {
  title: string;
  icon: React.ReactNode;
  entries: Array<{ id: string; date: string; title: string; detail: string }>;
  empty: string;
  className?: string;
}) {
  return (
    <section
      className={`${className} rounded-2xl border border-mendoza-border bg-white p-5 shadow-sm`}
    >
      <div className="flex items-center gap-2 text-mendoza-blue">
        {icon}
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      {entries.length ? (
        <ul className="mt-4 max-h-80 space-y-3 overflow-auto">
          {entries.map((entry) => (
            <li className="border-l-2 border-mendoza-sky pl-3" key={entry.id}>
              <p className="font-semibold text-mendoza-text">{entry.title}</p>
              <p className="break-all text-sm text-mendoza-muted">
                {entry.detail}
              </p>
              <time className="text-xs text-mendoza-muted">
                {date(entry.date)}
              </time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-mendoza-muted">{empty}</p>
      )}
    </section>
  );
}
const date = (value: string) =>
  new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
const auditLabel = (action: string) =>
  ({
    SCHOOL_CREATED: "Colegio creado",
    SCHOOL_UPDATED: "Datos modificados",
    SCHOOL_ACTIVATED: "Colegio activado",
    SCHOOL_DEACTIVATED: "Colegio desactivado",
    SCHOOL_SESSIONS_REVOKED: "Sesiones del colegio revocadas",
    SCHOOL_USER_ASSIGNED: "Usuario asociado",
    SCHOOL_USER_REPLACED: "Usuario reemplazado",
    SCHOOL_USER_UNASSIGNED: "Usuario desvinculado",
    SCHOOL_RECTIFIED: "Ficha anual rectificada",
  })[action] ?? action;
