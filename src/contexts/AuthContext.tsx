import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppUser, UserRole } from "../types/user";
import { fetchCurrentUser, login as legacyLogin } from "../utils/api";

type SignupResult = "ok" | "confirm_email";

type CombinedUser = {
  email?: string;
  fullName?: string;
  firstName?: string;
  role?: UserRole;
  legacy?: AppUser | null;
} | null;

type AuthContextType = {
  token: string | null;
  legacyToken: string | null;
  user: CombinedUser;
  legacyUser: AppUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName?: string) => Promise<SignupResult>;
  logout: () => void;
  loadMe: () => Promise<CombinedUser>;
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  legacyFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPABASE_STORAGE_KEY = "auth_token";
const LEGACY_STORAGE_KEY = "legacy_auth_token";
const LEGACY_OLD_KEY = "focus-patrimoine-token";

function readStorage(key: string) {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (value) {
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

function readInitialLegacyToken(): string | null {
  const storedLegacy = readStorage(LEGACY_STORAGE_KEY);
  if (storedLegacy) return storedLegacy;
  const old = readStorage(LEGACY_OLD_KEY);
  if (old) {
    writeStorage(LEGACY_STORAGE_KEY, old);
    writeStorage(LEGACY_OLD_KEY, null);
    return old;
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStorage(SUPABASE_STORAGE_KEY));
  const [legacyToken, setLegacyToken] = useState<string | null>(() => readInitialLegacyToken());
  const [user, setUser] = useState<CombinedUser>(null);
  const [legacyUser, setLegacyUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persistSupabaseToken = useCallback((value: string | null) => {
    setToken(value);
    writeStorage(SUPABASE_STORAGE_KEY, value);
  }, []);

  const persistLegacyToken = useCallback((value: string | null) => {
    setLegacyToken(value);
    writeStorage(LEGACY_STORAGE_KEY, value);
  }, []);

  const updateUserState = useCallback(
    (supInfo?: Partial<NonNullable<CombinedUser>> | null, legacyInfo?: AppUser | null | undefined) => {
      setUser((prev) => {
        const resolvedLegacy =
          legacyInfo === undefined ? prev?.legacy ?? legacyUser ?? null : legacyInfo;

        const email =
          supInfo?.email || prev?.email || resolvedLegacy?.email || undefined;
        const fullName =
          supInfo?.fullName || prev?.fullName || resolvedLegacy?.fullName || undefined;
        const firstName =
          supInfo?.firstName ||
          prev?.firstName ||
          (resolvedLegacy?.fullName ? resolvedLegacy.fullName.split(/\s+/)[0] : undefined) ||
          (email ? email.split("@")[0] : undefined);
        const role = resolvedLegacy?.role || prev?.role || undefined;
        const legacy = resolvedLegacy ?? null;

        if (!email && !fullName && !firstName && !role && !legacy) {
          return null;
        }

        return { email, fullName, firstName, role, legacy };
      });
    },
    [legacyUser]
  );

  const fetchSupabaseUser = useCallback(
    async (activeToken: string) => {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        throw new Error((data as any)?.error || "Session expirée");
      }
      const supInfo = {
        email: (data as any)?.email || undefined,
        fullName: (data as any)?.full_name || undefined,
        firstName: (data as any)?.firstName || undefined,
      };
      updateUserState(supInfo, undefined);
      return supInfo;
    },
    [updateUserState]
  );

  const loadLegacyUser = useCallback(
    async (activeToken: string) => {
      const { user: legacy } = await fetchCurrentUser(activeToken);
      setLegacyUser(legacy);
      updateUserState(undefined, legacy);
      return legacy;
    },
    [updateUserState]
  );

  const loadMe = useCallback(async (): Promise<CombinedUser> => {
    if (!token) {
      return null;
    }
    try {
      const supInfo = await fetchSupabaseUser(token);
      return {
        email: supInfo.email,
        fullName: supInfo.fullName,
        firstName: supInfo.firstName,
        role: legacyUser?.role,
        legacy: legacyUser,
      };
    } catch (err) {
      persistSupabaseToken(null);
      throw err;
    }
  }, [token, fetchSupabaseUser, legacyUser, persistSupabaseToken]);

  useEffect(() => {
    if (!token) {
      setUser((prev) => {
        if (legacyUser) {
          return {
            email: prev?.email || legacyUser.email,
            fullName: prev?.fullName || legacyUser.fullName || undefined,
            firstName:
              prev?.firstName ||
              (legacyUser.fullName ? legacyUser.fullName.split(/\s+/)[0] : undefined) ||
              (legacyUser.email ? legacyUser.email.split("@")[0] : undefined),
            role: legacyUser.role,
            legacy: legacyUser,
          };
        }
        return null;
      });
      return;
    }
    loadMe().catch(() => {});
  }, [token, loadMe, legacyUser]);

  useEffect(() => {
    if (!legacyToken) {
      setLegacyUser(null);
      updateUserState(undefined, null);
      return;
    }
    loadLegacyUser(legacyToken).catch(() => {
      persistLegacyToken(null);
    });
  }, [legacyToken, loadLegacyUser, persistLegacyToken, updateUserState]);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (!res.ok) {
          throw new Error((data as any)?.error || "Identifiants invalides");
        }
        const accessToken = (data as any)?.access_token as string | undefined;
        if (!accessToken) {
          throw new Error("Token manquant dans la réponse");
        }
        persistSupabaseToken(accessToken);
        await fetchSupabaseUser(accessToken);

        try {
          const legacy = await legacyLogin(email, password);
          persistLegacyToken(legacy.token);
          setLegacyUser(legacy.user);
          updateUserState(undefined, legacy.user);
        } catch {
          persistLegacyToken(null);
          setLegacyUser(null);
          updateUserState(undefined, null);
        }
      } catch (err: any) {
        persistSupabaseToken(null);
        persistLegacyToken(null);
        setLegacyUser(null);
        setUser(null);
        setError(err?.message || "Connexion impossible");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchSupabaseUser, persistLegacyToken, persistSupabaseToken, updateUserState]
  );

  const signup = useCallback(
    async (email: string, password: string, fullName?: string): Promise<SignupResult> => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, fullName }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const message = (data as any)?.error || "Inscription impossible";
          if (res.status === 409) {
            throw new Error(message);
          }
          throw new Error(message);
        }

        try {
          await login(email, password);
          return "ok";
        } catch {
          setError(null);
          return "confirm_email";
        }
      } catch (err: any) {
        setError(err?.message || "Inscription impossible");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [login]
  );

  const logout = useCallback(() => {
    persistSupabaseToken(null);
    persistLegacyToken(null);
    setUser(null);
    setLegacyUser(null);
    setError(null);
  }, [persistLegacyToken, persistSupabaseToken]);

  const authFetch = useMemo(
    () =>
      (input: RequestInfo, init?: RequestInit) => {
        const headers = new Headers(init?.headers || {});
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        if (!headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json");
        }
        return fetch(input, { ...init, headers });
      },
    [token]
  );

  const legacyFetch = useMemo(
    () =>
      (input: RequestInfo, init?: RequestInit) => {
        const headers = new Headers(init?.headers || {});
        if (legacyToken) {
          headers.set("Authorization", `Bearer ${legacyToken}`);
        }
        if (!headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json");
        }
        return fetch(input, { ...init, headers });
      },
    [legacyToken]
  );

  const value: AuthContextType = {
    token,
    legacyToken,
    user,
    legacyUser,
    loading,
    error,
    login,
    signup,
    logout,
    loadMe,
    authFetch,
    legacyFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
