import axios, { AxiosError } from "axios";
import type { AxiosInstance } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

type AccessTokenProvider = () => string | null;
type RefreshHandler = () => Promise<string | null>;

let getAccessToken: AccessTokenProvider = () => null;
let handleUnauthorized: RefreshHandler | null = null;
let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

export function configureApiClient(options: { getAccessToken: AccessTokenProvider; onUnauthorized: RefreshHandler }) {
  getAccessToken = options.getAccessToken;
  handleUnauthorized = options.onUnauthorized;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken?.();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest: any = error.config ?? {};
    const url = String(originalRequest?.url ?? "");
    const isAuthEndpoint = url.startsWith("/auth/login") || url.startsWith("/auth/register") || url.startsWith("/auth/refresh");

    // Do not attempt token refresh for auth endpoints themselves
    if (status === 401 && handleUnauthorized && !originalRequest.__isRetry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push((token) => {
            if (!token) {
              reject(error);
              return;
            }
            originalRequest.headers = originalRequest.headers ?? {};
            originalRequest.headers.Authorization = `Bearer ${token}`;
            originalRequest.__isRetry = true;
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;
      originalRequest.__isRetry = true;

      try {
        const newToken = await handleUnauthorized();
        queue.forEach((cb) => cb(newToken));
        queue = [];
        if (!newToken) {
          throw error;
        }
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        queue.forEach((cb) => cb(null));
        queue = [];
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
