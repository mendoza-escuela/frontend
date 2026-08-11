// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserFormPage } from "./UserFormPage";
import { adminUsersService } from "../../services/admin-users.service";

vi.mock("../../components/users/SchoolCombobox", () => ({
  SchoolCombobox: () => <div data-testid="school-combobox" />,
}));
vi.mock("../../services/admin-users.service", () => ({
  adminUsersService: {
    create: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock("../../lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

describe("UserFormPage", () => {
  afterEach(cleanup);
  it("permite mostrar y volver a ocultar la contraseña temporal", () => {
    const { container } = render(
      <MemoryRouter>
        <UserFormPage />
      </MemoryRouter>,
    );
    const password = container.querySelector<HTMLInputElement>(
      'input[name="temporaryPassword"]',
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

  it("mantiene el formulario y enfoca correo cuando el usuario está duplicado", async () => {
    vi.mocked(adminUsersService.create).mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          code: "USER_EMAIL_CONFLICT",
          field: "email",
          message: "Ya existe un usuario con ese correo.",
        },
      },
    });
    const { container } = render(
      <MemoryRouter>
        <UserFormPage />
      </MemoryRouter>,
    );

    const firstName = screen.getByLabelText("Nombre");
    const email = screen.getByLabelText("Correo");
    fireEvent.change(firstName, { target: { value: "Ana" } });
    fireEvent.change(screen.getByLabelText("Apellido"), { target: { value: "Pérez" } });
    fireEvent.change(email, { target: { value: "ana@example.com" } });
    fireEvent.change(screen.getByLabelText("Rol"), { target: { value: "admin" } });
    const password = container.querySelector<HTMLInputElement>('input[name="temporaryPassword"]');
    expect(password).not.toBeNull();
    fireEvent.change(password!, { target: { value: "Temporal!2026Segura" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar usuario" }));

    expect(await screen.findByText("Ya existe un usuario con ese correo.")).toBeInTheDocument();
    await waitFor(() => expect(email).toHaveFocus());
    expect(email).toHaveValue("ana@example.com");
    expect(firstName).toHaveValue("Ana");
  });
});
