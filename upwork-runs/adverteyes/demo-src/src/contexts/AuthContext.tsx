import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authLogin, authMe } from '../api';
import type { User } from '../api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('ae_token');
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('ae_token');
    if (!token) { setLoading(false); return; }
    authMe()
      .then(setUser)
      .catch(logout)
      .finally(() => setLoading(false));
  }, [logout]);

  const login = async (email: string, password: string) => {
    const { token, user } = await authLogin(email, password);
    localStorage.setItem('ae_token', token);
    setUser(user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
