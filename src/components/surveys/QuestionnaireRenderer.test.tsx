// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { PublishedSurvey } from "../../types/survey";
import { QuestionnaireRenderer } from "./QuestionnaireRenderer";

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
  afterEach(cleanup);

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
});
