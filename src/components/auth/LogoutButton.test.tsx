// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LogoutButton } from "./LogoutButton";

const logout = vi.fn();

vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ logout }),
}));

describe("LogoutButton", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("solicita confirmación antes de cerrar la sesión", async () => {
    logout.mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <LogoutButton />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    const dialog = screen.getByRole("dialog", { name: "¿Cerrar sesión?" });
    expect(dialog).toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();

    fireEvent.click(
      within(dialog).getByRole("button", { name: "Cerrar sesión" }),
    );

    await waitFor(() => expect(logout).toHaveBeenCalledOnce());
  });

  it("permite cancelar sin cerrar la sesión", () => {
    render(
      <MemoryRouter>
        <LogoutButton />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(logout).not.toHaveBeenCalled();
  });
});
