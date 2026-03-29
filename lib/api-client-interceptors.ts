/**
 * Axios interceptors for protected routes.
 * Import this once at app startup (e.g. in _layout.tsx or before any API calls) to attach the auth token and handle 401.
 */

import { axiosInstance } from '@/lib/api-client';
import { clearAuth, getAccessToken } from '@/lib/auth-store';
import { router } from 'expo-router';
import type { InternalAxiosRequestConfig } from 'axios';

/** Attach auth header to outgoing requests. */
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

/** Handle 401 — clear auth state and redirect to login. */
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearAuth();
      router.replace('/(auth)/sign-in');
    }
    return Promise.reject(error);
  }
);
