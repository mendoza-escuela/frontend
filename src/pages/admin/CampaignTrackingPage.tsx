import {
  AlertTriangle,
  CircleDashed,
  FilePenLine,
  ListChecks,
  Search,
  Send,
  School,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ActiveStatusBadge } from "../../components/ui/StatusBadge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { PageHeader } from "../../components/ui/PageHeader";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { inputClassName } from "../../components/ui/form-styles";
import { formatDateTime } from "../../lib/format";
import { getHttpErrorMessage } from "../../lib/http-error";
import { adminCampaignTrackingService } from "../../services/admin-campaign-tracking.service";
import type {
  CampaignParticipationStatus,
  CampaignTrackingList,
  CampaignTrackingSchool,
  CampaignTrackingSort,
  CampaignTrackingSummary,
} from "../../types/admin-campaign-tracking";
import type { AdminCampaign } from "../../types/admin-campaign";

const emptyList: CampaignTrackingList = {
  items: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
};

const statusLabels: Record<CampaignParticipationStatus, string> = {
  not_started: "No iniciada",
  draft: "Borrador",
  submitted: "Enviada",
};

const statusClasses: Record<CampaignParticipationStatus, string> = {
  not_started: "bg-slate-100 text-slate-700",
  draft: "bg-amber-50 text-amber-800",
  submitted: "bg-green-50 text-mendoza-success",
};

export function CampaignTrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [campaignId, setCampaignId] = useState("");
  const [summary, setSummary] = useState<CampaignTrackingSummary | null>(null);
  const [tracking, setTracking] = useState(emptyList);
  const [search, setSearch] = useState(searchParams.get("buscar") ?? "");
  const [appliedSearch, setAppliedSearch] = useState(searchParams.get("buscar") ?? "");
  const [status, setStatus] = useState<CampaignParticipationStatus | "">((searchParams.get("estado") as CampaignParticipationStatus | null) ?? "");
  const [sortBy, setSortBy] = useState<CampaignTrackingSort>((searchParams.get("orden") as CampaignTrackingSort | null) ?? "school");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">((searchParams.get("direccion") as "asc" | "desc" | null) ?? "asc");
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [campaignError, setCampaignError] = useState("");
  const [trackingError, setTrackingError] = useState("");
  const request = useRef<AbortController | null>(null);
  const requestedCampaign = useRef(searchParams.get("campania"));

  const loadCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    setCampaignError("");
    try {
      const response = await adminCampaignTrackingService.campaigns();
      setCampaigns(response);
      const selected =
        response.find(({ id }) => id === requestedCampaign.current) ??
        response[0] ??
        null;
      setCampaignId(selected?.id ?? "");
    } catch (error) {
      setCampaignError(getHttpErrorMessage(error));
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  const loadTracking = useCallback(
    async (page = 1) => {
      if (!campaignId) return;
      request.current?.abort();
      const controller = new AbortController();
      request.current = controller;
      setTrackingLoading(true);
      setTrackingError("");
      try {
        const [nextSummary, nextTracking] = await Promise.all([
          adminCampaignTrackingService.summary(campaignId, controller.signal),
          adminCampaignTrackingService.list(
            campaignId,
            {
              search: appliedSearch || undefined,
              status: status || undefined,
              sortBy,
              sortDirection,
              page,
              limit: 20,
            },
            controller.signal,
          ),
        ]);
        setSummary(nextSummary);
        setTracking(nextTracking);
      } catch (error) {
        if (!controller.signal.aborted)
          setTrackingError(getHttpErrorMessage(error));
      } finally {
        if (request.current === controller) setTrackingLoading(false);
      }
    },
    [appliedSearch, campaignId, sortBy, sortDirection, status],
  );

  useEffect(() => {
    void loadTracking();
    return () => request.current?.abort();
  }, [loadTracking]);

  const selectedCampaign = useMemo(
    () => campaigns.find(({ id }) => id === campaignId) ?? null,
    [campaignId, campaigns],
  );

  useEffect(() => {
    const next = new URLSearchParams();
    if (campaignId) next.set("campania", campaignId);
    if (appliedSearch) next.set("buscar", appliedSearch);
    if (status) next.set("estado", status);
    if (sortBy !== "school") next.set("orden", sortBy);
    if (sortDirection !== "asc") next.set("direccion", sortDirection);
    setSearchParams(next, { replace: true });
  }, [appliedSearch, campaignId, setSearchParams, sortBy, sortDirection, status]);

  const selectCampaign = (nextCampaignId: string) => {
    setCampaignId(nextCampaignId);
    setSearchParams(
      nextCampaignId ? { campania: nextCampaignId } : {},
      { replace: true },
    );
  };

  if (campaignsLoading) {
    return (
      <main className="p-4 sm:p-8">
        <LoadingState label="Cargando campañas…" />
      </main>
    );
  }

  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          description="Consultá el estado actual de participación de todas las escuelas incluidas en cada campaña."
          eyebrow="Administración"
          title="Seguimiento de presentaciones"
        />

        {campaignError ? (
          <div className="mt-8">
            <ErrorState
              message={campaignError}
              onRetry={() => void loadCampaigns()}
            />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              description="Creá una campaña para comenzar a consultar la participación institucional."
              icon={ListChecks}
              title="No hay campañas disponibles"
            />
          </div>
        ) : (
          <>
            <Card className="mt-7">
              <label className="block text-sm font-semibold text-mendoza-text">
                Campaña
                <select
                  className={`${inputClassName} mt-1 max-w-2xl`}
                  onChange={(event) => selectCampaign(event.target.value)}
                  value={campaignId}
                >
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
              </label>
              {selectedCampaign && (
                <p className="mt-2 text-sm text-mendoza-muted">
                  {selectedCampaign.status === "draft"
                    ? "Campaña en borrador"
                    : selectedCampaign.status === "active"
                      ? "Campaña activa"
                      : selectedCampaign.status === "closed"
                        ? "Campaña cerrada"
                        : "Campaña archivada"}
                  {" · "}
                  {selectedCampaign.surveyVersion.survey.name}, versión{" "}
                  {selectedCampaign.surveyVersion.versionNumber}
                </p>
              )}
            </Card>

            {trackingError ? (
              <div className="mt-6">
                <ErrorState
                  message={trackingError}
                  onRetry={() => void loadTracking()}
                />
              </div>
            ) : (
              <>
                {summary && <TrackingSummary summary={summary} />}

                <form
                  className="mt-6 grid gap-3 rounded-2xl border border-mendoza-border bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-[1fr_180px_190px_150px_auto]"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const nextSearch = search.trim();
                    if (nextSearch === appliedSearch) void loadTracking(1);
                    else setAppliedSearch(nextSearch);
                  }}
                >
                  <label className="text-sm font-semibold text-mendoza-text">
                    Buscar escuela
                    <input
                      className={`${inputClassName} mt-1`}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="CUE o nombre"
                      value={search}
                    />
                  </label>
                  <label className="text-sm font-semibold text-mendoza-text">
                    Estado
                    <select
                      className={`${inputClassName} mt-1`}
                      onChange={(event) =>
                        setStatus(
                          event.target
                            .value as CampaignParticipationStatus | "",
                        )
                      }
                      value={status}
                    >
                      <option value="">Todos</option>
                      <option value="not_started">No iniciada</option>
                      <option value="draft">Borrador</option>
                      <option value="submitted">Enviada</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-mendoza-text">
                    Ordenar por
                    <select
                      className={`${inputClassName} mt-1`}
                      onChange={(event) =>
                        setSortBy(event.target.value as CampaignTrackingSort)
                      }
                      value={sortBy}
                    >
                      <option value="school">Escuela</option>
                      <option value="status">Estado</option>
                      <option value="last_saved_at">Último guardado</option>
                      <option value="submitted_at">Fecha de envío</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-mendoza-text">
                    Dirección
                    <select
                      className={`${inputClassName} mt-1`}
                      onChange={(event) =>
                        setSortDirection(
                          event.target.value as "asc" | "desc",
                        )
                      }
                      value={sortDirection}
                    >
                      <option value="asc">Ascendente</option>
                      <option value="desc">Descendente</option>
                    </select>
                  </label>
                  <Button
                    className="self-end"
                    icon={<Search aria-hidden="true" size={17} />}
                    type="submit"
                  >
                    Buscar
                  </Button>
                </form>

                <div className="mt-6">
                  {trackingLoading ? (
                    <LoadingState label="Cargando seguimiento…" />
                  ) : tracking.items.length === 0 ? (
                    <EmptyState
                      description={
                        summary?.totalSchools === 0
                          ? "No hay escuelas registradas dentro del período de inclusión de esta campaña."
                          : "No se encontraron escuelas para los filtros seleccionados."
                      }
                      icon={School}
                      title={
                        summary?.totalSchools === 0
                          ? "Campaña sin escuelas"
                          : "Sin coincidencias"
                      }
                    />
                  ) : (
                    <TrackingTable campaignId={campaignId} items={tracking.items} returnTo={`/admin/seguimiento?${searchParams.toString()}`} />
                  )}
                </div>

                <PaginationControls
                  loading={trackingLoading}
                  onPageChange={(page) => void loadTracking(page)}
                  pagination={tracking.pagination}
                />
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function TrackingSummary({ summary }: { summary: CampaignTrackingSummary }) {
  const cards = [
    {
      label: "Escuelas incluidas",
      value: summary.totalSchools,
      detail: "Universo total",
      icon: School,
      color: "text-mendoza-blue",
    },
    {
      label: "Enviadas",
      value: summary.states.submitted.count,
      detail: `${formatPercentage(summary.states.submitted.percentage)} del total`,
      icon: Send,
      color: "text-mendoza-success",
    },
    {
      label: "Borradores",
      value: summary.states.draft.count,
      detail: `${formatPercentage(summary.states.draft.percentage)} del total`,
      icon: FilePenLine,
      color: "text-amber-700",
    },
    {
      label: "No iniciadas",
      value: summary.states.not_started.count,
      detail: `${formatPercentage(summary.states.not_started.percentage)} del total`,
      icon: CircleDashed,
      color: "text-slate-600",
    },
  ];
  return (
    <section aria-labelledby="tracking-summary-title" className="mt-6">
      <h2 className="sr-only" id="tracking-summary-title">
        Resumen de participación
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, detail, icon: Icon, color }) => (
          <Card as="article" key={label}>
            <Icon aria-hidden="true" className={color} size={24} />
            <p className="mt-3 text-sm font-semibold text-mendoza-muted">
              {label}
            </p>
            <p className="mt-1 text-3xl font-bold text-mendoza-text">{value}</p>
            <p className="mt-1 text-sm text-mendoza-muted">{detail}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-mendoza-text">
              Avance general de envíos
            </h3>
            <p className="mt-1 text-sm text-mendoza-muted">
              Presentaciones enviadas sobre el total de escuelas incluidas. Los
              borradores se informan por separado y no reciben una ponderación.
            </p>
          </div>
          <p className="text-3xl font-bold text-mendoza-blue">
            {formatPercentage(summary.submittedPercentage)}
          </p>
        </div>
        <div
          aria-label={`${formatPercentage(summary.submittedPercentage)} de presentaciones enviadas`}
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={summary.submittedPercentage}
          className="mt-4 h-3 overflow-hidden rounded-full bg-mendoza-border"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-mendoza-blue transition-[width]"
            style={{ width: `${summary.submittedPercentage}%` }}
          />
        </div>
      </Card>
    </section>
  );
}

function TrackingTable({ campaignId, items, returnTo }: { campaignId: string; items: CampaignTrackingSchool[]; returnTo: string }) {
  return (
    <>
      <div className="grid gap-3 lg:hidden">
        {items.map((item) => (
          <TrackingCard campaignId={campaignId} item={item} key={item.school.id} returnTo={returnTo} />
        ))}
      </div>
      <div className="hidden overflow-x-auto rounded-2xl border border-mendoza-border bg-white shadow-sm lg:block">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">
            Seguimiento de presentaciones escolares
          </caption>
          <thead className="bg-mendoza-blue text-white">
            <tr>
              {[
                "CUE / Escuela",
                "Estado",
                "Avance",
                "Último guardado",
                "Fecha de envío",
                "Usuario original",
                "Estados actuales",
                "Acciones",
              ].map((header) => (
                <th className="px-4 py-3" key={header} scope="col">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-mendoza-border">
            {items.map((item) => (
              <tr
                className={
                  !item.school.isActive ||
                  item.originalRespondent?.isActive === false
                    ? "bg-slate-50"
                    : ""
                }
                key={item.school.id}
              >
                <td className="px-4 py-3">
                  <p className="font-semibold text-mendoza-text">
                    {item.school.name}
                  </p>
                  <p className="text-mendoza-muted">CUE {item.school.cue}</p>
                </td>
                <td className="px-4 py-3">
                  <ParticipationBadge status={item.status} />
                </td>
                <td className="px-4 py-3">
                  <Progress item={item} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-mendoza-text">
                  {formatDateTime(item.submission?.lastSavedAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-mendoza-text">
                  {formatDateTime(item.submission?.submittedAt)}
                </td>
                <td className="px-4 py-3">
                  <OriginalRespondent item={item} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-xs font-semibold text-mendoza-muted">
                      Escuela
                    </span>
                    <ActiveStatusBadge isActive={item.school.isActive} />
                    <span className="mt-1 text-xs font-semibold text-mendoza-muted">
                      Usuario
                    </span>
                    <UserStatus item={item} />
                  </div>
                </td>
                <td className="px-4 py-3"><DetailLink campaignId={campaignId} schoolId={item.school.id} returnTo={returnTo} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function TrackingCard({ campaignId, item, returnTo }: { campaignId: string; item: CampaignTrackingSchool; returnTo: string }) {
  return (
    <Card
      as="article"
      className={
        !item.school.isActive || item.originalRespondent?.isActive === false
          ? "bg-slate-50"
          : ""
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-mendoza-text">{item.school.name}</h2>
          <p className="text-sm text-mendoza-muted">CUE {item.school.cue}</p>
        </div>
        <ParticipationBadge status={item.status} />
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <MobileDetail label="Avance">
          <Progress item={item} />
        </MobileDetail>
        <MobileDetail label="Último guardado">
          {formatDateTime(item.submission?.lastSavedAt)}
        </MobileDetail>
        <MobileDetail label="Fecha de envío">
          {formatDateTime(item.submission?.submittedAt)}
        </MobileDetail>
        <MobileDetail label="Usuario original">
          <OriginalRespondent item={item} />
        </MobileDetail>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-mendoza-border pt-4">
        <span className="text-xs text-mendoza-muted">Escuela:</span>
        <ActiveStatusBadge isActive={item.school.isActive} />
        <span className="ml-2 text-xs text-mendoza-muted">Usuario:</span>
        <UserStatus item={item} />
      </div>
      <div className="mt-4"><DetailLink campaignId={campaignId} schoolId={item.school.id} returnTo={returnTo} /></div>
    </Card>
  );
}

function DetailLink({ campaignId, schoolId, returnTo }: { campaignId: string; schoolId: string; returnTo: string }) {
  return <Link className="inline-flex min-h-11 items-center rounded-lg border border-mendoza-blue px-4 text-sm font-semibold text-mendoza-blue hover:bg-mendoza-blue/5" to={`/admin/campanas/${campaignId}/colegios/${schoolId}/resultado?volver=${encodeURIComponent(returnTo)}`}>Ver detalle</Link>;
}

function ParticipationBadge({
  status,
}: {
  status: CampaignParticipationStatus;
}) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold ${statusClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

function Progress({ item }: { item: CampaignTrackingSchool }) {
  return (
    <div>
      <p className="font-semibold text-mendoza-text">
        {formatPercentage(item.progress.percentage)}
      </p>
      {item.status === "draft" && (
        <p className="text-xs text-mendoza-muted">
          {item.progress.answered}/{item.progress.applicable} respuestas
        </p>
      )}
    </div>
  );
}

function OriginalRespondent({ item }: { item: CampaignTrackingSchool }) {
  if (!item.originalRespondent) {
    return (
      <span className="inline-flex items-center gap-1 text-mendoza-muted">
        {!item.historicalDataComplete && (
          <AlertTriangle
            aria-label="Datos históricos incompletos"
            className="text-amber-700"
            size={15}
          />
        )}
        {item.submission ? "Sin datos históricos" : "Sin usuario original"}
      </span>
    );
  }
  return (
    <div>
      <p className="font-medium text-mendoza-text">
        {item.originalRespondent.firstName}{" "}
        {item.originalRespondent.lastName}
      </p>
      <p className="text-xs text-mendoza-muted">
        {item.originalRespondent.email}
      </p>
      {!item.historicalDataComplete && (
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-amber-700">
          <AlertTriangle aria-hidden="true" size={14} />
          Historial incompleto
        </p>
      )}
    </div>
  );
}

function UserStatus({ item }: { item: CampaignTrackingSchool }) {
  const active = item.originalRespondent?.isActive;
  if (active === null || active === undefined) {
    return (
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
        Sin estado actual
      </span>
    );
  }
  return <ActiveStatusBadge isActive={active} />;
}

function MobileDetail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase text-mendoza-muted">{label}</dt>
      <dd className="mt-1 text-mendoza-text">{children}</dd>
    </div>
  );
}

function formatPercentage(value: number) {
  return `${new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
  }).format(value)}%`;
}
