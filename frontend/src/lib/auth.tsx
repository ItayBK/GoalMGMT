"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";
import type { User, TokenResponse } from "@/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, check for existing token and fetch user profile
  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (stored) {
      setToken(stored);
      fetchUser(stored);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchUser(jwt: string) {
    try {
      const res = await api.get<User>("/users/me", {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      setUser(res.data);
    } catch {
      localStorage.removeItem("token");
      setToken(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const res = await api.post<TokenResponse>("/auth/login", {
      email,
      password,
    });
    const jwt = res.data.access_token;
    localStorage.setItem("token", jwt);
    setToken(jwt);
    await fetchUser(jwt);
  }

  async function register(email: string, password: string) {
    const res = await api.post<TokenResponse>("/auth/register", {
      email,
      password,
    });
    const jwt = res.data.access_token;
    localStorage.setItem("token", jwt);
    setToken(jwt);
    await fetchUser(jwt);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
