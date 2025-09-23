import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type UserInfo = {
  email: string;
  full_name?: string;
  firstName?: string;
} | null;

type SignupResult = "ok" | "confirm_email";

type AuthContextType = {
  token: string | null;
  user: UserInfo;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName?: string) => Promise<SignupResult>;
  loadMe: () => Promise<UserInfo>;
  logout: () => void;
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType>({} as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"));
  const [user, setUser] = useState<UserInfo>(null);

  async function login(email: string, password: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.error || "Login failed");
    }
    const j = await res.json();
    const t = j?.access_token as string;
    if (!t) throw new Error("No token returned");
    setToken(t);
    localStorage.setItem("auth_token", t);
    await loadMe();
  }

  async function signup(email: string, password: string, fullName?: string): Promise<SignupResult> {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      // Si backend renvoie 409 → email déjà utilisé
      if (res.status === 409) {
        throw new Error(j?.error || "Un compte existe déjà avec cet email.");
      }
      throw new Error(j?.error || "Signup failed");
    }

    // Tente l’auto-login (si pas de confirmation requise)
    try {
      await login(email, password);
      return "ok";
    } catch {
      return "confirm_email";
    }
  }

  async function loadMe(): Promise<UserInfo> {
    if (!token) return null;
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const me = await res.json();
    const ui: UserInfo = {
      email: me?.email || "",
      full_name: me?.full_name || "",
      firstName: me?.firstName || "",
    };
    setUser(ui);
    return ui;
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
  }

  const authFetch = useMemo(
    () =>
      (input: RequestInfo, init?: RequestInit) => {
        const headers = new Headers(init?.headers || {});
        if (token) headers.set("Authorization", `Bearer ${token}`);
        headers.set("Content-Type", "application/json");
        return fetch(input, { ...init, headers });
      },
    [token]
  );

  useEffect(() => {
    if (token && !user) {
      loadMe().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const value: AuthContextType = {
    token,
    user,
    login,
    signup,
    loadMe,
    logout,
    authFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
