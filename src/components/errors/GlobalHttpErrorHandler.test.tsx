// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MemoryRouter,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import {
  APP_HTTP_ERROR_EVENT,
  type AppHttpErrorDetail,
} from '../../lib/api';
import { GlobalHttpErrorHandler } from './GlobalHttpErrorHandler';

function LocationProbe() {
  const location = useLocation();
  return (
    <output>
      {location.pathname}|{JSON.stringify(location.state)}
    </output>
  );
}

function renderHandler(initialEntry = '/admin/participacion?campana=uno') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<GlobalHttpErrorHandler />}>
          <Route element={<Outlet />} path="*" />
          <Route element={<LocationProbe />} path="error/:statusCode" />
        </Route>
      </Routes>
      <LocationProbe />
    </MemoryRouter>,
  );
}

function dispatchHttpError(detail: AppHttpErrorDetail) {
  window.dispatchEvent(
    new CustomEvent<AppHttpErrorDetail>(APP_HTTP_ERROR_EVENT, { detail }),
  );
}

describe('GlobalHttpErrorHandler', () => {
  afterEach(cleanup);

  it.each([403, 500, 503] as const)(
    'navega al estado global %s con el identificador seguro',
    async (statusCode) => {
      renderHandler();

      dispatchHttpError({ statusCode, correlationId: 'req-safe-01' });

      await waitFor(() =>
        expect(
          screen.getAllByText(new RegExp(`^/error/${statusCode}`))[0],
        ).toBeInTheDocument(),
      );
      expect(screen.getAllByText(new RegExp(`^/error/${statusCode}`))[0]).toHaveTextContent(
        '"correlationId":"req-safe-01"',
      );
    },
  );

  it('no vuelve a navegar cuando ya se encuentra en una página de error', async () => {
    renderHandler('/error/500');

    dispatchHttpError({ statusCode: 503, correlationId: null });

    await waitFor(() =>
      expect(screen.getAllByText(/^\/error\/500/)[0]).toBeInTheDocument(),
    );
    expect(screen.queryByText(/^\/error\/503/)).not.toBeInTheDocument();
  });
});
