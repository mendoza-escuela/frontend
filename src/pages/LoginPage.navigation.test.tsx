// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../hooks/useAuth';
import type { AuthUser } from '../types/auth';
import { LoginPage } from './LoginPage';

vi.mock('../hooks/useAuth', () => ({ useAuth: vi.fn() }));
vi.mock('../lib/toast', () => ({ showError: vi.fn() }));

const adminUser: AuthUser = {
  email: 'admin@example.com',
  firstName: 'Admin',
  id: 'admin-1',
  lastLoginAt: null,
  lastName: 'Prueba',
  mustChangePassword: false,
  role: 'admin',
};

const schoolUser: AuthUser = {
  ...adminUser,
  email: 'colegio@example.com',
  id: 'school-1',
  role: 'school',
};

function Destination() {
  const location = useLocation();
  return <output>{`${location.pathname}${location.search}`}</output>;
}

function renderLogin(initialEntry: string, authenticatedUser = adminUser) {
  const login = vi.fn().mockResolvedValue(authenticatedUser);
  vi.mocked(useAuth).mockReturnValue({
    authenticationErrorStatus: null,
    isLoading: false,
    login,
    logout: async () => undefined,
    refreshUser: async () => undefined,
    sessionExpired: false,
    user: null,
  });
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<LoginPage />} path="/login" />
        <Route element={<Destination />} path="*" />
      </Routes>
    </MemoryRouter>,
  );
  return login;
}

async function submitLogin() {
  fireEvent.change(screen.getByLabelText('Correo institucional'), {
    target: { value: 'admin@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Contraseña'), {
    target: { value: 'una-clave' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
}

describe('LoginPage return navigation', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('retoma una ruta interna luego de iniciar sesión nuevamente', async () => {
    renderLogin('/login?returnTo=%2Fadmin%2Fusuarios%3Fpagina%3D2');

    await submitLogin();

    expect(
      await screen.findByText('/admin/usuarios?pagina=2'),
    ).toBeVisible();
  });

  it('descarta un retorno externo y usa el panel del rol', async () => {
    renderLogin('/login?returnTo=%2F%2Fmalicioso.example');

    await submitLogin();

    expect(await screen.findByText('/admin')).toBeVisible();
  });

  it('descarta una ruta de administrador para un usuario de colegio', async () => {
    renderLogin('/login?returnTo=%2Fadmin%2Fusuarios', schoolUser);

    await submitLogin();

    expect(await screen.findByText('/colegio')).toBeVisible();
  });

  it('descarta una ruta de colegio para un administrador', async () => {
    renderLogin('/login?returnTo=%2Fcolegio%2Fresultados');

    await submitLogin();

    expect(await screen.findByText('/admin')).toBeVisible();
  });
});
