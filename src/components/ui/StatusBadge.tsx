import type { SurveyVersionStatus } from "../../types/admin-survey";

const versionStyles: Record<SurveyVersionStatus, string> = {
  draft: "bg-amber-50 text-amber-800",
  published: "bg-green-50 text-mendoza-success",
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
        isActive
          ? "bg-green-50 text-mendoza-success"
          : "bg-slate-100 text-slate-700"
      }`}
    >
      {isActive ? "Activo" : "Inactivo"}
    </span>
  );
}
