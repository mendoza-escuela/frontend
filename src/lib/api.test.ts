import type { InternalAxiosRequestConfig } from 'axios';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

let api: typeof import('./api').api;

beforeAll(async () => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:4000/api');
  ({ api } = await import('./api'));
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe('api', () => {
  it('conserva FormData para que el navegador envíe archivos multipart', async () => {
    const body = new FormData();
    body.append('file', 'contenido-de-prueba');
    let request: InternalAxiosRequestConfig | undefined;

    await api.post('/test', body, {
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

    await api.post('/test', body, {
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

    await api.get('/test', {
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
});
