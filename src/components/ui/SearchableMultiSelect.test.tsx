// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SearchableMultiSelect } from "./SearchableMultiSelect";

const options = [
  { value: "capital", label: "Capital" },
  { value: "godoy", label: "Godoy Cruz" },
  { value: "guaymallen", label: "Guaymallén" },
];

describe("SearchableMultiSelect", () => {
  afterEach(cleanup);

  it("permite buscar y mantener varias opciones seleccionadas", () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Departamento" }));
    expect(
      screen.getByRole("listbox", { name: "Departamento" }),
    ).toHaveAttribute("aria-multiselectable", "true");
    fireEvent.click(screen.getByRole("option", { name: "Capital" }));
    fireEvent.change(
      screen.getByRole("combobox", { name: "Buscar en Departamento" }),
      { target: { value: "GODOY" } },
    );
    fireEvent.click(screen.getByRole("option", { name: "Godoy Cruz" }));

    expect(screen.getByText("2 seleccionados")).toBeVisible();
    expect(screen.getByRole("option", { name: "Godoy Cruz" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("alterna con teclado, permite limpiar y devuelve el foco al cerrar", async () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Departamento" }));
    const search = screen.getByRole("combobox", {
      name: "Buscar en Departamento",
    });
    fireEvent.keyDown(search, { key: "Enter" });
    expect(screen.getByRole("option", { name: "Capital" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Limpiar selección" }));
    expect(screen.getByText("Todos")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Limpiar selección" }),
    ).not.toBeInTheDocument();

    fireEvent.keyDown(search, { key: "Escape" });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Departamento" }),
      ).toHaveFocus(),
    );
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Departamento" }));
    fireEvent.keyDown(
      screen.getByRole("combobox", { name: "Buscar en Departamento" }),
      { key: "Tab" },
    );
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("informa y respeta el máximo de selecciones", () => {
    const onMaxSelectionsReached = vi.fn();
    render(<LimitedHarness onMaxSelectionsReached={onMaxSelectionsReached} />);

    fireEvent.click(screen.getByRole("button", { name: "Departamento" }));
    fireEvent.click(screen.getByRole("option", { name: "Capital" }));
    expect(screen.getByText(/máximo 1/)).toBeVisible();
    expect(screen.getByRole("option", { name: "Godoy Cruz" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    fireEvent.click(screen.getByRole("option", { name: "Godoy Cruz" }));

    expect(onMaxSelectionsReached).toHaveBeenCalledOnce();
    expect(screen.getByRole("option", { name: "Capital" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.queryByText("2 seleccionados")).not.toBeInTheDocument();
  });

  it("muestra badges y resalta opciones con información previa", () => {
    render(
      <SearchableMultiSelect
        label="Preguntas"
        onChange={vi.fn()}
        options={[
          {
            value: "without-rules",
            label: "Pregunta sin reglas",
            badge: "0 reglas",
          },
          {
            value: "with-rules",
            label: "Pregunta con reglas",
            badge: "2 reglas",
            highlighted: true,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Preguntas" }));

    expect(
      screen.getByRole("option", {
        name: "Pregunta con reglas · 2 reglas",
      }),
    ).toHaveAttribute("data-highlighted", "true");
    expect(
      screen.getByRole("option", {
        name: "Pregunta sin reglas · 0 reglas",
      }),
    ).not.toHaveAttribute("data-highlighted");
  });
});

function Harness() {
  const [values, setValues] = useState<string[]>([]);
  return (
    <SearchableMultiSelect
      label="Departamento"
      onChange={setValues}
      options={options}
      values={values}
    />
  );
}

function LimitedHarness({
  onMaxSelectionsReached,
}: {
  onMaxSelectionsReached: () => void;
}) {
  const [values, setValues] = useState<string[]>([]);
  return (
    <SearchableMultiSelect
      label="Departamento"
      maxSelections={1}
      onChange={setValues}
      onMaxSelectionsReached={onMaxSelectionsReached}
      options={options}
      values={values}
    />
  );
}
