import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/auth-store';
import {
  getLoginPathForPathname,
  getRoleLoginPath,
  isPathAllowedForRole,
  readStoredAuth,
} from '@/lib/role-routing';

const getBaseApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // In local development, direct to localhost backend
    if (host === 'localhost' || host === '127.0.0.1') {
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    }
    // In browser on deployed environments (e.g. Vercel), use relative '/api'
    // so requests flow seamlessly through Next.js rewrites. This guarantees
    // requests bypass campus network firewalls (such as FortiGuard / SonicWALL
    // which block dynamic DNS services like DuckDNS), eliminates CORS, and preserves auth.
    return '/api';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
};

const API_URL = getBaseApiUrl();

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - attach the auth token (browser only)
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle expired sessions on PROTECTED requests only.
// We deliberately don't redirect for /auth/* calls: a wrong password on
// /auth/login returns 401 and should surface an inline error, not bounce the
// user to a reloaded login page.
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const url = error.config?.url ?? '';
    const isAuthRequest = url.includes('/auth/');

    if (
      error.response?.status === 401 &&
      !isAuthRequest &&
      typeof window !== 'undefined'
    ) {
      const storedRole = readStoredAuth().user?.role;
      useAuthStore.getState().logout();
      localStorage.removeItem('cart-storage');

      // Prefer the user's actual role door over URL heuristics so admins/partners
      // on `/profile` or `/` are never dropped onto the student sign-in page.
      const current = window.location.pathname;
      const loginPath = storedRole
        ? getRoleLoginPath(storedRole)
        : getLoginPathForPathname(current);

      if (current !== loginPath) {
        const currentWithQuery = current + window.location.search;
        const canRestoreHere =
          !storedRole || isPathAllowedForRole(currentWithQuery, storedRole);
        const redirectQuery = canRestoreHere
          ? `?redirect=${encodeURIComponent(currentWithQuery)}`
          : '';
        window.location.href = `${loginPath}${redirectQuery}`;
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Extracts a human-friendly message from an Axios error, checking the shapes our
 * backend returns (`{ message }` from AppError, `{ errors: [{ msg }] }` from
 * express-validator) and falling back to network-level hints.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: string; message?: string; errors?: Array<{ msg?: string }> }
      | undefined;

    // Our backend returns `{ success: false, error: "<message>" }` for every
    // handled error (see backend errorHandler + validate middleware), so check
    // `error` first. The other shapes are kept as defensive fallbacks.
    if (data?.error) {
      return data.error;
    }
    if (data?.errors?.length && data.errors[0]?.msg) {
      return data.errors[0].msg as string;
    }
    if (data?.message) {
      return data.message;
    }
    if (error.code === 'ECONNABORTED') {
      return 'The request timed out. Check your connection and try again.';
    }
    if (!error.response) {
      return 'Cannot reach the server. Please try again in a moment.';
    }
  }
  return fallback;
}

export default apiClient;
