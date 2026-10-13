import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('auth-storage');

      // Send the user back to the door that matches the area they were in, so a
      // partner/admin isn't dumped on the student sign-in (hard separation).
      const current = window.location.pathname;
      const loginPath = current.startsWith('/admin')
        ? '/admin/login'
        : current.startsWith('/partner') || current.startsWith('/dashboard')
          ? '/partner'
          : '/login';
      if (current !== loginPath) {
        window.location.href = `${loginPath}?redirect=${encodeURIComponent(current)}`;
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
