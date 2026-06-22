import { tokenStorage } from './tokenStorage';
import type { ApiError } from '../types/api';

export const API_BASE_URL = 'http://3.107.10.48:8000/api';

export const AUTH_EXPIRED_EVENT = 'auth:expired';

/**
 * Dispatches a same-tab event when the refresh token is invalid/expired.
 * tokenStorage.clear() already triggers cross-tab sync via the 'storage'
 * event; this covers the CURRENT tab, which doesn't receive 'storage'
 * events for its own writes.
 */
function notifyAuthExpired() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
}

export class ApiRequestError extends Error {
  status: number;
  data: ApiError;

  constructor(status: number, data: ApiError) {
    super(data.detail || data.error || `Request failed with status ${status}`);
    this.status = status;
    this.data = data;
  }
}

let refreshPromise: Promise<string | null> | null = null;

/**
 * Calls /api/token/refresh/ using the stored refresh token.
 * Deduplicates concurrent refresh attempts.
 */
async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refresh = tokenStorage.getRefresh();
    if (!refresh) return null;

    try {
      const res = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });

      if (!res.ok) {
        tokenStorage.clear();
        notifyAuthExpired();
        return null;
      }

      const data = await res.json();
      tokenStorage.setAccess(data.access);
      return data.access as string;
    } catch {
      tokenStorage.clear();
      notifyAuthExpired();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown; // JSON-serializable, or FormData
  auth?: boolean; // default true
}

/**
 * Core fetch wrapper:
 * - Adds JSON headers (unless FormData)
 * - Attaches Bearer token
 * - Auto-refreshes on 401 and retries once
 * - Throws ApiRequestError on non-2xx
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers, ...rest } = options;

  const isFormData = body instanceof FormData;

  const buildHeaders = (): HeadersInit => {
    const h: Record<string, string> = { ...(headers as Record<string, string>) };
    if (!isFormData) h['Content-Type'] = 'application/json';
    if (auth) {
      const token = tokenStorage.getAccess();
      if (token) h['Authorization'] = `Bearer ${token}`;
    }
    return h;
  };

  const doFetch = async (): Promise<Response> => {
    return fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: buildHeaders(),
      body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res = await doFetch();

  // Attempt token refresh on 401 (but not for the refresh/login endpoints themselves)
  if (res.status === 401 && auth && !path.includes('/login') && !path.includes('/token/refresh')) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch();
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    throw new ApiRequestError(res.status, typeof data === 'object' ? data : { detail: String(data) });
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) => apiFetch<T>(path, { ...options, method: 'DELETE' }),
};