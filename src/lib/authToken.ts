import axios from "axios";

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const clearAccessToken = () => {
  accessToken = null;
};

export const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await axios.post<{ access_token: string }>(
        `${import.meta.env.VITE_BASE_URL}/auth/refresh`,
        undefined,
        { withCredentials: true },
      );

      const token = response.data.access_token;
      if (!token) {
        clearAccessToken();
        return null;
      }

      setAccessToken(token);
      return token;
    } catch {
      clearAccessToken();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};
