import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi } from '../api/client';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'customer';
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('orschell_user') || 'null'); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('orschell_token');
    if (!token) { setLoading(false); return; }
    authApi.me().then(r => {
      setUser(r.data.user);
      localStorage.setItem('orschell_user', JSON.stringify(r.data.user));
    }).catch(() => {
      localStorage.removeItem('orschell_token');
      localStorage.removeItem('orschell_user');
      setUser(null);
    }).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await authApi.login(email, password);
    localStorage.setItem('orschell_token', r.data.token);
    localStorage.setItem('orschell_user', JSON.stringify(r.data.user));
    setUser(r.data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const r = await authApi.register(email, password, name);
    localStorage.setItem('orschell_token', r.data.token);
    localStorage.setItem('orschell_user', JSON.stringify(r.data.user));
    setUser(r.data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('orschell_token');
    localStorage.removeItem('orschell_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
