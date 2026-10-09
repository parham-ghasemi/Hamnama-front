import axios, { type InternalAxiosRequestConfig } from "axios";
import {
  getAccessToken,
  refreshAccessToken,
} from "./authToken";
import { getApiErrorMessage } from "./apiError";

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  withCredentials: true,
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean;
};

type AuthRefreshAwareError = Error & {
  authRefreshTransientFailure?: boolean;
};

export const isTransientAuthRefreshFailure = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as AuthRefreshAwareError).authRefreshTransientFailure === true;

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

      const refreshResult = await refreshAccessToken();
      if (refreshResult.token) {
        originalRequest.headers.Authorization = `Bearer ${refreshResult.token}`;
        return api(originalRequest);
      }

      // The original 401 may be caused by an expired access JWT, while the
      // refresh request itself failed only because the network is changing.
      // Mark that distinction so AuthContext does not log out the user based
      // on the original 401 after a transient refresh failure.
      if (refreshResult.failure === "transient") {
        (error as AuthRefreshAwareError).authRefreshTransientFailure = true;
      }
    }

    if (status === 403) {
      console.log("not allowed");
    }

    if (error?.response) {
      const normalizedMessage = getApiErrorMessage(error, 'عملیات انجام نشد. لطفاً دوباره تلاش کنید.');
      error.message = normalizedMessage;
      if (typeof error.response.data === 'string') {
        error.response.data = normalizedMessage;
      } else if (error.response.data && typeof error.response.data === 'object') {
        error.response.data = {
          ...error.response.data,
          message: normalizedMessage,
        };
      } else {
        error.response.data = { message: normalizedMessage };
      }
    }

    return Promise.reject(error);
  },
);

export default api;
