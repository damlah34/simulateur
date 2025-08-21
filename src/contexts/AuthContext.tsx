import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, RegisterResult } from '../types';

const API_BASE = 'http://localhost:3001/api';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('focusPatrimoineUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const register = async (
    firstName: string,
    email: string,
    password: string,
  ): Promise<RegisterResult> => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, email, password }),
      });
      if (res.ok) {
        const newUser: User = await res.json();
        setUser(newUser);
        localStorage.setItem('focusPatrimoineUser', JSON.stringify(newUser));
        return { ok: true };
      }

      const { error } = await res.json().catch(() => ({ error: "Une erreur est survenue lors de l'inscription" }));
      return { ok: false, error };
    } catch (error) {
      console.error('Registration error:', error);
      return { ok: false, error: "Une erreur est survenue lors de l'inscription" };
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const user: User = await res.json();
        setUser(user);
        localStorage.setItem('focusPatrimoineUser', JSON.stringify(user));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('focusPatrimoineUser');
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};