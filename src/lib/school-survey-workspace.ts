import type { SchoolSubmissionWorkspace } from "../types/school-campaign";

/**
 * Identifica el contrato visible del workspace sin incluir timestamps ni
 * respuestas. Permite adoptar cambios autoritativos de estructura o
 * aplicabilidad sin confundirlos con una respuesta vieja de autoguardado.
 */
export function schoolSurveyWorkspaceFingerprint(
  workspace: Pick<SchoolSubmissionWorkspace, "survey" | "applicability">,
) {
  return JSON.stringify({
    survey: workspace.survey,
    applicability: {
      status: workspace.applicability.status,
      missingFields: [...workspace.applicability.missingFields].sort(byCode),
      excluded: [...workspace.applicability.excluded].sort(byQuestionId),
      incomplete: [...workspace.applicability.incomplete].sort(byQuestionId),
    },
  });
}

function byCode(left: { code: string }, right: { code: string }) {
  return left.code.localeCompare(right.code);
}

function byQuestionId(
  left: { questionId: string },
  right: { questionId: string },
) {
  return left.questionId.localeCompare(right.questionId);
}
