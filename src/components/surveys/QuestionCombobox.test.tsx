// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  QuestionCombobox,
  type QuestionComboboxOption,
} from "./QuestionCombobox";

const options: QuestionComboboxOption[] = [
  {
    value: "question-1",
    code: "p001",
    prompt:
      "Acta compromiso: Existe un acta compromiso institucional firmada y vigente.",
    groupLabel: "Institucional · Compromiso",
    ruleCount: 2,
  },
  {
    value: "question-2",
    code: "p002",
    prompt:
      "Referente institucional: La escuela cuenta con una persona designada.",
    groupLabel: "Institucional · Compromiso",
    ruleCount: 0,
  },
  {
    value: "question-3",
    code: "p003",
    prompt:
      "Plan de alimentación saludable integrado a la propuesta curricular.",
    groupLabel: "Hábitos saludables · Alimentación",
    ruleCount: 1,
  },
];

describe("QuestionCombobox", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("muestra una selección compacta y opciones agrupadas sin desbordar el enunciado", () => {
    render(
      <QuestionCombobox
        label="Pregunta"
        onChange={vi.fn()}
        options={options}
        value="question-1"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Pregunta" });
    expect(trigger).toHaveTextContent("p001");
    expect(trigger).toHaveTextContent("Acta compromiso");
    expect(trigger).not.toHaveTextContent("Existe un acta");

    fireEvent.click(trigger);

    expect(
      screen.getByRole("group", { name: "Institucional · Compromiso" }),
    ).toBeVisible();
    expect(
      screen.getByRole("group", {
        name: "Hábitos saludables · Alimentación",
      }),
    ).toBeVisible();
    expect(screen.getByText("2 reglas")).toBeVisible();
    expect(screen.getByText("0 reglas")).toBeVisible();
    expect(screen.getByText("1 regla")).toBeVisible();
    expect(screen.getByText(options[0].prompt)).toHaveClass(
      "line-clamp-2",
      "whitespace-normal",
      "break-words",
    );
    expect(screen.getByRole("option", { name: /p001.*Acta compromiso/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("busca por código, enunciado o grupo sin distinguir mayúsculas ni tildes", () => {
    const onChange = vi.fn();
    render(
      <QuestionCombobox
        label="Pregunta"
        onChange={onChange}
        options={options}
        value="question-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Pregunta" }));
    const search = screen.getByRole("combobox", { name: "Buscar en Pregunta" });

    fireEvent.change(search, { target: { value: "HABITOS" } });
    expect(screen.getByRole("option", { name: /p003/ })).toBeVisible();
    expect(screen.queryByRole("option", { name: /p001/ })).not.toBeInTheDocument();

    fireEvent.change(search, { target: { value: "P002" } });
    expect(screen.getByRole("option", { name: /p002/ })).toBeVisible();

    fireEvent.change(search, { target: { value: "alimentación saludable" } });
    fireEvent.click(screen.getByRole("option", { name: /p003/ }));

    expect(onChange).toHaveBeenCalledWith("question-3");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pregunta" })).toHaveFocus();
  });

  it("permite recorrer, elegir y cerrar con el teclado", () => {
    const onChange = vi.fn();
    render(
      <QuestionCombobox
        label="Pregunta"
        onChange={onChange}
        options={options}
        value="question-2"
      />,
    );

    const trigger = screen.getByRole("button", { name: "Pregunta" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    const search = screen.getByRole("combobox", { name: "Buscar en Pregunta" });
    expect(search).toHaveFocus();
    expect(search).toHaveAttribute(
      "aria-activedescendant",
      expect.stringMatching(/option-1$/),
    );

    fireEvent.keyDown(search, { key: "ArrowDown" });
    fireEvent.keyDown(search, { key: "ArrowUp" });
    fireEvent.keyDown(search, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("question-2");
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    fireEvent.keyDown(
      screen.getByRole("combobox", { name: "Buscar en Pregunta" }),
      { key: "Escape" },
    );
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("cierra al hacer clic afuera y respeta el estado deshabilitado", () => {
    const { rerender } = render(
      <QuestionCombobox
        label="Pregunta"
        onChange={vi.fn()}
        options={options}
        value=""
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Pregunta" }));
    expect(screen.getByRole("listbox")).toBeVisible();
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    rerender(
      <QuestionCombobox
        disabled
        label="Pregunta"
        onChange={vi.fn()}
        options={options}
        value=""
      />,
    );
    expect(screen.getByRole("button", { name: "Pregunta" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Pregunta" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("abre el panel hacia arriba cuando no entra debajo del control", () => {
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Pregunta" });
    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
      bottom: 750,
      height: 48,
      left: 16,
      right: 784,
      top: 702,
      width: 768,
      x: 16,
      y: 702,
      toJSON: () => ({}),
    });
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(800);

    fireEvent.click(trigger);

    const panel = screen.getByRole("listbox").parentElement;
    expect(panel).toHaveClass("bottom-full", "max-w-[calc(100vw-2rem)]");
    expect(panel).toHaveStyle({ maxHeight: "448px" });
  });
});

function Harness() {
  const [value, setValue] = useState("question-1");
  return (
    <QuestionCombobox
      label="Pregunta"
      onChange={setValue}
      options={options}
      value={value}
    />
  );
}
