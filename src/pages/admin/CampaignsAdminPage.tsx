import {
  Archive,
  CalendarRange,
  CirclePlay,
  ListChecks,
  LockKeyhole,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { PageHeader } from "../../components/ui/PageHeader";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { SearchableSelect } from "../../components/ui/SearchableSelect";
import { CampaignStatusBadge } from "../../components/ui/StatusBadge";
import { inputClassName } from "../../components/ui/form-styles";
import { formatDateTime } from "../../lib/format";
import { getHttpErrorMessage } from "../../lib/http-error";
import { showError, showSuccess } from "../../lib/toast";
import { adminCampaignsService } from "../../services/admin-campaigns.service";
import type {
  AdminCampaign,
  AdminCampaignListResponse,
  CampaignStatus,
  CampaignType,
} from "../../types/admin-campaign";

const emptyList: AdminCampaignListResponse = {
  items: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
};

type PendingAction =
  | { kind: "status"; campaign: AdminCampaign; status: CampaignStatus }
  | { kind: "delete"; campaign: AdminCampaign };

const typeLabels: Record<CampaignType, string> = {
  annual: "Anual",
  semiannual: "Semestral",
};

export function CampaignsAdminPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState(emptyList);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [status, setStatus] = useState<CampaignStatus | "">("");
  const [type, setType] = useState<CampaignType | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const listRequest = useRef<AbortController | null>(null);

  const load = useCallback(
    async (page = 1, query = appliedSearch) => {
      listRequest.current?.abort();
      const controller = new AbortController();
      listRequest.current = controller;
      setIsLoading(true);
      setError("");
      try {
        setCampaigns(
          await adminCampaignsService.list(
            {
              search: query || undefined,
              status: status || undefined,
              type: type || undefined,
              page,
              limit: 20,
            },
            controller.signal,
          ),
        );
      } catch (loadError) {
        if (!controller.signal.aborted)
          setError(getHttpErrorMessage(loadError));
      } finally {
        if (listRequest.current === controller) setIsLoading(false);
      }
    },
    [appliedSearch, status, type],
  );

  useEffect(() => {
    void load();
    return () => listRequest.current?.abort();
  }, [load]);

  const executeAction = async () => {
    if (!pendingAction) return;
    setIsProcessing(true);
    try {
      if (pendingAction.kind === "delete") {
        await adminCampaignsService.remove(pendingAction.campaign.id);
        showSuccess("La etapa borrador fue eliminada.");
      } else {
        await adminCampaignsService.setStatus(
          pendingAction.campaign.id,
          pendingAction.status,
        );
        showSuccess(statusSuccessMessage(pendingAction.status));
      }
      setPendingAction(null);
      await load(campaigns.pagination.page);
    } catch (actionError) {
      showError(getHttpErrorMessage(actionError));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="p-4 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeader
          actions={
            <Button
              icon={<Plus aria-hidden="true" size={18} />}
              onClick={() => navigate("/admin/campanas/nueva")}
            >
              Nueva etapa
            </Button>
          }
          description="Configurá los períodos de evaluación y vinculalos con una versión publicada e inmutable del cuestionario."
          eyebrow="Administración"
          title="Etapas"
        />

        <form
          className="mt-6 grid gap-3 rounded-2xl border border-mendoza-border bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_180px_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            const nextSearch = search.trim();
            if (nextSearch === appliedSearch) void load(1, nextSearch);
            else setAppliedSearch(nextSearch);
          }}
        >
          <label className="text-sm font-semibold text-mendoza-text">
            Buscar
            <input
              className={`${inputClassName} mt-1`}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Etapa o cuestionario"
              value={search}
            />
          </label>
          <SearchableSelect
            allLabel="Todos"
            label="Estado"
            onChange={(value) => setStatus(value as CampaignStatus | "")}
            options={[
              { value: "draft", label: "Borrador" },
              { value: "active", label: "Activa" },
              { value: "closed", label: "Cerrada" },
              { value: "archived", label: "Archivada" },
            ]}
            value={status}
          />
          <SearchableSelect
            allLabel="Todas"
            label="Periodicidad"
            onChange={(value) => setType(value as CampaignType | "")}
            options={[
              { value: "annual", label: "Anual" },
              { value: "semiannual", label: "Semestral" },
            ]}
            value={type}
          />
          <Button
            className="self-end"
            icon={<Search aria-hidden="true" size={17} />}
            type="submit"
          >
            Buscar
          </Button>
        </form>

        <div className="mt-8">
          {isLoading ? (
            <LoadingState label="Cargando etapas…" />
          ) : error ? (
            <ErrorState message={error} onRetry={() => void load()} />
          ) : campaigns.items.length === 0 ? (
            <EmptyState
              action={
                <Button
                  icon={<Plus aria-hidden="true" size={18} />}
                  onClick={() => navigate("/admin/campanas/nueva")}
                >
                  Crear etapa
                </Button>
              }
              description="Necesitás al menos una versión publicada para crear una etapa."
              icon={CalendarRange}
              title="Todavía no hay etapas"
            />
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {campaigns.items.map((campaign) => (
                <CampaignCard
                  campaign={campaign}
                  key={campaign.id}
                  onAction={setPendingAction}
                />
              ))}
            </div>
          )}
        </div>

        {!error && (
          <PaginationControls
            loading={isLoading}
            onPageChange={(page) => void load(page)}
            pagination={campaigns.pagination}
          />
        )}
      </div>

      <ConfirmDialog
        confirmLabel={pendingAction ? actionLabel(pendingAction) : "Confirmar"}
        description={
          pendingAction ? actionDescription(pendingAction) : "Confirmá la acción."
        }
        destructive={pendingAction?.kind === "delete"}
        isProcessing={isProcessing}
        onCancel={() => setPendingAction(null)}
        onConfirm={executeAction}
        open={Boolean(pendingAction)}
        title={pendingAction ? actionTitle(pendingAction) : "Confirmar acción"}
      />
    </main>
  );
}

function CampaignCard({
  campaign,
  onAction,
}: {
  campaign: AdminCampaign;
  onAction: (action: PendingAction) => void;
}) {
  return (
    <Card as="article">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CampaignStatusBadge status={campaign.status} />
            <span className="rounded-full bg-mendoza-blue-soft px-3 py-1 text-xs font-bold text-mendoza-blue">
              {typeLabels[campaign.type]}
            </span>
          </div>
          <h2 className="mt-3 text-xl font-bold text-mendoza-text">
            {campaign.name}
          </h2>
          {campaign.workflowCycle && campaign.sequenceOrder && (
            <p className="mt-1 text-xs font-semibold text-mendoza-muted">
              {campaign.workflowCycle} · Paso {campaign.sequenceOrder}
            </p>
          )}
        </div>
        <CalendarRange
          aria-hidden="true"
          className="shrink-0 text-mendoza-blue"
        />
      </div>

      <p className="mt-4 text-sm leading-6 text-mendoza-muted">
        {campaign.description ?? "Sin descripción."}
      </p>
      <dl className="mt-5 grid gap-4 border-y border-mendoza-border py-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-bold uppercase text-mendoza-muted">
            Período
          </dt>
          <dd className="mt-1 text-sm text-mendoza-text">
            {formatCivilDate(campaign.startDate)} al{" "}
            {formatCivilDate(campaign.endDate)}
          </dd>
          <dd className="mt-1 text-xs text-mendoza-muted">
            Cierre: 23:59:59, hora de Mendoza
          </dd>
        </div>
        <div>
          <dt className="text-xs font-bold uppercase text-mendoza-muted">
            Cuestionario
          </dt>
          <dd className="mt-1 text-sm text-mendoza-text">
            {campaign.surveyVersion.survey.name}
          </dd>
          <dd className="mt-1 text-xs text-mendoza-muted">
            Versión {campaign.surveyVersion.versionNumber} · publicada{" "}
            {formatDateTime(campaign.surveyVersion.publishedAt)}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-mendoza-blue px-3 text-sm font-semibold text-mendoza-blue hover:bg-mendoza-blue-soft"
          to={`/admin/campanas/${campaign.id}/escuelas`}
        >
          <Users aria-hidden="true" size={16} /> Escuelas
        </Link>
        <Link
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-mendoza-blue px-3 text-sm font-semibold text-mendoza-blue hover:bg-mendoza-blue-soft"
          to={`/admin/seguimiento?campania=${campaign.id}`}
        >
          <ListChecks aria-hidden="true" size={16} /> Seguimiento
        </Link>
        {campaign.status === "draft" && (
          <>
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-mendoza-blue px-3 text-sm font-semibold text-mendoza-blue hover:bg-mendoza-blue-soft"
              to={`/admin/campanas/${campaign.id}/editar`}
            >
              <Pencil aria-hidden="true" size={16} /> Editar
            </Link>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-mendoza-success hover:bg-green-50"
              onClick={() =>
                onAction({ kind: "status", campaign, status: "active" })
              }
              type="button"
            >
              <CirclePlay aria-hidden="true" size={16} /> Activar
            </button>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-mendoza-error hover:bg-red-50"
              onClick={() => onAction({ kind: "delete", campaign })}
              type="button"
            >
              <Trash2 aria-hidden="true" size={16} /> Eliminar
            </button>
          </>
        )}
        {campaign.status === "active" && (
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-mendoza-blue px-3 text-sm font-semibold text-mendoza-blue hover:bg-mendoza-blue-soft"
            onClick={() =>
              onAction({ kind: "status", campaign, status: "closed" })
            }
            type="button"
          >
            <LockKeyhole aria-hidden="true" size={16} /> Cerrar
          </button>
        )}
        {campaign.status === "closed" && (
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-mendoza-blue px-3 text-sm font-semibold text-mendoza-blue hover:bg-mendoza-blue-soft"
            onClick={() =>
              onAction({ kind: "status", campaign, status: "archived" })
            }
            type="button"
          >
            <Archive aria-hidden="true" size={16} /> Archivar
          </button>
        )}
        {campaign.status === "archived" && (
          <p className="text-sm text-mendoza-muted">
            Registro histórico de sólo lectura.
          </p>
        )}
      </div>
    </Card>
  );
}

function formatCivilDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function actionLabel(action: PendingAction) {
  if (action.kind === "delete") return "Eliminar etapa";
  if (action.status === "active") return "Activar etapa";
  if (action.status === "closed") return "Cerrar etapa";
  return "Archivar etapa";
}

function actionTitle(action: PendingAction) {
  if (action.kind === "delete") return "¿Eliminar etapa?";
  if (action.status === "active") return "¿Activar etapa?";
  if (action.status === "closed") return "¿Cerrar etapa ahora?";
  return "¿Archivar etapa?";
}

function actionDescription(action: PendingAction) {
  if (action.kind === "delete")
    return "La eliminación sólo está disponible mientras la etapa sea un borrador.";
  if (action.status === "active")
    return "Una vez activa, la configuración quedará protegida y no podrá volver a borrador.";
  if (action.status === "closed")
    return "El cierre manual es irreversible. La etapa dejará de admitir nuevas cargas cuando se implemente el módulo de presentaciones.";
  return "La etapa quedará conservada como antecedente histórico de sólo lectura.";
}

function statusSuccessMessage(status: CampaignStatus) {
  if (status === "active") return "La etapa fue activada.";
  if (status === "closed") return "La etapa fue cerrada.";
  return "La etapa fue archivada.";
}
