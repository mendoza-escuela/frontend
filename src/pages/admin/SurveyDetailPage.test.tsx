// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminSurveysService } from "../../services/admin-surveys.service";
import type { AdminSurveyDetail } from "../../types/admin-survey";
import { SurveyDetailPage } from "./SurveyDetailPage";

vi.mock("../../services/admin-surveys.service", () => ({
  adminSurveysService: {
    findOne: vi.fn(),
    validateVersion: vi.fn(),
    publishVersion: vi.fn(),
    archiveVersion: vi.fn(),
    removeVersion: vi.fn(),
    createVersion: vi.fn(),
  },
}));

const survey: AdminSurveyDetail = {
  id: "20000000-0000-4000-8000-000000000001",
  code: "encuesta",
  name: "Encuesta de prueba",
  description: null,
  isActive: true,
  createdAt: "2026-08-01T12:00:00.000Z",
  updatedAt: "2026-08-01T12:00:00.000Z",
  versions: [
    {
      id: "10000000-0000-4000-8000-000000000001",
      versionNumber: 1,
      title: "Borrador",
      status: "draft",
      publishedAt: null,
      createdAt: "2026-08-01T12:00:00.000Z",
      updatedAt: "2026-08-01T12:00:00.000Z",
      counts: { dimensions: 1, sections: 1, questions: 1, options: 2 },
    },
  ],
  audits: [],
};

function renderDetail() {
  return render(
    <MemoryRouter
      initialEntries={[
        "/admin/cuestionarios/20000000-0000-4000-8000-000000000001",
      ]}
    >
      <Routes>
        <Route
          element={<SurveyDetailPage />}
          path="/admin/cuestionarios/:id"
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SurveyDetailPage publication validation", () => {
  beforeEach(() => {
    vi.mocked(adminSurveysService.findOne).mockResolvedValue(survey);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("permite publicar una versión genérica con una advertencia de elegibilidad", async () => {
    vi.mocked(adminSurveysService.validateVersion).mockResolvedValue({
      valid: true,
      errors: [],
      profile: "generic",
      evaluable: false,
      evaluationErrors: [
        "La versión es genérica y no puede utilizarse en campañas institucionales evaluables.",
      ],
      counts: { dimensions: 1, sections: 1, questions: 1, options: 2 },
    });
    renderDetail();

    fireEvent.click(await screen.findByRole("button", { name: "Publicar" }));

    const dialog = await screen.findByRole("dialog", {
      name: "¿Publicar esta versión?",
    });
    expect(dialog).toHaveTextContent(
      "La estructura es publicable, pero no quedará disponible para etapas escolares",
    );
    expect(dialog).toHaveTextContent(
      "La versión es genérica y no puede utilizarse en campañas institucionales evaluables.",
    );
    expect(
      screen.getByRole("button", { name: "Publicar versión" }),
    ).toBeEnabled();
  });

  it("muestra juntos los errores que impiden publicar el perfil institucional", async () => {
    vi.mocked(adminSurveysService.validateVersion).mockResolvedValue({
      valid: false,
      errors: [
        "Faltan preguntas oficiales: p059, p060.",
        "Las preguntas oficiales deben ser de selección simple: p001.",
      ],
      profile: "institutional",
      evaluable: false,
      evaluationErrors: [
        "Faltan preguntas oficiales: p059, p060.",
        "Las preguntas oficiales deben ser de selección simple: p001.",
      ],
      counts: { dimensions: 6, sections: 6, questions: 58, options: 116 },
    });
    renderDetail();

    fireEvent.click(await screen.findByRole("button", { name: "Publicar" }));

    const dialog = await screen.findByRole("dialog", {
      name: "La versión todavía no puede publicarse",
    });
    expect(dialog).toHaveTextContent(
      "Faltan preguntas oficiales: p059, p060.",
    );
    expect(dialog).toHaveTextContent(
      "Las preguntas oficiales deben ser de selección simple: p001.",
    );
    expect(
      screen.queryByRole("button", { name: "Publicar versión" }),
    ).not.toBeInTheDocument();
  });
});
