import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import api from "../lib/axiosConfig";
import {
  clearAccessToken,
  refreshAccessToken,
  setAccessToken,
} from "../lib/authToken";

export interface User {
  id: string;
  username: string;
  phone_number: string;
  profile_picture: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_CACHE_KEY = "hamnama.auth.user";

const readCachedUser = (): User | null => {
  try {
    const raw = window.localStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (!parsed?.id || !parsed?.username) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => readCachedUser());
  const [isLoading, setIsLoading] = useState(true);

  const persistUser = (nextUser: User | null) => {
    if (nextUser) {
      window.localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(nextUser));
    } else {
      window.localStorage.removeItem(AUTH_CACHE_KEY);
    }
    setUser(nextUser);
  };

  const clearSession = () => {
    clearAccessToken();
    persistUser(null);
  };

  const fetchUser = async () => {
    try {
      const { data } = await api.get<User>("/users/me");
      persistUser(data);
    } catch (error) {
      console.error("Failed to fetch user", error);

      // A transient connection failure must not destroy an otherwise valid cached
      // session. Only a server response proving the session is invalid logs out.
      if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
        clearSession();
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      const cachedUser = readCachedUser();
      if (cachedUser) setUser(cachedUser);

      const token = await refreshAccessToken();

      if (cancelled) return;

      // Always validate an existing cached session when possible. If the request
      // cannot reach the server, fetchUser preserves the cached auth state.
      if (token || cachedUser) {
        await fetchUser();
      }
    };

    initializeAuth().finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    // Refresh the access JWT slightly before its five-minute lifetime expires.
    const interval = window.setInterval(async () => {
      const token = await refreshAccessToken();
      if (token) return;

      // refreshAccessToken can fail because the network is unavailable. Do not
      // discard cached authentication unless a follow-up request proves that
      // the server rejected the session.
      await fetchUser();
    }, 4 * 60 * 1000);

    return () => window.clearInterval(interval);
  }, [user]);

  const login = async (accessToken: string) => {
    setAccessToken(accessToken);
    await fetchUser();
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // The local session must still be cleared even if the network is unavailable.
    } finally {
      clearSession();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

