import { AlertTriangle, Archive, ClipboardList, FileDown, History, School, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { PreliminaryResultRadar } from "../../components/results/PreliminaryResultRadar";
import { HistoricalSchoolProfile } from "../../components/schools/HistoricalSchoolProfile";
import { ActiveStatusBadge } from "../../components/ui/StatusBadge";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingState } from "../../components/ui/LoadingState";
import { PageHeader } from "../../components/ui/PageHeader";
import { Button } from "../../components/ui/Button";
import { formatDateTime, formatNumber } from "../../lib/format";
import { getHttpErrorMessage } from "../../lib/http-error";
import { showError } from "../../lib/toast";
import { adminSchoolResultDetailService } from "../../services/admin-school-result-detail.service";
import type { AdminExcludedQuestion, AdminHistoricalAnswer, AdminSchoolResultDetail } from "../../types/admin-school-result-detail";

type Tab = "summary" | "answers" | "excluded" | "profile" | "history";
const tabs: Array<{ id: Tab; label: string }> = [
  { id: "summary", label: "Resumen" }, { id: "answers", label: "Respuestas" },
  { id: "excluded", label: "Exclusiones" }, { id: "profile", label: "Ficha histórica" },
  { id: "history", label: "Historial" },
];

export function AdminSchoolResultDetailPage() {
  const { campaignId, schoolId } = useParams<{ campaignId: string; schoolId: string }>();
  const [params] = useSearchParams();
  const [detail, setDetail] = useState<AdminSchoolResultDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("summary");
  const [downloading, setDownloading] = useState(false);
  const backTo = useMemo(() => safeBack(params.get("volver")), [params]);

  useEffect(() => {
    if (!campaignId || !schoolId) return;
    const controller = new AbortController();
    setLoading(true); setError("");
    adminSchoolResultDetailService.get(campaignId, schoolId, controller.signal)
      .then(setDetail)
      .catch((requestError) => { if (!controller.signal.aborted) setError(getHttpErrorMessage(requestError)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [campaignId, schoolId]);

  if (loading) return <main className="p-4 sm:p-8"><LoadingState label="Cargando detalle histórico…" /></main>;
  if (error || !detail) return <main className="p-4 sm:p-8"><ErrorState message={error || "No se pudo cargar el detalle."} /></main>;

  return <main className="p-4 sm:p-8"><div className="mx-auto max-w-7xl">
    <PageHeader actions={detail.result ? <Button disabled={downloading} icon={<FileDown size={18} />} onClick={() => { if (!campaignId || !schoolId) return; setDownloading(true); adminSchoolResultDetailService.downloadReport(campaignId, schoolId, detail.school.cue).catch((downloadError) => showError(getHttpErrorMessage(downloadError))).finally(() => setDownloading(false)); }}>Descargar reporte PDF</Button> : undefined} backLabel="Volver a la consulta" backTo={backTo} eyebrow="Detalle administrativo por escuela" title={detail.school.name}
      description={`CUE ${detail.school.cue} · ${detail.school.department}, ${detail.school.locality}`} />
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <ActiveStatusBadge isActive={detail.school.isActive} />
      <Status status={detail.participationStatus} />
      <span className="text-sm text-mendoza-muted">Etapa: <strong className="text-mendoza-text">{detail.campaign.name}</strong></span>
    </div>
    <Card className="mt-5"><dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Datum label="Gestión actual" value={detail.school.managementType || "No disponible"} /><Datum label="Ámbito actual" value={detail.school.scope || "No disponible"} /><Datum label="Nivel actual" value={detail.school.educationLevel || "No disponible"} /><Datum label="Período de etapa" value={`${formatDateTime(detail.campaign.startsAt)} — ${formatDateTime(detail.campaign.endsAt)}`} /><Datum label="Último guardado" value={formatDateTime(detail.submission?.lastSavedAt)} /><Datum label="Fecha de envío" value={formatDateTime(detail.submission?.submittedAt)} /><Datum label="Usuario original" value={detail.submission ? `${detail.submission.originalRespondent.firstName} ${detail.submission.originalRespondent.lastName}`.trim() || "No disponible" : "Sin presentación"} /><Datum label="Estado del usuario" value={detail.submission?.originalRespondent.isActive === false ? "Inactivo" : detail.submission?.originalRespondent.isActive === true ? "Activo" : "No disponible"} /></dl></Card>
    {detail.submission && (!detail.dataQuality.historicalProfileAvailable || (detail.participationStatus === "submitted" && !detail.dataQuality.resultSnapshotAvailable)) && <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900" role="status"><strong>Información histórica incompleta.</strong> Algunos datos no están disponibles para este resultado anterior y no fueron reemplazados por valores actuales.</div>}
    <nav aria-label="Secciones del detalle" className="mt-6 flex gap-2 overflow-x-auto border-b border-mendoza-border pb-2">
      {tabs.map(({ id, label }) => <button aria-current={tab === id ? "page" : undefined} className={`min-h-11 whitespace-nowrap rounded-lg px-4 text-sm font-semibold ${tab === id ? "bg-mendoza-blue text-white" : "text-mendoza-blue hover:bg-mendoza-blue/5"}`} key={id} onClick={() => setTab(id)} type="button">{label}</button>)}
    </nav>
    <div className="mt-6">{tab === "summary" && <Summary detail={detail} />}{tab === "answers" && <Answers detail={detail} />}{tab === "excluded" && <Excluded detail={detail} />}{tab === "profile" && <Profile detail={detail} />}{tab === "history" && <HistoryPanel detail={detail} />}</div>
  </div></main>;
}

function Summary({ detail }: { detail: AdminSchoolResultDetail }) {
  if (!detail.submission) return <EmptyState icon={ClipboardList} title="Presentación no iniciada" description="La escuela no inició una presentación para esta etapa." />;
  if (detail.participationStatus === "draft") return <StateCard title="Presentación en borrador" text={`Iniciada ${formatDateTime(detail.submission.startedAt)}. Último guardado: ${formatDateTime(detail.submission.lastSavedAt)}.`} />;
  if (!detail.result) return <StateCard title="Presentación enviada sin resultado" text="El envío está registrado, pero todavía no hay un resultado persistido para mostrar." />;
  const result = detail.result;
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Puntaje general" value={result.generalScore === null ? "No disponible" : `${formatNumber(result.generalScore)} / 100`} />
      <Metric label="Estrellas base" value={stars(result.stars.base)} />
      <Metric label="Estrellas finales" value={stars(result.stars.final)} />
      <Metric label="Versión de configuración" value={result.stars.configurationVersion ?? "No disponible"} />
    </div>
    {(result.stars.blockingReasons.length > 0 || result.alerts.length > 0) && <Card className="border-red-200 bg-red-50"><h2 className="flex items-center gap-2 font-bold text-red-800"><AlertTriangle size={19} /> Alertas y limitaciones</h2><ul className="mt-3 space-y-3 text-sm text-red-800">{result.stars.blockingReasons.map((reason) => <li className="list-inside list-disc" key={reason}>{reason}</li>)}{result.alerts.map((alert, index) => <li className="rounded-lg bg-white/70 p-3" key={index}><strong>{String(alert.message ?? alert.code ?? "Alerta de evaluación")}</strong><span className="mt-1 block">Dimensión: {String(alert.dimensionCode ?? "No disponible")} · Valor: {String(alert.observedValue ?? "No disponible")} · Umbral: {String(alert.threshold ?? "No disponible")}</span><span className="block">Impacto en estrellas: {String(alert.starsBefore ?? "No disponible")} → {String(alert.starsAfter ?? "No disponible")} · {alert.causedBlocking ? "Aplicó una limitación" : "Sin limitación"}</span></li>)}</ul></Card>}
    <Card><PreliminaryResultRadar dimensions={result.dimensions} /><ul className="mt-5 grid gap-3 sm:grid-cols-2">{result.dimensions.map((dimension) => <li className="rounded-lg border border-mendoza-border p-3 text-sm" key={dimension.code}><strong>{dimension.code} · {dimension.title}</strong><span className="mt-1 block">{dimension.isCritical ? `Crítica · umbral ${dimension.criticalThreshold ?? "no disponible"} · valor ${dimension.criticalValue ?? "no disponible"}` : "Sin criticidad registrada"}</span></li>)}</ul></Card>
    <Card><h2 className="font-bold text-mendoza-text">Trazabilidad del cálculo</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Datum label="Cuestionario" value={result.survey ? `${result.survey.name} · v${result.survey.version.number}` : "No disponible"} /><Datum label="Método de cálculo" value={calculationMethodLabel(result.calculation.algorithmVersion)} /><Datum label="Fecha de cálculo" value={formatDateTime(result.calculation.calculatedAt)} /><Datum label="Versión del registro" value={`Versión ${result.calculation.snapshotSchemaVersion}`} /><Datum label="Origen del cálculo" value={calculationSourceLabel(result.calculation.source)} /><Datum label="Ejecutado por" value={result.calculation.calculatedBy ? `${result.calculation.calculatedBy.firstName} ${result.calculation.calculatedBy.lastName}` : "Proceso automático o usuario no disponible"} /><Datum label="Fecha de envío" value={formatDateTime(detail.submission?.submittedAt)} /></dl></Card>
  </div>;
}

function Answers({ detail }: { detail: AdminSchoolResultDetail }) { const answers = detail.result?.answers ?? []; return answers.length ? <GroupedAnswers answers={answers} /> : <EmptyState title="No hay respuestas enviadas disponibles" description="Las respuestas aparecen cuando existe un resultado histórico persistido." />; }
function GroupedAnswers({ answers }: { answers: AdminHistoricalAnswer[] }) { const groups = answers.reduce<Record<string, AdminHistoricalAnswer[]>>((grouped, answer) => { (grouped[answer.dimension.title] ??= []).push(answer); return grouped; }, {}); return <div className="space-y-3">{Object.entries(groups).map(([dimension, values]) => <details className="rounded-xl border border-mendoza-border bg-white p-4" key={dimension} open><summary className="cursor-pointer font-bold text-mendoza-blue">{dimension} · {values.length}</summary><div className="mt-4 space-y-3">{values.map((answer) => <article className="rounded-lg bg-mendoza-background p-4" key={answer.id}><p className="text-xs font-bold text-mendoza-muted">{answer.code} · {answer.section.title} · orden {answer.order}</p><h3 className="mt-1 font-semibold">{answer.prompt}</h3><p className="mt-2 text-sm"><strong>Respuesta:</strong> {displayAnswer(answer.answer.optionLabel ?? answer.answer.value)}</p><p className="text-sm"><strong>Puntaje usado:</strong> {answer.answer.scoreUsed ?? "No aplica"}</p><p className="text-sm"><strong>Obligatoria:</strong> {answer.required ? "Sí" : "No"} · <strong>Aplicabilidad:</strong> {answer.applicability === "applicable" ? "Aplicable" : answer.applicability}</p></article>)}</div></details>)}</div>; }
function Excluded({ detail }: { detail: AdminSchoolResultDetail }) { const excluded = detail.result?.excludedQuestions ?? []; return excluded.length ? <div className="space-y-3">{excluded.map((question) => <Card as="article" key={question.id}><p className="text-xs font-bold text-mendoza-muted">{question.code} · {question.dimension.title}</p><h2 className="mt-1 font-semibold">{question.prompt}</h2><p className="mt-3 text-sm"><strong>Motivo:</strong> {question.exclusion.reason}</p><ExclusionDetails exclusion={question.exclusion} /></Card>)}</div> : <EmptyState title="No hay preguntas excluidas" description="El registro no contiene exclusiones para este resultado." />; }
function Profile({ detail }: { detail: AdminSchoolResultDetail }) { return detail.historicalSchoolProfile ? <Card><h2 className="flex items-center gap-2 text-xl font-bold text-mendoza-text"><Archive size={20} /> Ficha usada al enviar</h2><p className="mt-1 text-sm text-mendoza-muted">Estos son los datos congelados de la escuela; no se sustituyen por su ficha actual.</p><HistoricalSchoolProfile profile={detail.historicalSchoolProfile} /></Card> : <EmptyState icon={School} title="Ficha histórica no disponible" description="Esta presentación antigua no conserva una fotografía de la escuela." />; }
function HistoryPanel({ detail }: { detail: AdminSchoolResultDetail }) { return <div className="grid gap-5 lg:grid-cols-2"><Card><h2 className="flex items-center gap-2 font-bold"><UserRound size={19} /> Usuario original</h2>{detail.submission ? <dl className="mt-4 space-y-3"><Datum label="Nombre" value={`${detail.submission.originalRespondent.firstName} ${detail.submission.originalRespondent.lastName}`.trim() || "No disponible"} /><Datum label="Correo" value={detail.submission.originalRespondent.email || "No disponible"} /><Datum label="Estado actual" value={detail.submission.originalRespondent.isActive === null ? "Usuario eliminado o sin dato actual" : detail.submission.originalRespondent.isActive ? "Activo" : "Inactivo"} /></dl> : <p className="mt-3 text-sm text-mendoza-muted">No existe presentación.</p>}</Card><Card><h2 className="flex items-center gap-2 font-bold"><History size={19} /> Eventos disponibles</h2>{detail.history.length ? <ol className="mt-4 space-y-4">{detail.history.map((event, index) => <li className="border-l-2 border-mendoza-sky pl-3" key={`${event.type}-${event.at}-${index}`}><p className="font-semibold">{event.label}</p><time className="text-sm text-mendoza-muted">{formatDateTime(event.at)}</time></li>)}</ol> : <p className="mt-3 text-sm text-mendoza-muted">No hay eventos disponibles.</p>}</Card></div>; }

function Metric({ label, value }: { label: string; value: string }) { return <Card><p className="text-sm font-semibold text-mendoza-muted">{label}</p><p className="mt-2 text-2xl font-bold text-mendoza-blue">{value}</p></Card>; }
function StateCard({ title, text }: { title: string; text: string }) { return <Card><h2 className="text-xl font-bold text-mendoza-text">{title}</h2><p className="mt-2 text-mendoza-muted">{text}</p></Card>; }
function Datum({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-bold uppercase tracking-wide text-mendoza-muted">{label}</dt><dd className="mt-1 break-words text-sm text-mendoza-text">{value}</dd></div>; }
function ExclusionDetails({ exclusion }: { exclusion: AdminExcludedQuestion["exclusion"] }) {
  const facts = Object.entries(exclusion.relevantSchoolFacts);
  return <div className="mt-4 grid gap-4 lg:grid-cols-2">
    <section className="rounded-lg bg-mendoza-background p-4">
      <h3 className="text-sm font-bold text-mendoza-blue">Datos de la escuela considerados</h3>
      {facts.length ? <dl className="mt-3 space-y-2">{facts.map(([feature, value]) => <div className="flex flex-wrap justify-between gap-2 text-sm" key={feature}><dt className="font-semibold text-mendoza-text">{featureLabel(feature)}</dt><dd className="text-mendoza-muted">{applicabilityValueLabel(value)}</dd></div>)}</dl> : <p className="mt-2 text-sm text-mendoza-muted">No hay datos adicionales registrados.</p>}
    </section>
    <section className="rounded-lg border border-mendoza-border p-4">
      <h3 className="text-sm font-bold text-mendoza-blue">Condiciones consideradas</h3>
      {exclusion.rules.length ? <ol className="mt-3 space-y-3">{exclusion.rules.map((rule, ruleIndex) => <li className="text-sm" key={ruleIndex}><p className="font-semibold text-mendoza-text">{actionLabel(rule.action)} cuando {rule.groupOperator === "any" ? "se cumple alguna condición" : "se cumplen todas las condiciones"}:</p><ul className="mt-1 list-disc space-y-1 pl-5 text-mendoza-muted">{rule.conditions.map((condition, conditionIndex) => <li key={conditionIndex}><span className="font-medium text-mendoza-text">{featureLabel(condition.feature)}</span> {operatorLabel(condition.operator)} <span className="font-medium text-mendoza-text">{applicabilityValueLabel(condition.expectedValue)}</span></li>)}</ul></li>)}</ol> : <p className="mt-2 text-sm text-mendoza-muted">No hay condiciones detalladas disponibles.</p>}
    </section>
  </div>;
}
function Status({ status }: { status: AdminSchoolResultDetail["participationStatus"] }) { const labels = { not_started: "No iniciada", draft: "Borrador", submitted: "Enviada" }; return <span className="rounded-full bg-mendoza-background px-3 py-1 text-xs font-bold text-mendoza-blue">{labels[status]}</span>; }
function stars(value: number | null) { return value === null ? "No disponible" : `${value} ${"★".repeat(value)}`; }
function displayAnswer(value: unknown): string { if (value === null || value === undefined || value === "") return "No informado"; if (typeof value === "boolean") return value ? "Sí" : "No"; if (typeof value === "object") return JSON.stringify(value); return String(value); }
function calculationMethodLabel(version: string) {
  const labels: Record<string, string> = {
    "question-average-dynamic-denominator-v1": "Promedio por pregunta con denominador dinámico (versión 1)",
    "question-average-legacy-v0": "Promedio por pregunta histórico (versión 0)",
  };
  return labels[version] ?? (version ? `Motor de evaluación (versión ${version})` : "No disponible para este resultado");
}
function calculationSourceLabel(source: string) {
  const labels: Record<string, string> = {
    submission: "Envío del cuestionario",
    submission_finalization: "Envío final del cuestionario",
    single_recalculation: "Recálculo individual",
    system: "Proceso automático del sistema",
  };
  return labels[source] ?? "Proceso de cálculo registrado";
}
function featureLabel(feature: string) {
  const labels: Record<string, string> = {
    has_kiosk: "Tiene kiosco",
    has_food_service: "Tiene comedor o servicio alimentario",
    is_boarding: "Es albergue",
    shift: "Jornada",
    education_levels: "Nivel educativo",
    enrollment_total: "Matrícula total",
  };
  return labels[feature] ?? feature.replaceAll("_", " ").replace(/^./, (letter) => letter.toLocaleUpperCase("es-AR"));
}
function operatorLabel(operator: string) {
  const labels: Record<string, string> = {
    equals: "es igual a",
    not_equals: "es distinto de",
    in: "está entre",
    contains: "contiene",
    not_contains: "no contiene",
    contains_any: "contiene alguno de",
    contains_all: "contiene todos",
    greater_than: "es mayor que",
    greater_than_or_equal: "es mayor o igual que",
    less_than: "es menor que",
    less_than_or_equal: "es menor o igual que",
  };
  return labels[operator] ?? "cumple con";
}
function actionLabel(action: string) { return action === "show" ? "Mostrar la pregunta" : "Omitir la pregunta"; }
function applicabilityValueLabel(value: unknown): string {
  if (value === true || value === "true") return "Sí";
  if (value === false || value === "false") return "No";
  if (value === null || value === undefined || value === "") return "No informado";
  if (Array.isArray(value)) return value.map(applicabilityValueLabel).join(", ");
  if (typeof value === "object") return "Dato registrado";
  return String(value);
}
function safeBack(value: string | null) { return value?.startsWith("/admin/") && !value.startsWith("//") ? value : "/admin/seguimiento"; }
