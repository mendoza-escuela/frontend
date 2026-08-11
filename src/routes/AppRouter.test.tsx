// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { AuthContext, type AuthContextValue } from '../hooks/auth-context';
import { appRoutes } from './AppRouter';

const anonymousAuth: AuthContextValue = {
  authenticationErrorStatus: null,
  isLoading: false,
  login: async () => {
    throw new Error('No utilizado en esta prueba.');
  },
  logout: async () => undefined,
  refreshUser: async () => undefined,
  sessionExpired: false,
  user: null,
};

function renderRoute(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  const view = render(
    <AuthContext.Provider value={anonymousAuth}>
      <RouterProvider router={router} />
    </AuthContext.Provider>,
  );
  return { router, view };
}

describe('AppRouter error routes', () => {
  afterEach(cleanup);

  it('muestra 404 para cualquier ruta inexistente conservando la URL', async () => {
    const { router } = renderRoute('/ruta-que-no-existe');

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'No encontramos esta página',
      }),
    ).toBeVisible();
    expect(router.state.location.pathname).toBe('/ruta-que-no-existe');
  });

  it('mantiene el alias histórico de acceso denegado usando la página 403', async () => {
    renderRoute('/acceso-denegado');

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'No tenés permisos para acceder',
      }),
    ).toBeVisible();
    expect(screen.getByText('Error 403')).toBeVisible();
  });
});
