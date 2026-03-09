/**
 * Axios interceptors for protected routes.
 * Import this once at app startup (e.g. in _layout.tsx or before any API calls) to attach the auth token and handle 401.
 */

import { axiosInstance } from '@/lib/api-client';
import type { InternalAxiosRequestConfig } from 'axios';

/** Get the current access token (replace with your auth store/async storage). */
function getAccessToken(): string | null {
  // TODO: return from your auth context, Zustand store, or SecureStore
  return null;
}

/** Attach auth header to outgoing requests. */
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

/** Handle 401 (e.g. refresh token or redirect to login). */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // TODO: refresh token, clear auth state, or redirect to login
    }
    return Promise.reject(error);
  }
);
