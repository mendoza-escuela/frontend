import { describe, expect, it } from "vitest";
import type { SchoolSubmissionWorkspace } from "../types/school-campaign";
import { schoolSurveyWorkspaceFingerprint } from "./school-survey-workspace";

describe("schoolSurveyWorkspaceFingerprint", () => {
  it("ignora metadatos de guardado pero detecta cambios de aplicabilidad", () => {
    const workspace = fixture();
    const sameContract = {
      ...workspace,
      submission: {
        ...workspace.submission,
        revision: 8,
        lastSavedAt: "2026-09-01T13:00:00.000Z",
      },
      answers: { question: "otra respuesta" },
      applicability: {
        ...workspace.applicability,
        evaluatedAt: "2026-09-01T13:00:00.000Z",
      },
    };
    expect(schoolSurveyWorkspaceFingerprint(sameContract)).toBe(
      schoolSurveyWorkspaceFingerprint(workspace),
    );

    const changed = {
      ...sameContract,
      applicability: {
        ...sameContract.applicability,
        status: "incomplete" as const,
        missingFields: [{ code: "has_kiosk", label: "Kiosco" }],
      },
    };
    expect(schoolSurveyWorkspaceFingerprint(changed)).not.toBe(
      schoolSurveyWorkspaceFingerprint(workspace),
    );

    const changedSurvey = {
      ...sameContract,
      survey: {
        ...sameContract.survey,
        version: {
          ...sameContract.survey.version,
          title: "Versión corregida",
        },
      },
    };
    expect(schoolSurveyWorkspaceFingerprint(changedSurvey)).not.toBe(
      schoolSurveyWorkspaceFingerprint(workspace),
    );
  });
});

function fixture() {
  return {
    survey: {
      code: "institucional",
      name: "Institucional",
      description: null,
      version: {
        id: "version",
        versionNumber: 1,
        title: "Versión",
        instructions: null,
        publishedAt: "2026-01-01T00:00:00.000Z",
        dimensions: [],
      },
    },
    applicability: {
      status: "ready",
      source: "evaluated",
      evaluatedAt: "2026-01-01T00:00:00.000Z",
      missingFields: [],
      excluded: [],
      incomplete: [],
    },
    submission: {
      revision: 7,
      lastSavedAt: null,
    },
    answers: {},
  } as unknown as SchoolSubmissionWorkspace;
}
