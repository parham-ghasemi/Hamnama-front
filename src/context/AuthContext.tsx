import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = () => {
    clearAccessToken();
    setUser(null);
  };

  const fetchUser = async () => {
    try {
      const { data } = await api.get<User>("/users/me");
      setUser(data);
    } catch (error) {
      console.error("Failed to fetch user", error);
      clearSession();
    }
  };

  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      const token = await refreshAccessToken();

      if (cancelled) return;

      if (token) {
        await fetchUser();
      } else {
        setIsLoading(false);
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
      if (!token) clearSession();
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

