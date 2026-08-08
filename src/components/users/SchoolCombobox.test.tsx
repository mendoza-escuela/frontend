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
  });

  it("busca opciones en el servidor y permite seleccionar un colegio", async () => {
    const onChange = vi.fn();
    render(
      <SchoolCombobox onChange={onChange} selectedSchool={null} />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Colegio asociado" }),
    );
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
});
