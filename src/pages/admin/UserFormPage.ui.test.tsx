// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { UserFormPage } from "./UserFormPage";

vi.mock("../../components/users/SchoolCombobox", () => ({
  SchoolCombobox: () => <div data-testid="school-combobox" />,
}));

describe("UserFormPage", () => {
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
});
