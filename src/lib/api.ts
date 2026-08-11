import axios from 'axios';

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';
export const CSRF_PROTECTION_HEADER = 'X-CSRF-Protection';

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
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);
