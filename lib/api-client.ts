/**
 * Central API client for all HTTP requests (axios).
 * Use with React Query for caching, refetching, and loading states.
 * Use the exported `axiosInstance` to add interceptors for protected routes (e.g. auth token, 401 handling).
 */

import axios, { type AxiosInstance } from 'axios';

const DEFAULT_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://staging-api.loverebuilt.com';

export type ApiClientConfig = {
  baseURL?: string;
  headers?: Record<string, string>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function createApiClient(config: ApiClientConfig = {}) {
  const baseURL = config.baseURL ?? DEFAULT_BASE_URL;
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
  };

  const instance: AxiosInstance = axios.create({
    baseURL,
    headers: defaultHeaders,
  });

  // Request logging
  instance.interceptors.request.use((config) => {
    if (['post', 'put', 'patch'].includes(config.method?.toLowerCase() || '')) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
      console.log(JSON.stringify(config.data, null, 2));
    }
    return config;
  });

  // Unwrap backend envelope: { meta, data: { result } } → data.result (or data if no result key)
  instance.interceptors.response.use(
    (response) => {
      const config = response.config;
      if (['post', 'put', 'patch'].includes(config.method?.toLowerCase() || '')) {
        console.log(`[API Response] ${config.method?.toUpperCase()} ${config.url}`);
        console.log(JSON.stringify(response.data, null, 2));
      }
      const body = response.data;
      if (body && typeof body === 'object' && 'data' in body && 'meta' in body) {
        const inner = body.data;
        // If data has only { result } and nothing else (e.g. no pagination), unwrap to result
        // Otherwise keep data as-is so paginated responses retain their shape
        if (inner && typeof inner === 'object' && 'result' in inner) {
          const keys = Object.keys(inner);
          response.data = keys.length === 1 ? inner.result : inner;
        } else {
          response.data = inner;
        }
      }
      return response;
    },
    (error) => {
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data as
          | { meta?: { message?: string | string[]; statusCode?: number }; message?: string | string[]; error?: string }
          | undefined;

        // Backend wraps errors in { meta: { message } } — fall back to top-level message
        const rawMessage = responseData?.meta?.message ?? responseData?.message;

        let message: string;
        if (Array.isArray(rawMessage)) {
          message = rawMessage.join('. ');
        } else if (rawMessage) {
          message = rawMessage;
        } else if (responseData?.error) {
          message = responseData.error;
        } else {
          message = 'Something went wrong. Please try again.';
        }

        const status = error.response?.status ?? responseData?.meta?.statusCode ?? 0;
        throw new ApiError(message, status, responseData);
      }
      throw error;
    }
  );

  return {
    /** Axios instance — use this to add request/response interceptors for auth (e.g. attach token, handle 401). */
    axiosInstance: instance,

    get: <T>(path: string, options?: { params?: Record<string, string>; headers?: Record<string, string> }) =>
      instance.get<T>(path, options).then((res) => res.data),

    post: <T>(path: string, data?: unknown, options?: { headers?: Record<string, string> }) =>
      instance.post<T>(path, data, options).then((res) => res.data),

    put: <T>(path: string, data?: unknown, options?: { headers?: Record<string, string> }) =>
      instance.put<T>(path, data, options).then((res) => res.data),

    patch: <T>(path: string, data?: unknown, options?: { headers?: Record<string, string> }) =>
      instance.patch<T>(path, data, options).then((res) => res.data),

    delete: <T>(path: string, options?: { headers?: Record<string, string> }) =>
      instance.delete<T>(path, options).then((res) => res.data),
  };
}

const client = createApiClient();
export const apiClient = client;
/** Use this to add interceptors for protected routes (e.g. attach auth token, refresh on 401). */
export const axiosInstance = client.axiosInstance;
