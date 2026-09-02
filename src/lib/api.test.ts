// @vitest-environment jsdom

import type { InternalAxiosRequestConfig } from 'axios';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

let apiModule: typeof import('./api');

beforeAll(async () => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:4000/api');
  apiModule = await import('./api');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe('api', () => {
  it.each([
    ['/api', '/api'],
    ['/api/', '/api'],
    ['http://localhost:4000/api', 'http://localhost:4000/api'],
    [
      'https://api.example.org/programa/api/',
      'https://api.example.org/programa/api',
    ],
  ])('normaliza una URL de API válida: %s', (value, expected) => {
    expect(apiModule.normalizeApiBaseUrl(value)).toBe(expected);
  });

  it.each([
    undefined,
    '',
    '/',
    '/programa/api',
    'localhost:4000/api',
    'ftp://api.example.org/api',
    'https://api.example.org',
    'https://user:password@api.example.org/api',
    'https://api.example.org/api?token=publico',
  ])('rechaza una URL de API fuera del contrato: %s', (value) => {
    expect(() => apiModule.normalizeApiBaseUrl(value)).toThrow(
      /VITE_API_URL/,
    );
  });

  it('conserva FormData para que el navegador envíe archivos multipart', async () => {
    const body = new FormData();
    body.append('file', 'contenido-de-prueba');
    let request: InternalAxiosRequestConfig | undefined;

    await apiModule.api.post('/test', body, {
      adapter: async (config) => {
        request = config;
        return {
          config,
          data: {},
          headers: {},
          status: 200,
          statusText: 'OK',
        };
      },
    });

    expect(request?.data).toBe(body);
    expect(request?.headers.get('Content-Type')).not.toBe('application/json');
    expect(request?.headers.get('X-CSRF-Protection')).toBe('1');
  });

  it('mantiene application/json para los objetos comunes', async () => {
    const body = { name: 'Cuestionario' };
    let request: InternalAxiosRequestConfig | undefined;

    await apiModule.api.post('/test', body, {
      adapter: async (config) => {
        request = config;
        return {
          config,
          data: {},
          headers: {},
          status: 200,
          statusText: 'OK',
        };
      },
    });

    expect(request?.data).toBe(JSON.stringify(body));
    expect(request?.headers.get('Content-Type')).toBe('application/json');
    expect(request?.headers.get('X-CSRF-Protection')).toBe('1');
  });

  it('no agrega la cabecera CSRF a solicitudes de sólo lectura', async () => {
    let request: InternalAxiosRequestConfig | undefined;

    await apiModule.api.get('/test', {
      adapter: async (config) => {
        request = config;
        return {
          config,
          data: {},
          headers: {},
          status: 200,
          statusText: 'OK',
        };
      },
    });

    expect(request?.headers.get('X-CSRF-Protection')).toBeUndefined();
  });

  it('emite el evento de sesión inválida ante un 401 fuera del login', async () => {
    const events = await captureWindowEvents(
      apiModule.AUTH_UNAUTHORIZED_EVENT,
      () =>
        apiModule.api.get('/schools/me', {
          adapter: rejectedAdapter({ status: 401 }),
        }),
    );

    expect(events).toHaveLength(1);
  });

  it('no emite el evento de sesión inválida cuando falla el login', async () => {
    const events = await captureWindowEvents(
      apiModule.AUTH_UNAUTHORIZED_EVENT,
      () =>
        apiModule.api.post(
          '/auth/login',
          { email: 'persona@example.com', password: 'incorrecta' },
          { adapter: rejectedAdapter({ status: 401 }) },
        ),
    );

    expect(events).toHaveLength(0);
  });

  it('deja que AuthProvider maneje localmente un 401 de /auth/me', async () => {
    const events = await captureWindowEvents(
      apiModule.AUTH_UNAUTHORIZED_EVENT,
      () =>
        apiModule.api.get('/auth/me', {
          adapter: rejectedAdapter({ status: 401 }),
        }),
    );

    expect(events).toHaveLength(0);
  });

  it.each([
    [403, 403],
    [500, 500],
    [503, 503],
  ] as const)(
    'emite un error global %i para una lectura HTTP %i',
    async (responseStatus, expectedStatus) => {
      const events = await captureWindowEvents(
        apiModule.APP_HTTP_ERROR_EVENT,
        () =>
          apiModule.api.get('/recurso-critico', {
            adapter: rejectedAdapter({ status: responseStatus }),
          }),
      );

      expect(events).toHaveLength(1);
      expect(customEventDetail(events[0])).toEqual({
        correlationId: null,
        statusCode: expectedStatus,
      });
    },
  );

  it('mantiene local un error 500 producido por una mutación', async () => {
    const events = await captureWindowEvents(
      apiModule.APP_HTTP_ERROR_EVENT,
      () =>
        apiModule.api.post(
          '/recurso',
          { name: 'Cambio funcional' },
          { adapter: rejectedAdapter({ status: 500 }) },
        ),
    );

    expect(events).toHaveLength(0);
  });

  it('clasifica como 503 una falla de red durante una lectura', async () => {
    const events = await captureWindowEvents(
      apiModule.APP_HTTP_ERROR_EVENT,
      () =>
        apiModule.api.get('/recurso-critico', {
          adapter: networkFailureAdapter,
        }),
    );

    expect(customEventDetail(events[0])).toEqual({
      correlationId: null,
      statusCode: 503,
    });
  });

  it('mantiene local un error de descarga aunque use GET', async () => {
    const events = await captureWindowEvents(
      apiModule.APP_HTTP_ERROR_EVENT,
      () =>
        apiModule.api.get('/reporte.xlsx', {
          adapter: rejectedAdapter({ status: 500 }),
          responseType: 'blob',
        }),
    );

    expect(events).toHaveLength(0);
  });

  it('no emite errores globales para solicitudes canceladas', async () => {
    const controller = new AbortController();
    controller.abort();

    const events = await captureWindowEvents(
      apiModule.APP_HTTP_ERROR_EVENT,
      () =>
        apiModule.api.get('/recurso-critico', {
          adapter: rejectedAdapter({ status: 503 }),
          signal: controller.signal,
        }),
    );

    expect(events).toHaveLength(0);
  });

  it('propaga un correlation ID seguro en el evento global', async () => {
    const events = await captureWindowEvents(
      apiModule.APP_HTTP_ERROR_EVENT,
      () =>
        apiModule.api.get('/recurso-critico', {
          adapter: rejectedAdapter({
            headers: { 'x-correlation-id': 'req-2026_08:ABC.17' },
            status: 500,
          }),
        }),
    );

    expect(customEventDetail(events[0])).toEqual({
      correlationId: 'req-2026_08:ABC.17',
      statusCode: 500,
    });
  });

  it('descarta un correlation ID que podría exponer contenido no seguro', async () => {
    const events = await captureWindowEvents(
      apiModule.APP_HTTP_ERROR_EVENT,
      () =>
        apiModule.api.get('/recurso-critico', {
          adapter: rejectedAdapter({
            data: { correlationId: '<script>alert(1)</script>' },
            status: 500,
          }),
        }),
    );

    expect(customEventDetail(events[0])).toEqual({
      correlationId: null,
      statusCode: 500,
    });
  });
});

function rejectedAdapter({
  data = {},
  headers = {},
  status,
}: {
  data?: unknown;
  headers?: Record<string, string>;
  status: number;
}) {
  return async (config: InternalAxiosRequestConfig) => {
    throw Object.assign(new Error(`HTTP ${status}`), {
      config,
      isAxiosError: true,
      response: {
        config,
        data,
        headers,
        status,
        statusText: 'Request failed',
      },
    });
  };
}

async function networkFailureAdapter(
  config: InternalAxiosRequestConfig,
): Promise<never> {
  throw Object.assign(new Error('Network Error'), {
    code: 'ERR_NETWORK',
    config,
    isAxiosError: true,
  });
}

async function captureWindowEvents(
  eventName: string,
  request: () => Promise<unknown>,
) {
  const events: Event[] = [];
  const listener = (event: Event) => events.push(event);
  window.addEventListener(eventName, listener);

  try {
    await expect(request()).rejects.toBeDefined();
  } finally {
    window.removeEventListener(eventName, listener);
  }

  return events;
}

function customEventDetail(event: Event | undefined) {
  expect(event).toBeInstanceOf(CustomEvent);
  return (event as CustomEvent<import('./api').AppHttpErrorDetail>).detail;
}
