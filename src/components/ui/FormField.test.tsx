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
});
