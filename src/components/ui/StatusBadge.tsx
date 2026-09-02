import type { SurveyVersionStatus } from "../../types/admin-survey";
import type { CampaignStatus } from "../../types/admin-campaign";

const successStatusStyle = "bg-green-100 text-green-800";

const versionStyles: Record<SurveyVersionStatus, string> = {
  draft: "bg-amber-50 text-amber-800",
  published: successStatusStyle,
  archived: "bg-slate-100 text-slate-700",
};

const versionLabels: Record<SurveyVersionStatus, string> = {
  draft: "Borrador",
  published: "Publicada",
  archived: "Archivada",
};

export function VersionStatusBadge({ status }: { status: SurveyVersionStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${versionStyles[status]}`}>
      {versionLabels[status]}
    </span>
  );
}

export function ActiveStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${
        isActive ? successStatusStyle : "bg-slate-100 text-slate-700"
      }`}
    >
      {isActive ? "Activo" : "Inactivo"}
    </span>
  );
}

const campaignStyles: Record<CampaignStatus, string> = {
  draft: "bg-amber-50 text-amber-800",
  active: successStatusStyle,
  closed: "bg-slate-100 text-slate-700",
  archived: "bg-mendoza-blue-soft text-mendoza-blue",
};

const campaignLabels: Record<CampaignStatus, string> = {
  draft: "Borrador",
  active: "Activa",
  closed: "Cerrada",
  archived: "Archivada",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold ${campaignStyles[status]}`}
    >
      {campaignLabels[status]}
    </span>
  );
}
