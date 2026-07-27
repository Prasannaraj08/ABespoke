import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'boutique' | 'designer' | 'admin';
  verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  googleLoginSim: (name: string, email: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isBoutique: boolean;
  isDesigner: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Helper to save session data safely
  const saveSession = (sessionToken: string, sessionUser: User) => {
    setToken(sessionToken);
    setUser(sessionUser);
    localStorage.setItem('clara_luxe_token', sessionToken);
    localStorage.setItem('clara_luxe_user', JSON.stringify(sessionUser));
  };

  // Helper to clear session data safely
  const clearSession = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('clara_luxe_token');
    localStorage.removeItem('clara_luxe_user');
    localStorage.removeItem('viewed_products');
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('clara_luxe_token');
      const storedUser = localStorage.getItem('clara_luxe_user');

      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);

          // Server Verification: Validate token with backend to prevent client-side admin spoofing
          const freshProfile = await authAPI.getProfile();
          setUser(freshProfile);
          localStorage.setItem('clara_luxe_user', JSON.stringify(freshProfile));
        } catch (err) {
          console.warn('Auth session invalid or corrupted. Clearing storage.');
          clearSession();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await authAPI.login({ email, password });
      saveSession(data.token, data.user);
    } catch (error: any) {
      clearSession();
      throw error.response?.data?.message || 'Login failed';
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role = 'user') => {
    setLoading(true);
    try {
      const data = await authAPI.register({ name, email, password, role });
      saveSession(data.token, data.user);
    } catch (error: any) {
      clearSession();
      throw error.response?.data?.message || 'Registration failed';
    } finally {
      setLoading(false);
    }
  };

  const googleLoginSim = async (name: string, email: string) => {
    setLoading(true);
    try {
      const googleId = `google_${Math.random().toString(36).substring(2, 11)}`;
      const data = await authAPI.googleLogin({ name, email, googleId });
      saveSession(data.token, data.user);
    } catch (error: any) {
      clearSession();
      throw error.response?.data?.message || 'Google authentication failed';
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearSession();
  };

  const isAdmin = user?.role === 'admin';
  const isBoutique = user?.role === 'boutique';
  const isDesigner = user?.role === 'designer';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, googleLoginSim, logout, isAdmin, isBoutique, isDesigner }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
