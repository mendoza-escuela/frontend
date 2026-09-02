// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "./FormField";

describe("FormField", () => {
  it("permite alinear el control al final de una fila con ayudas de distinta altura", () => {
    const { container } = render(
      <FormField alignControl help="Texto de ayuda" htmlFor="field" label="Campo">
        <input id="field" />
      </FormField>,
    );

    expect(container.firstElementChild).toHaveClass("flex", "h-full", "flex-col");
    expect(screen.getByRole("textbox").parentElement).toHaveClass("mt-auto", "pt-2");
  });

  it("puede contener el control y asociar ayuda, obligatoriedad y error", () => {
    const view = render(
      <FormField
        error="Campo inválido"
        help="Ayuda contextual"
        helpId="field-help"
        helpPlacement="below"
        label="Campo"
        required
      >
        <input aria-describedby="field-help" />
      </FormField>,
    );

    const input = view.container.querySelector("input");
    expect(input).not.toBeNull();
    if (!input) return;
    expect(input.closest("label")).toHaveTextContent("Campo *");
    expect(input).toHaveAttribute(
      "aria-describedby",
      "field-help",
    );
    expect(view.getByText("Ayuda contextual")).toHaveAttribute(
      "id",
      "field-help",
    );
    expect(view.getByRole("alert")).toHaveTextContent("Campo inválido");
  });
});
