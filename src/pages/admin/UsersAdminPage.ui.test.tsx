// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserListResponse } from "../../types/admin-user";
import { UsersAdminPage } from "./UsersAdminPage";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
}));

vi.mock("../../services/admin-users.service", () => ({
  adminUsersService: {
    list: mocks.list,
    resetPassword: vi.fn(),
    setStatus: vi.fn(),
  },
}));

vi.mock("../../components/users/SchoolCombobox", () => ({
  SchoolCombobox: () => <div data-testid="school-combobox" />,
}));

const users: UserListResponse = {
  items: [
    {
      id: "user-id",
      firstName: "Ana",
      lastName: "Pérez",
      email: "ana@mendoza.gov.ar",
      role: "admin",
      isActive: true,
      mustChangePassword: false,
      lastLoginAt: null,
      createdAt: "2026-07-29T00:00:00.000Z",
      updatedAt: "2026-07-29T00:00:00.000Z",
      school: null,
    },
  ],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

describe("UsersAdminPage", () => {
  beforeEach(() => {
    mocks.list.mockReset();
    mocks.list.mockResolvedValue(users);
  });

  it("permite mostrar y ocultar la contraseña del restablecimiento administrativo", async () => {
    render(
      <MemoryRouter>
        <UsersAdminPage />
      </MemoryRouter>,
    );

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Restablecer contraseña de ana@mendoza.gov.ar",
      }),
    );
    const password = document.querySelector<HTMLInputElement>(
      'input[autocomplete="new-password"]',
    );

    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(
      screen.getByRole("button", { name: "Mostrar contraseña" }),
    );
    expect(password).toHaveAttribute("type", "text");
    fireEvent.click(
      screen.getByRole("button", { name: "Ocultar contraseña" }),
    );
    expect(password).toHaveAttribute("type", "password");
  });
});
