// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { adminUsersService } from "../../services/admin-users.service";
import { SchoolCombobox } from "./SchoolCombobox";

vi.mock("../../services/admin-users.service", () => ({
  adminUsersService: {
    schools: vi.fn(),
  },
}));

const school = {
  id: "school-id",
  cue: "2332",
  name: "Escuela Juan",
  isActive: true,
};

describe("SchoolCombobox", () => {
  beforeEach(() => {
    vi.mocked(adminUsersService.schools).mockResolvedValue({
      items: [school],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("busca opciones en el servidor y permite seleccionar un colegio", async () => {
    const onChange = vi.fn();
    render(<SchoolCombobox onChange={onChange} selectedSchool={null} />);

    fireEvent.click(screen.getByRole("button", { name: "Colegio asociado" }));
    fireEvent.change(
      screen.getByRole("combobox", {
        name: "Buscar colegio por CUE, número o nombre",
      }),
      { target: { value: "Juan" } },
    );

    await waitFor(() =>
      expect(adminUsersService.schools).toHaveBeenLastCalledWith(
        { search: "Juan", page: 1, limit: 20 },
        expect.any(AbortSignal),
      ),
    );
    fireEvent.click(
      await screen.findByRole("option", { name: "2332 - Escuela Juan" }),
    );

    expect(onChange).toHaveBeenCalledWith(school);
  });

  it("mantiene deshabilitado el selector cuando el rol no usa colegio", () => {
    render(
      <SchoolCombobox disabled onChange={vi.fn()} selectedSchool={null} />,
    );

    expect(
      screen.getByRole("button", { name: "Colegio asociado" }),
    ).toBeDisabled();
  });

  it("permite seleccionar Sin asignar cuando se habilita la opción", async () => {
    const onChange = vi.fn();
    render(
      <SchoolCombobox
        allowClear
        clearLabel="Sin asignar"
        onChange={onChange}
        selectedSchool={school}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Colegio asociado" }));
    fireEvent.click(await screen.findByRole("option", { name: "Sin asignar" }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("abre hacia arriba cuando no hay espacio debajo", async () => {
    render(<SchoolCombobox onChange={vi.fn()} selectedSchool={null} />);
    const trigger = screen.getByRole("button", { name: "Colegio asociado" });
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(600);
    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
      bottom: 580,
      height: 48,
      left: 0,
      right: 400,
      top: 532,
      width: 400,
      x: 0,
      y: 532,
      toJSON: () => ({}),
    });

    fireEvent.click(trigger);

    const listbox = await screen.findByRole("listbox");
    expect(listbox.parentElement).toHaveAttribute("data-placement", "top");
  });
});
