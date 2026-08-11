// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_UNAUTHORIZED_EVENT } from '../lib/api';
import { authService } from '../services/auth.service';
import type { AuthUser } from '../types/auth';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

vi.mock('../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}));

const authenticatedUser: AuthUser = {
  email: 'directora@example.com',
  firstName: 'Ana',
  id: 'user-1',
  lastLoginAt: null,
  lastName: 'Pérez',
  mustChangePassword: false,
  role: 'school',
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it.each([
    [401, 'none'],
    [503, '503'],
  ] as const)(
    'distingue un %i de /auth/me mediante el estado de autenticación %s',
    async (responseStatus, expectedAuthenticationStatus) => {
      vi.mocked(authService.me).mockRejectedValue(
        axiosReadError(responseStatus),
      );

      renderProvider();

      await waitForAuthenticationLoad();
      expect(screen.getByTestId('user')).toHaveTextContent('none');
      expect(screen.getByTestId('authentication-error')).toHaveTextContent(
        expectedAuthenticationStatus,
      );
      expect(screen.getByTestId('session-expired')).toHaveTextContent('false');
    },
  );

  it('marca la sesión como expirada cuando el evento 401 invalida un usuario existente', async () => {
    vi.mocked(authService.me).mockResolvedValue(authenticatedUser);

    renderProvider();
    await waitForAuthenticationLoad();
    expect(screen.getByTestId('user')).toHaveTextContent(
      authenticatedUser.email,
    );

    dispatchUnauthorizedEvent();

    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(screen.getByTestId('session-expired')).toHaveTextContent('true');
  });

  it('no marca una sesión expirada si el evento 401 ocurre sin usuario', async () => {
    vi.mocked(authService.me).mockRejectedValue(axiosReadError(401));

    renderProvider();
    await waitForAuthenticationLoad();

    dispatchUnauthorizedEvent();

    expect(screen.getByTestId('user')).toHaveTextContent('none');
    expect(screen.getByTestId('session-expired')).toHaveTextContent('false');
  });

  it('restablece el indicador de sesión expirada después de un login exitoso', async () => {
    vi.mocked(authService.me).mockResolvedValue(authenticatedUser);
    vi.mocked(authService.login).mockResolvedValue(authenticatedUser);

    renderProvider();
    await waitForAuthenticationLoad();
    dispatchUnauthorizedEvent();
    expect(screen.getByTestId('session-expired')).toHaveTextContent('true');

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar login' }));

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(
        authenticatedUser.email,
      );
      expect(screen.getByTestId('session-expired')).toHaveTextContent('false');
    });
  });

  it('limpia un error de disponibilidad después de un login exitoso', async () => {
    vi.mocked(authService.me).mockRejectedValue(axiosReadError(503));
    vi.mocked(authService.login).mockResolvedValue(authenticatedUser);

    renderProvider();
    await waitForAuthenticationLoad();
    expect(screen.getByTestId('authentication-error')).toHaveTextContent('503');

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar login' }));

    await waitFor(() => {
      expect(screen.getByTestId('authentication-error')).toHaveTextContent(
        'none',
      );
      expect(screen.getByTestId('user')).toHaveTextContent(
        authenticatedUser.email,
      );
    });
  });
});

function AuthStateProbe() {
  const {
    authenticationErrorStatus,
    isLoading,
    login,
    sessionExpired,
    user,
  } = useAuth();

  return (
    <>
      <output data-testid="loading">{String(isLoading)}</output>
      <output data-testid="user">{user?.email ?? 'none'}</output>
      <output data-testid="session-expired">{String(sessionExpired)}</output>
      <output data-testid="authentication-error">
        {authenticationErrorStatus ?? 'none'}
      </output>
      <button
        onClick={() => void login('directora@example.com', 'contraseña')}
        type="button"
      >
        Iniciar login
      </button>
    </>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <AuthStateProbe />
    </AuthProvider>,
  );
}

async function waitForAuthenticationLoad() {
  await waitFor(() => {
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });
}

function dispatchUnauthorizedEvent() {
  act(() => {
    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
  });
}

function axiosReadError(status: number) {
  return Object.assign(new Error(`HTTP ${status}`), {
    config: { method: 'get' },
    isAxiosError: true,
    response: {
      data: {},
      headers: {},
      status,
      statusText: 'Request failed',
    },
  });
}
