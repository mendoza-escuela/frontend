import axios from 'axios';

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';
export const APP_HTTP_ERROR_EVENT = 'app:http-error';
export const CSRF_PROTECTION_HEADER = 'X-CSRF-Protection';

export type AppHttpErrorStatus = 403 | 500 | 503;

export type AppHttpErrorDetail = {
  statusCode: AppHttpErrorStatus;
  correlationId: string | null;
};

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error('Missing VITE_API_URL environment variable.');
}

const normalizedApiUrl = apiUrl.replace(/\/+$/, '');
const apiBaseUrl = /\/api$/i.test(normalizedApiUrl)
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api`;

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

function safeCorrelationId(value: unknown) {
  if (typeof value !== 'string') return null;
  const normalizedValue = value.trim();
  return /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/.test(normalizedValue)
    ? normalizedValue
    : null;
}

function getResponseHeader(headers: unknown, name: string) {
  if (!headers || typeof headers !== 'object') return null;
  const headerContainer = headers as Record<string, unknown>;
  const getHeader = headerContainer.get;
  if (typeof getHeader === 'function') {
    return getHeader.call(headers, name);
  }
  return headerContainer[name];
}

function getCorrelationId(error: unknown) {
  if (!axios.isAxiosError(error)) return null;

  const responseHeaders = error.response?.headers;
  const headerValue =
    getResponseHeader(responseHeaders, 'x-correlation-id') ??
    getResponseHeader(responseHeaders, 'x-request-id');
  const safeHeaderValue = safeCorrelationId(headerValue);
  if (safeHeaderValue) return safeHeaderValue;

  const responseBody = error.response?.data;
  if (!responseBody || typeof responseBody !== 'object') return null;
  const body = responseBody as Record<string, unknown>;
  return (
    safeCorrelationId(body.correlationId) ??
    safeCorrelationId(body.requestId) ??
    safeCorrelationId(body.errorId)
  );
}

/**
 * Clasifica únicamente errores de cargas de lectura que justifican abandonar la
 * pantalla actual. Las validaciones, mutaciones, descargas y cancelaciones
 * conservan su tratamiento inline o mediante Sonner.
 */
export function getAppHttpErrorDetail(
  error: unknown,
): AppHttpErrorDetail | null {
  if (!axios.isAxiosError(error)) return null;
  if (
    axios.isCancel(error) ||
    error.code === 'ERR_CANCELED' ||
    error.config?.signal?.aborted
  ) {
    return null;
  }

  const method = error.config?.method?.toUpperCase();
  const responseType = error.config?.responseType;
  if (
    !method ||
    !['GET', 'HEAD'].includes(method) ||
    responseType === 'blob' ||
    responseType === 'arraybuffer'
  ) {
    return null;
  }

  const status = error.response?.status;
  let statusCode: AppHttpErrorStatus | null = null;
  if (!error.response || status === 502 || status === 503 || status === 504) {
    statusCode = 503;
  } else if (status === 403) {
    statusCode = 403;
  } else if (status && status >= 500) {
    statusCode = 500;
  }

  return statusCode
    ? { statusCode, correlationId: getCorrelationId(error) }
    : null;
}

function isAuthenticationEntryPoint(url: string | undefined) {
  return [
    '/auth/login',
    '/auth/logout',
    '/auth/me',
    '/auth/forgot-password',
    '/auth/reset-password',
  ].some((path) => url?.endsWith(path));
}

api.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase();
  if (method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    config.headers.set(CSRF_PROTECTION_HEADER, '1');
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      !isAuthenticationEntryPoint(error.config?.url) &&
      typeof window !== 'undefined'
    ) {
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }

    const appErrorDetail = getAppHttpErrorDetail(error);
    if (appErrorDetail && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<AppHttpErrorDetail>(APP_HTTP_ERROR_EVENT, {
          detail: appErrorDetail,
        }),
      );
    }
    return Promise.reject(error);
  },
);
