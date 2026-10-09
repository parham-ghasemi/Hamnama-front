import axios from "axios";

let accessToken: string | null = null;
type RefreshFailureKind = "invalid" | "transient";
export type RefreshResult =
  | { token: string; failure: null }
  | { token: null; failure: RefreshFailureKind };

let refreshPromise: Promise<RefreshResult> | null = null;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const clearAccessToken = () => {
  accessToken = null;
};

export const refreshAccessToken = async (): Promise<RefreshResult> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async (): Promise<RefreshResult> => {
    try {
      const response = await axios.post<{ access_token: string }>(
        `${import.meta.env.VITE_BASE_URL}/auth/refresh`,
        undefined,
        { withCredentials: true },
      );

      const token = response.data.access_token;
      if (!token) {
        // A malformed success response is not evidence that the server-side
        // session was revoked. Preserve any existing access token and retry later.
        return { token: null, failure: "transient" };
      }

      setAccessToken(token);
      return { token, failure: null };
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;

      if (status === 401 || status === 403) {
        // Only a definitive auth response means the refresh cookie is no longer
        // accepted. Network errors and 5xx failures are recoverable.
        clearAccessToken();
        return { token: null, failure: "invalid" };
      }

      return { token: null, failure: "transient" };
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};
