/**
 * Central API client for all HTTP requests (axios).
 * Use with React Query for caching, refetching, and loading states.
 * Use the exported `axiosInstance` to add interceptors for protected routes (e.g. auth token, 401 handling).
 */

import axios, { type AxiosInstance } from 'axios';

const DEFAULT_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.example.com';

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

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isAxiosError(error)) {
        const message =
          (error.response?.data as { message?: string })?.message ??
          error.message ??
          `Request failed (${error.response?.status ?? 'unknown'})`;
        const status = error.response?.status ?? 0;
        const data = error.response?.data;
        throw new ApiError(message, status, data);
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
