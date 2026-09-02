// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DraftAuthoritativeStateChangedError } from "../../lib/latest-draft-save-queue";
import type { PublishedSurvey } from "../../types/survey";
import {
  QuestionnaireRenderer,
  type QuestionnaireRendererHandle,
} from "./QuestionnaireRenderer";

const survey: PublishedSurvey = {
  code: "diagnostico",
  name: "Diagnóstico institucional",
  description: null,
  version: {
    id: "version-1",
    versionNumber: 1,
    title: "Primera versión",
    instructions: null,
    publishedAt: "2026-07-22T00:00:00.000Z",
    dimensions: [
      {
        id: "dimension-1",
        code: "entorno",
        title: "Entorno saludable",
        description: null,
        order: 0,
        sections: [
          {
            id: "section-1",
            code: "general",
            title: "Datos generales",
            description: null,
            order: 0,
            questions: [
              {
                id: "question-1",
                code: "Q1",
                type: "short_text",
                prompt: "Nombre del proyecto",
                helpText: null,
                required: true,
                order: 0,
                validation: {},
                options: [],
              },
            ],
          },
          {
            id: "section-2",
            code: "acciones",
            title: "Acciones",
            description: null,
            order: 1,
            questions: [
              {
                id: "question-2",
                code: "Q2",
                type: "boolean",
                prompt: "¿Realiza acciones de promoción?",
                helpText: null,
                required: false,
                order: 0,
                validation: {},
                options: [],
              },
            ],
          },
        ],
      },
    ],
  },
};

describe("QuestionnaireRenderer", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("lleva la vista al inicio de las preguntas al cambiar de secciÃ³n", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: false } as MediaQueryList),
    );
    render(
      <QuestionnaireRenderer survey={survey} validateOnSectionChange={false} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    const questions = await screen.findByRole("group", {
      name: "Preguntas de Acciones",
    });
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
    expect(questions).toHaveFocus();
  });

  it("valida preguntas obligatorias antes de avanzar", async () => {
    render(<QuestionnaireRenderer survey={survey} />);

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(
      await screen.findByText("Esta pregunta es obligatoria."),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Datos generales" }),
    ).toBeVisible();

    fireEvent.change(screen.getByLabelText(/Nombre del proyecto/), {
      target: { value: "Proyecto saludable" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(
      await screen.findByRole("heading", { name: "Acciones" }),
    ).toBeVisible();
  });

  it("permite recorrer una versión publicada en modo sólo lectura", async () => {
    render(<QuestionnaireRenderer readOnly survey={survey} />);

    expect(screen.getByLabelText(/Nombre del proyecto/)).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(
      await screen.findByText("Fin de la vista del cuestionario"),
    ).toBeVisible();
    expect(screen.getByRole("radio", { name: "Sí" })).toBeDisabled();
  });

  it("permite avanzar incompleto y guardar un borrador cuando se configura el flujo escolar", async () => {
    const saveDraft = vi
      .fn()
      .mockResolvedValue({ revision: 1, lastSavedAt: null });
    render(
      <QuestionnaireRenderer
        defaultValues={{ "question-1": "Respuesta recuperada" }}
        onSaveDraft={saveDraft}
        survey={survey}
        validateOnSectionChange={false}
      />,
    );

    expect(screen.getByLabelText(/Nombre del proyecto/)).toHaveValue(
      "Respuesta recuperada",
    );
    fireEvent.change(screen.getByLabelText(/Nombre del proyecto/), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(
      await screen.findByRole("heading", { name: "Acciones" }),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    await waitFor(() =>
      expect(saveDraft).toHaveBeenCalledWith(
        expect.objectContaining({ "question-1": "" }),
        0,
      ),
    );
  });

  it("deshabilita preguntas y acciones mientras un proceso externo bloquea el formulario", async () => {
    const saveDraft = vi
      .fn()
      .mockResolvedValue({ revision: 1, lastSavedAt: null });
    const submit = vi.fn();
    const view = render(
      <QuestionnaireRenderer
        onSaveDraft={saveDraft}
        onSubmit={submit}
        survey={survey}
        validateOnSectionChange={false}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(await screen.findByRole("radio", { name: "Sí" })).toBeEnabled();

    view.rerender(
      <QuestionnaireRenderer
        disabled
        onSaveDraft={saveDraft}
        onSubmit={submit}
        survey={survey}
        validateOnSectionChange={false}
      />,
    );

    expect(view.container.querySelector("form")).toHaveAttribute(
      "aria-busy",
      "true",
    );
    expect(screen.getByRole("radio", { name: "Sí" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Guardar borrador" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Finalizar" })).toBeDisabled();
    const beforeUnload = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(beforeUnload);
    expect(beforeUnload.defaultPrevented).toBe(true);
  });

  it("deshabilita también el envío de un cuestionario sin preguntas", () => {
    const emptySurvey: PublishedSurvey = {
      ...survey,
      version: {
        ...survey.version,
        dimensions: [],
      },
    };
    render(
      <QuestionnaireRenderer
        disabled
        onSubmit={vi.fn()}
        survey={emptySurvey}
      />,
    );

    expect(screen.getByRole("button", { name: "Finalizar" })).toBeDisabled();
  });

  it("permite dejar vacía una pregunta opcional con minLength", async () => {
    const optionalSurvey: PublishedSurvey = {
      ...survey,
      version: {
        ...survey.version,
        dimensions: [
          {
            ...survey.version.dimensions[0],
            sections: [
              {
                ...survey.version.dimensions[0].sections[0],
                questions: [
                  {
                    ...survey.version.dimensions[0].sections[0].questions[0],
                    required: false,
                    validation: { minLength: 5 },
                  },
                ],
              },
              survey.version.dimensions[0].sections[1],
            ],
          },
        ],
      },
    };

    render(<QuestionnaireRenderer survey={optionalSurvey} />);
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(
      await screen.findByRole("heading", { name: "Acciones" }),
    ).toBeVisible();
    expect(
      screen.queryByText("Ingresá al menos 5 caracteres."),
    ).not.toBeInTheDocument();
  });

  it("mantiene minLength para una respuesta opcional no vacía", async () => {
    const optionalSurvey: PublishedSurvey = {
      ...survey,
      version: {
        ...survey.version,
        dimensions: [
          {
            ...survey.version.dimensions[0],
            sections: [
              {
                ...survey.version.dimensions[0].sections[0],
                questions: [
                  {
                    ...survey.version.dimensions[0].sections[0].questions[0],
                    required: false,
                    validation: { minLength: 5 },
                  },
                ],
              },
              survey.version.dimensions[0].sections[1],
            ],
          },
        ],
      },
    };
    render(<QuestionnaireRenderer survey={optionalSurvey} />);
    fireEvent.change(screen.getByLabelText(/Nombre del proyecto/), {
      target: { value: "abc" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(
      await screen.findByText("Ingresá al menos 5 caracteres."),
    ).toBeVisible();
  });

  it("espera el flush del borrador antes de ejecutar el envío", async () => {
    let resolveSave!: (value: {
      revision: number;
      lastSavedAt: string | null;
    }) => void;
    const saveDraft = vi.fn(
      () =>
        new Promise<{ revision: number; lastSavedAt: string | null }>(
          (resolve) => {
            resolveSave = resolve;
          },
        ),
    );
    const submit = vi.fn();
    const oneSectionSurvey: PublishedSurvey = {
      ...survey,
      version: {
        ...survey.version,
        dimensions: [
          {
            ...survey.version.dimensions[0],
            sections: [survey.version.dimensions[0].sections[0]],
          },
        ],
      },
    };
    render(
      <QuestionnaireRenderer
        draftRevision={4}
        onSaveDraft={saveDraft}
        onSubmit={submit}
        survey={oneSectionSurvey}
      />,
    );
    fireEvent.change(screen.getByLabelText(/Nombre del proyecto/), {
      target: { value: "Proyecto vigente" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Finalizar" }));

    await waitFor(() =>
      expect(saveDraft).toHaveBeenCalledWith(
        { "question-1": "Proyecto vigente" },
        4,
      ),
    );
    expect(submit).not.toHaveBeenCalled();

    resolveSave({ revision: 5, lastSavedAt: "2026-08-10T15:30:00.000Z" });
    await waitFor(() =>
      expect(submit).toHaveBeenCalledWith(
        { "question-1": "Proyecto vigente" },
        5,
      ),
    );
  });

  it("incluye una edición hecha durante el flush sin dejar un autoguardado tardío", async () => {
    vi.useFakeTimers();
    let resolveFirst!: (value: {
      revision: number;
      lastSavedAt: string | null;
    }) => void;
    let resolveSecond!: (value: {
      revision: number;
      lastSavedAt: string | null;
    }) => void;
    const saveDraft = vi
      .fn()
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSecond = resolve;
        }),
      );
    const rendererRef = createRef<QuestionnaireRendererHandle>();
    render(
      <QuestionnaireRenderer
        onSaveDraft={saveDraft}
        ref={rendererRef}
        survey={survey}
      />,
    );
    const input = screen.getByLabelText(/Nombre del proyecto/);
    fireEvent.change(input, { target: { value: "Primera" } });
    const flushing = rendererRef.current!.flushDraft();
    await act(async () => {
      await Promise.resolve();
    });
    expect(saveDraft).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ "question-1": "Primera" }),
      0,
    );

    fireEvent.change(input, { target: { value: "Segunda" } });
    await act(async () => {
      resolveFirst({ revision: 1, lastSavedAt: null });
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(saveDraft).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ "question-1": "Segunda" }),
      1,
    );

    await act(async () => {
      resolveSecond({ revision: 2, lastSavedAt: null });
      await flushing;
    });
    await vi.advanceTimersByTimeAsync(1_300);
    expect(saveDraft).toHaveBeenCalledTimes(2);
  });

  it("conserva una edición posterior si el guardado detecta un contrato autoritativo nuevo", async () => {
    vi.useFakeTimers();
    let resolveFirst!: (value: {
      revision: number;
      lastSavedAt: string | null;
      authoritativeChanged: boolean;
    }) => void;
    const saveDraft = vi
      .fn()
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
      )
      .mockResolvedValueOnce({ revision: 2, lastSavedAt: null });
    const rendererRef = createRef<QuestionnaireRendererHandle>();
    const view = render(
      <QuestionnaireRenderer
        onSaveDraft={saveDraft}
        ref={rendererRef}
        survey={survey}
      />,
    );
    const input = screen.getByLabelText(/Nombre del proyecto/);
    fireEvent.change(input, { target: { value: "Primera" } });
    const flushing = rendererRef.current!.flushDraft();
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.change(input, { target: { value: "Edición más nueva" } });

    await act(async () => {
      resolveFirst({
        revision: 1,
        lastSavedAt: null,
        authoritativeChanged: true,
      });
      await expect(flushing).rejects.toBeInstanceOf(
        DraftAuthoritativeStateChangedError,
      );
    });
    expect(input).toHaveValue("Edición más nueva");
    expect(screen.getByText(/El cuestionario se actualizó/)).toBeVisible();

    const changedSurvey: PublishedSurvey = {
      ...survey,
      version: {
        ...survey.version,
        title: "Contrato actualizado",
        dimensions: [
          {
            ...survey.version.dimensions[0],
            sections: [
              {
                ...survey.version.dimensions[0].sections[0],
                questions: [
                  {
                    ...survey.version.dimensions[0].sections[0].questions[0],
                    prompt: "Nombre actualizado del proyecto",
                  },
                ],
              },
              survey.version.dimensions[0].sections[1],
            ],
          },
        ],
      },
    };
    view.rerender(
      <QuestionnaireRenderer
        onSaveDraft={saveDraft}
        ref={rendererRef}
        survey={changedSurvey}
      />,
    );
    const refreshedInput = screen.getByLabelText(/Nombre actualizado/);
    expect(refreshedInput).toBe(input);
    expect(refreshedInput).toHaveValue("Edición más nueva");

    fireEvent.click(screen.getByRole("button", { name: "Guardar borrador" }));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(saveDraft).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ "question-1": "Edición más nueva" }),
      1,
    );
    await vi.advanceTimersByTimeAsync(1_300);
    expect(saveDraft).toHaveBeenCalledTimes(2);
  });

  it("despacha el último cambio pendiente al desmontarse", async () => {
    const saveDraft = vi
      .fn()
      .mockResolvedValue({ revision: 1, lastSavedAt: null });
    const { unmount } = render(
      <QuestionnaireRenderer onSaveDraft={saveDraft} survey={survey} />,
    );
    fireEvent.change(screen.getByLabelText(/Nombre del proyecto/), {
      target: { value: "Cambio antes de navegar" },
    });

    unmount();

    await waitFor(() =>
      expect(saveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          "question-1": "Cambio antes de navegar",
        }),
        0,
      ),
    );
  });

  it("muestra puntajes únicamente cuando la vista administrativa lo solicita", () => {
    const scoredSurvey: PublishedSurvey = {
      ...survey,
      version: {
        ...survey.version,
        dimensions: [
          {
            ...survey.version.dimensions[0],
            sections: [
              {
                ...survey.version.dimensions[0].sections[0],
                questions: [
                  {
                    id: "question-score",
                    code: "p001",
                    type: "single_choice",
                    prompt: "¿Cuenta con compromiso?",
                    helpText: null,
                    required: true,
                    order: 0,
                    validation: {},
                    options: [
                      {
                        id: "option-score",
                        value: "si",
                        label: "Sí",
                        helpText: null,
                        score: 100,
                        order: 0,
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    };

    const { rerender } = render(
      <QuestionnaireRenderer readOnly survey={scoredSurvey} />,
    );
    expect(screen.queryByText("100 puntos")).not.toBeInTheDocument();

    rerender(
      <QuestionnaireRenderer readOnly showScores survey={scoredSurvey} />,
    );
    expect(screen.getByText("100 puntos")).toBeVisible();
  });

  it("bloquea el envío cuando backend informa aplicabilidad incompleta", async () => {
    const submit = vi.fn();
    render(
      <QuestionnaireRenderer
        onSubmit={submit}
        submitDisabled
        submitDisabledReason="Completá la ficha escolar antes de enviar."
        survey={survey}
        validateOnSectionChange={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

    const submitButton = await screen.findByRole("button", {
      name: "Finalizar",
    });
    expect(submitButton).toBeDisabled();
    expect(
      screen.getByText("Completá la ficha escolar antes de enviar."),
    ).toBeVisible();
    fireEvent.click(submitButton);
    expect(submit).not.toHaveBeenCalled();
  });
});
