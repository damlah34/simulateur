import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AppUser } from '../types/user';
import {
  fetchCurrentUser,
  login as apiLogin,
  registerUser,
} from '../utils/api';

interface AuthContextValue {
  user: AppUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: { email: string; password: string; fullName?: string }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'focus-patrimoine-token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const persistToken = useCallback((value: string | null) => {
    setToken(value);
    if (value) {
      localStorage.setItem(STORAGE_KEY, value);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const loadCurrentUser = useCallback(async (activeToken: string) => {
    try {
      const { user } = await fetchCurrentUser(activeToken);
      setUser(user);
      setError(null);
    } catch (err: any) {
      setUser(null);
      setError(err?.message ?? 'Impossible de récupérer votre profil');
      persistToken(null);
    }
  }, [persistToken]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }
    (async () => {
      setLoading(true);
      await loadCurrentUser(token);
      setLoading(false);
    })();
  }, [token, loadCurrentUser]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { token: newToken, user } = await apiLogin(email, password);
      persistToken(newToken);
      setUser(user);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? 'Identifiants invalides');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (input: { email: string; password: string; fullName?: string }) => {
    setLoading(true);
    try {
      const { token: newToken, user } = await registerUser(input);
      persistToken(newToken);
      setUser(user);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? 'Inscription impossible');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    persistToken(null);
    setUser(null);
    setError(null);
  };

  const refresh = useCallback(async () => {
    if (!token) return;
    await loadCurrentUser(token);
  }, [token, loadCurrentUser]);

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
