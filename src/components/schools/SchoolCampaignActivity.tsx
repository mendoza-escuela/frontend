import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  FilePenLine,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatDateTime } from "../../lib/format";
import type {
  SchoolDetail,
  SchoolDetailCampaignActivity,
  SchoolDetailEvaluation,
} from "../../types/admin-school";

type SchoolCampaignActivityProps = {
  campaigns: SchoolDetail["campaigns"];
  evaluations: SchoolDetail["evaluations"];
  schoolId: string;
};

const participationLabels = {
  not_started: "No iniciada",
  draft: "Borrador",
  submitted: "Enviada",
} as const;

const participationClasses = {
  not_started: "bg-slate-100 text-slate-700",
  draft: "bg-amber-50 text-amber-800",
  submitted: "bg-green-50 text-mendoza-success",
} as const;

export function SchoolCampaignActivity({
  campaigns,
  evaluations,
  schoolId,
}: SchoolCampaignActivityProps) {
  const campaignNames = new Map(
    campaigns.items.map(({ campaign }) => [campaign.id, campaign.name]),
  );

  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <ActivitySection
        icon={<CalendarDays aria-hidden="true" />}
        title="Etapas"
      >
        {!campaigns.available ? (
          <UnavailableMessage message={campaigns.message} />
        ) : campaigns.items.length === 0 ? (
          <EmptyMessage
            message={
              campaigns.message ||
              "El colegio todavía no fue incorporado a ninguna etapa."
            }
          />
        ) : (
          <ul className="mt-4 space-y-3">
            {campaigns.items.map((activity) => (
              <CampaignActivityCard
                activity={activity}
                key={activity.assignment.id}
                schoolId={schoolId}
              />
            ))}
          </ul>
        )}
      </ActivitySection>

      <ActivitySection
        icon={<ClipboardCheck aria-hidden="true" />}
        title="Evaluaciones"
      >
        {!evaluations.available ? (
          <UnavailableMessage message={evaluations.message} />
        ) : evaluations.items.length === 0 ? (
          <EmptyMessage
            message={
              evaluations.message ||
              "Todavía no hay resultados calculados para este colegio."
            }
          />
        ) : (
          <ul className="mt-4 space-y-3">
            {evaluations.items.map((evaluation) => (
              <EvaluationCard
                campaignName={campaignNames.get(evaluation.campaignId)}
                evaluation={evaluation}
                key={evaluation.id}
                schoolId={schoolId}
              />
            ))}
          </ul>
        )}
      </ActivitySection>
    </div>
  );
}

function ActivitySection({
  children,
  icon,
  title,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-mendoza-border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-mendoza-blue">
        {icon}
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function CampaignActivityCard({
  activity,
  schoolId,
}: {
  activity: SchoolDetailCampaignActivity;
  schoolId: string;
}) {
  const detailUrl = resultDetailUrl(activity.campaign.id, schoolId);
  return (
    <li className="rounded-xl border border-mendoza-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words font-bold text-mendoza-text">
            {activity.campaign.name}
          </h3>
          <p className="mt-1 text-xs text-mendoza-muted">
            {campaignStatusLabel(activity.campaign.status)} · Asignada el{" "}
            {formatDateTime(activity.assignment.assignedAt)}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${participationClasses[activity.participationStatus]}`}
        >
          {participationLabels[activity.participationStatus]}
        </span>
      </div>

      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <ActivityDatum
          label="Período"
          value={`${formatDateTime(activity.campaign.startsAt)} — ${formatDateTime(activity.campaign.endsAt)}`}
        />
        <ActivityDatum
          label={
            activity.participationStatus === "submitted"
              ? "Fecha de envío"
              : "Último guardado"
          }
          value={formatDateTime(
            activity.submission?.submittedAt ??
              activity.submission?.lastSavedAt ??
              activity.submission?.startedAt,
          )}
        />
      </dl>

      <p className="mt-3 flex items-center gap-2 text-sm text-mendoza-muted">
        {activity.result.available ? (
          <BarChart3
            aria-hidden="true"
            className="text-mendoza-success"
            size={17}
          />
        ) : (
          <FilePenLine
            aria-hidden="true"
            className="text-mendoza-muted"
            size={17}
          />
        )}
        {activity.result.available
          ? `Resultado calculado ${formatDateTime(activity.result.calculatedAt)}`
          : resultPendingLabel(activity.participationStatus)}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link className={secondaryLinkClass} to={detailUrl}>
          {detailLinkLabel(activity)}
        </Link>
        <Link
          className={secondaryLinkClass}
          to={`/admin/seguimiento?campania=${activity.campaign.id}`}
        >
          Ver en seguimiento
        </Link>
      </div>
    </li>
  );
}

function EvaluationCard({
  campaignName,
  evaluation,
  schoolId,
}: {
  campaignName?: string;
  evaluation: SchoolDetailEvaluation;
  schoolId: string;
}) {
  return (
    <li className="rounded-xl border border-mendoza-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-mendoza-text">
            {campaignName ?? "Etapa histórica"}
          </h3>
          <p className="mt-1 text-xs text-mendoza-muted">
            Calculada el {formatDateTime(evaluation.calculatedAt)}
          </p>
        </div>
        <span className="rounded-lg bg-mendoza-blue px-3 py-2 text-sm font-bold text-white">
          {evaluation.generalScore === null
            ? "Puntaje no disponible"
            : `${formatScore(evaluation.generalScore)} / 100`}
        </span>
      </div>
      <p className="mt-3 text-sm text-mendoza-muted">
        {evaluation.stars === null
          ? "Certificación sin dato histórico"
          : `${evaluation.stars} ${evaluation.stars === 1 ? "estrella" : "estrellas"}`}
      </p>
      <Link
        className={`${secondaryLinkClass} mt-4`}
        to={resultDetailUrl(evaluation.campaignId, schoolId)}
      >
        Ver resultado
      </Link>
    </li>
  );
}

function ActivityDatum({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-mendoza-muted">
        {label}
      </dt>
      <dd className="mt-1 break-words text-mendoza-text">{value}</dd>
    </div>
  );
}

function EmptyMessage({ message }: { message: string }) {
  return <p className="mt-4 text-sm text-mendoza-muted">{message}</p>;
}

function UnavailableMessage({ message }: { message: string }) {
  return (
    <p className="mt-4 rounded-lg border border-mendoza-gold bg-amber-50 p-3 text-sm text-amber-900">
      {message}
    </p>
  );
}

function resultDetailUrl(campaignId: string, schoolId: string) {
  const returnTo = encodeURIComponent(`/admin/colegios/${schoolId}`);
  return `/admin/campanas/${campaignId}/colegios/${schoolId}/resultado?volver=${returnTo}`;
}

function detailLinkLabel(activity: SchoolDetailCampaignActivity) {
  if (activity.result.available) return "Ver resultado";
  return "Ver detalle";
}

function resultPendingLabel(
  participationStatus: SchoolDetailCampaignActivity["participationStatus"],
) {
  if (participationStatus === "submitted")
    return "Presentación enviada; resultado todavía no disponible";
  if (participationStatus === "draft") return "Presentación en borrador";
  return "Presentación todavía no iniciada";
}

function campaignStatusLabel(
  status: SchoolDetailCampaignActivity["campaign"]["status"],
) {
  return {
    draft: "Borrador",
    active: "Activa",
    closed: "Cerrada",
    archived: "Archivada",
  }[status];
}

function formatScore(value: number) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(
    value,
  );
}

const secondaryLinkClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-mendoza-blue px-4 py-2 text-sm font-semibold text-mendoza-blue transition hover:bg-mendoza-blue-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mendoza-blue";
