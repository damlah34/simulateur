import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';

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

  const register = async (firstName: string, email: string, password: string): Promise<boolean> => {
    try {
      // Simulate registration process
      const existingUsers = JSON.parse(localStorage.getItem('focusPatrimoineUsers') || '[]');
      
      // Check if user already exists
      if (existingUsers.find((u: any) => u.email === email)) {
        return false;
      }

      const newUser: User = {
        id: Date.now().toString(),
        firstName,
        email,
      };

      // Save user credentials (in real app, this would be handled by backend)
      const userWithPassword = { ...newUser, password };
      existingUsers.push(userWithPassword);
      localStorage.setItem('focusPatrimoineUsers', JSON.stringify(existingUsers));
      
      // Set current user
      setUser(newUser);
      localStorage.setItem('focusPatrimoineUser', JSON.stringify(newUser));
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const existingUsers = JSON.parse(localStorage.getItem('focusPatrimoineUsers') || '[]');
      const foundUser = existingUsers.find((u: any) => u.email === email && u.password === password);
      
      if (foundUser) {
        const user: User = {
          id: foundUser.id,
          firstName: foundUser.firstName,
          email: foundUser.email,
        };
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