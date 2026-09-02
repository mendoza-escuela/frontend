// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminSurveysService } from "../../services/admin-surveys.service";
import type { AdminSurveyVersion } from "../../types/admin-survey";
import { SurveyVersionEditorPage } from "./SurveyVersionEditorPage";

vi.mock("../../services/admin-surveys.service", () => ({
  adminSurveysService: {
    findVersion: vi.fn(),
    updateVersion: vi.fn(),
  },
}));

const genericVersion: AdminSurveyVersion = {
  id: "10000000-0000-4000-8000-000000000001",
  surveyId: "20000000-0000-4000-8000-000000000001",
  versionNumber: 1,
  title: "Versión libre",
  instructions: null,
  status: "draft",
  publishedAt: null,
  createdAt: "2026-08-01T12:00:00.000Z",
  updatedAt: "2026-08-01T12:00:00.000Z",
  profile: "generic",
  dimensions: [],
};

const incompatibleInstitutionalVersion: AdminSurveyVersion = {
  ...genericVersion,
  profile: "institutional",
  dimensions: [
    {
      id: "30000000-0000-4000-8000-000000000001",
      code: "participacion_protagonica",
      title: "Participación",
      description: null,
      order: 0,
      sections: [
        {
          id: "40000000-0000-4000-8000-000000000001",
          code: "seccion_1",
          title: "Sección 1",
          description: null,
          order: 0,
          questions: [
            {
              id: "50000000-0000-4000-8000-000000000001",
              code: "p001",
              type: "multiple_choice",
              prompt: "Pregunta histórica",
              helpText: null,
              required: true,
              order: 0,
              validation: { maxSelections: 2 },
              options: [
                {
                  id: "60000000-0000-4000-8000-000000000001",
                  value: "a",
                  label: "Opción A",
                  helpText: null,
                  score: 1,
                  order: 0,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

function renderEditor() {
  const router = createMemoryRouter(
    [
      {
        element: <SurveyVersionEditorPage />,
        path: "/admin/cuestionarios/:surveyId/versiones/:versionId/editar",
      },
      {
        element: <p>Detalle del cuestionario</p>,
        path: "/admin/cuestionarios/:surveyId",
      },
    ],
    {
      initialEntries: [
        "/admin/cuestionarios/20000000-0000-4000-8000-000000000001/versiones/10000000-0000-4000-8000-000000000001/editar",
      ],
    },
  );
  return { ...render(<RouterProvider router={router} />), router };
}

describe("SurveyVersionEditorPage profiles", () => {
  beforeEach(() => {
    vi.mocked(adminSurveysService.findVersion)
      .mockReset()
      .mockResolvedValue(genericVersion);
    vi.mocked(adminSurveysService.updateVersion).mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("aclara que una versión genérica publicable no llega al flujo escolar", async () => {
    renderEditor();

    expect(await screen.findByText("Versión genérica")).toBeVisible();
    expect(
      screen.getByText(/no estará disponible al crear etapas/),
    ).toBeVisible();
    expect(
      screen.getByText(
        /selección múltiple pertenecen únicamente a este editor/,
      ),
    ).toBeVisible();
  });

  it("conserva visible un tipo histórico incompatible hasta que se corrija", async () => {
    vi.mocked(adminSurveysService.findVersion).mockResolvedValueOnce(
      incompatibleInstitutionalVersion,
    );
    renderEditor();

    expect(await screen.findByText("Perfil institucional")).toBeVisible();
    const typeSelect = screen.getByRole("combobox", { name: /Tipo/ });
    expect(typeSelect).toHaveValue("multiple_choice");
    expect(
      screen.getByRole("option", {
        name: /Selección múltiple · no compatible con el perfil institucional/,
      }),
    ).toBeVisible();
    expect(
      screen
        .getByText(
          /Este tipo se conserva para que puedas corregir un borrador histórico/,
        )
        .closest('[role="alert"]'),
    ).toBeVisible();

    fireEvent.change(typeSelect, { target: { value: "single_choice" } });
    expect(typeSelect).toHaveValue("single_choice");
    expect(
      screen.queryByText(/Este tipo se conserva para que puedas corregir/),
    ).not.toBeInTheDocument();
  });

  it("envía la revisión y los UUID estables de toda la estructura", async () => {
    vi.mocked(adminSurveysService.findVersion).mockResolvedValueOnce(
      incompatibleInstitutionalVersion,
    );
    vi.mocked(adminSurveysService.updateVersion).mockResolvedValueOnce({
      ...incompatibleInstitutionalVersion,
      updatedAt: "2026-08-01T12:00:00.001Z",
    });
    renderEditor();

    fireEvent.change(await screen.findByLabelText("Texto de la pregunta"), {
      target: { value: "Pregunta actualizada" },
    });
    const saveButton = screen.getAllByRole("button", {
      name: "Guardar borrador",
    })[0];
    await waitFor(() => expect(saveButton).toBeEnabled());
    fireEvent.click(saveButton);

    await waitFor(() =>
      expect(adminSurveysService.updateVersion).toHaveBeenCalledWith(
        genericVersion.surveyId,
        genericVersion.id,
        expect.objectContaining({
          expectedUpdatedAt: incompatibleInstitutionalVersion.updatedAt,
          dimensions: [
            expect.objectContaining({
              id: "30000000-0000-4000-8000-000000000001",
              sections: [
                expect.objectContaining({
                  id: "40000000-0000-4000-8000-000000000001",
                  questions: [
                    expect.objectContaining({
                      id: "50000000-0000-4000-8000-000000000001",
                      prompt: "Pregunta actualizada",
                      options: [
                        expect.objectContaining({
                          id: "60000000-0000-4000-8000-000000000001",
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ),
    );
  });

  it("mantiene los cambios locales y explica un conflicto de edición", async () => {
    vi.mocked(adminSurveysService.updateVersion).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          code: "SURVEY_VERSION_EDIT_CONFLICT",
          message:
            "Otra persona modificó esta versión mientras la estabas editando.",
        },
      },
    });
    renderEditor();

    const title = await screen.findByLabelText("Título de la versión");
    fireEvent.change(title, { target: { value: "Mi edición local" } });
    fireEvent.click(
      screen.getAllByRole("button", { name: "Guardar borrador" })[0],
    );

    expect(
      await screen.findByText(
        "No se sobrescribieron los cambios de otra persona",
      ),
    ).toBeVisible();
    expect(title).toHaveValue("Mi edición local");
    expect(
      screen.getByRole("button", {
        name: "Descartar mis cambios y cargar la versión actual",
      }),
    ).toBeVisible();
  });

  it("bloquea la navegación mientras existen cambios sin guardar", async () => {
    renderEditor();

    fireEvent.change(await screen.findByLabelText("Título de la versión"), {
      target: { value: "Cambio pendiente" },
    });
    fireEvent.click(
      screen.getByRole("link", { name: "Volver al cuestionario" }),
    );

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("Hay cambios sin guardar");
    expect(
      screen.queryByText("Detalle del cuestionario"),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Salir sin guardar" }));
    expect(await screen.findByText("Detalle del cuestionario")).toBeVisible();
  });

  it("impide salir durante el PUT y continúa la navegación sólo al guardarse", async () => {
    let finishSave: (updated: AdminSurveyVersion) => void = () => undefined;
    vi.mocked(adminSurveysService.updateVersion).mockReturnValueOnce(
      new Promise<AdminSurveyVersion>((resolve) => {
        finishSave = resolve;
      }),
    );
    renderEditor();

    fireEvent.change(await screen.findByLabelText("Título de la versión"), {
      target: { value: "Cambio en guardado" },
    });
    fireEvent.click(
      screen.getAllByRole("button", { name: "Guardar borrador" })[0],
    );
    await waitFor(() =>
      expect(adminSurveysService.updateVersion).toHaveBeenCalledTimes(1),
    );
    fireEvent.click(
      screen.getByRole("link", { name: "Volver al cuestionario" }),
    );

    const leaveButton = await screen.findByRole("button", {
      name: "Salir sin guardar",
    });
    expect(leaveButton).toBeDisabled();
    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "El guardado está en curso",
    );
    expect(
      screen.queryByText("Detalle del cuestionario"),
    ).not.toBeInTheDocument();

    finishSave({
      ...genericVersion,
      title: "Cambio en guardado",
      updatedAt: "2026-08-01T12:00:00.001Z",
    });

    expect(await screen.findByText("Detalle del cuestionario")).toBeVisible();
  });

  it("inmoviliza el editor durante el PUT para no pisar cambios hechos en vuelo", async () => {
    let finishSave: (updated: AdminSurveyVersion) => void = () => undefined;
    vi.mocked(adminSurveysService.updateVersion).mockReturnValueOnce(
      new Promise<AdminSurveyVersion>((resolve) => {
        finishSave = resolve;
      }),
    );
    renderEditor();

    const title = await screen.findByLabelText("Título de la versión");
    fireEvent.change(title, { target: { value: "Cambio enviado" } });
    fireEvent.click(
      screen.getAllByRole("button", { name: "Guardar borrador" })[0],
    );
    await waitFor(() =>
      expect(adminSurveysService.updateVersion).toHaveBeenCalledTimes(1),
    );

    const addDimension = screen.getByRole("button", {
      name: "Agregar dimensión",
    });
    expect(title).toBeDisabled();
    expect(addDimension).toBeDisabled();
    expect(screen.getAllByRole("button", { name: "Guardando…" })).toHaveLength(
      2,
    );

    addDimension.click();
    expect(screen.queryByText("Dimensión 1")).not.toBeInTheDocument();
    expect(title).toHaveValue("Cambio enviado");

    finishSave({
      ...genericVersion,
      title: "Cambio enviado",
      updatedAt: "2026-08-01T12:00:00.001Z",
    });

    await waitFor(() => expect(title).toBeEnabled());
    expect(title).toHaveValue("Cambio enviado");
    expect(screen.queryByText("Dimensión 1")).not.toBeInTheDocument();
  });
});
