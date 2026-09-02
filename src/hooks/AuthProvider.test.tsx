// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import type { InternalAxiosRequestConfig } from 'axios';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, AUTH_UNAUTHORIZED_EVENT } from '../lib/api';
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

  it('ignora un /auth/me anterior que termina después del login', async () => {
    let rejectInitialRefresh!: (error: unknown) => void;
    vi.mocked(authService.me).mockReturnValue(
      new Promise((_, reject) => {
        rejectInitialRefresh = reject;
      }),
    );
    vi.mocked(authService.login).mockResolvedValue(authenticatedUser);

    renderProvider();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar login' }));

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(
        authenticatedUser.email,
      );
    });

    rejectInitialRefresh(axiosReadError(401));

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(
        authenticatedUser.email,
      );
      expect(screen.getByTestId('session-expired')).toHaveTextContent('false');
    });
  });

  it('ignora un 401 privado iniciado antes de un login exitoso', async () => {
    let rejectOldRequest!: () => void;
    vi.mocked(authService.me).mockRejectedValue(axiosReadError(401));
    vi.mocked(authService.login).mockResolvedValue(authenticatedUser);

    renderProvider();
    await waitForAuthenticationLoad();
    const oldRequest = api
      .get('/schools/me', {
        adapter: (config) =>
          new Promise((_resolve, reject) => {
            rejectOldRequest = () => reject(axiosReadError(401, config));
          }),
      })
      .catch((error: unknown) => error);
    await waitFor(() => expect(rejectOldRequest).toBeTypeOf('function'));

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar login' }));
    await waitFor(() =>
      expect(screen.getByTestId('user')).toHaveTextContent(
        authenticatedUser.email,
      ),
    );

    rejectOldRequest();
    await oldRequest;

    expect(screen.getByTestId('user')).toHaveTextContent(
      authenticatedUser.email,
    );
    expect(screen.getByTestId('session-expired')).toHaveTextContent('false');
  });

  it('deja que un login pendiente prevalezca sobre un 401 iniciado durante esa operación', async () => {
    let resolveLogin!: (user: AuthUser) => void;
    let rejectPrivateRequest!: () => void;
    vi.mocked(authService.me).mockRejectedValue(axiosReadError(401));
    vi.mocked(authService.login).mockReturnValue(
      new Promise<AuthUser>((resolve) => {
        resolveLogin = resolve;
      }),
    );

    renderProvider();
    await waitForAuthenticationLoad();
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar login' }));
    await waitFor(() => expect(authService.login).toHaveBeenCalledTimes(1));
    const privateRequest = api
      .get('/schools/me', {
        adapter: (config) =>
          new Promise((_resolve, reject) => {
            rejectPrivateRequest = () =>
              reject(axiosReadError(401, config));
          }),
      })
      .catch((error: unknown) => error);
    await waitFor(() => expect(rejectPrivateRequest).toBeTypeOf('function'));

    rejectPrivateRequest();
    await privateRequest;
    resolveLogin(authenticatedUser);

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(
        authenticatedUser.email,
      );
      expect(screen.getByTestId('session-expired')).toHaveTextContent('false');
    });
  });

  it('serializa logout seguido de login y conserva la operación posterior', async () => {
    let resolveLogout!: () => void;
    vi.mocked(authService.me).mockResolvedValue(authenticatedUser);
    vi.mocked(authService.logout).mockReturnValue(
      new Promise<void>((resolve) => {
        resolveLogout = resolve;
      }),
    );
    vi.mocked(authService.login).mockResolvedValue(authenticatedUser);

    renderProvider();
    await waitForAuthenticationLoad();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar login' }));

    expect(authService.login).not.toHaveBeenCalled();
    resolveLogout();

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledTimes(1);
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
    logout,
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
      <button onClick={() => void logout()} type="button">
        Cerrar sesión
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

function axiosReadError(
  status: number,
  config: InternalAxiosRequestConfig | { method: string } = { method: 'get' },
) {
  return Object.assign(new Error(`HTTP ${status}`), {
    config,
    isAxiosError: true,
    response: {
      data: {},
      headers: {},
      status,
      statusText: 'Request failed',
    },
  });
}
