import axios, { type InternalAxiosRequestConfig } from "axios";
import {
  clearAccessToken,
  getAccessToken,
  refreshAccessToken,
} from "./authToken";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  withCredentials: true,
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
};

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;
    const url = String(originalRequest?.url ?? "");

    const isAuthEndpoint =
      url.includes("/auth/login-password") ||
      url.includes("/auth/login-otp") ||
      url.includes("/auth/signup") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout");

    if (status === 401 && originalRequest && !originalRequest._authRetry && !isAuthEndpoint) {
      originalRequest._authRetry = true;

      const token = await refreshAccessToken();
      if (token) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }

      clearAccessToken();
    }

    if (status === 403) {
      console.log("not allowed");
    }

    return Promise.reject(error);
  },
);

export default api;
