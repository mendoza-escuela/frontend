// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SearchableSelect } from "./SearchableSelect";

describe("SearchableSelect", () => {
  afterEach(cleanup);
  it("filtra sin distinguir mayúsculas ni tildes y selecciona una opción", () => {
    const onChange = vi.fn();
    render(<SearchableSelect label="Departamento" onChange={onChange} options={[{ value: "capital", label: "Capital" }, { value: "godoy", label: "Godoy Cruz" }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Departamento" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Buscar en Departamento" }), { target: { value: "GODOY" } });
    expect(screen.queryByRole("option", { name: "Capital" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Godoy Cruz" }));
    expect(onChange).toHaveBeenCalledWith("godoy");
  });

  it("permite elegir con teclado y cerrar con Escape", () => {
    const onChange = vi.fn();
    render(<SearchableSelect label="Nivel" onChange={onChange} options={[{ value: "primario", label: "Primario" }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Nivel" }));
    const input = screen.getByRole("combobox", { name: "Buscar en Nivel" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("primario");
  });

  it("puede ocultar la opción vacía en selectores obligatorios", () => {
    render(
      <SearchableSelect
        allowEmpty={false}
        label="Dirección"
        onChange={vi.fn()}
        options={[
          { value: "asc", label: "Ascendente" },
          { value: "desc", label: "Descendente" },
        ]}
        value="asc"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Dirección" }));
    expect(screen.getAllByRole("option")).toHaveLength(2);
    expect(
      screen.queryByRole("option", { name: "Todos" }),
    ).not.toBeInTheDocument();
  });
});
