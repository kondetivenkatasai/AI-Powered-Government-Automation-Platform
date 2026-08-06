import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, LoginResponse } from '../types';
import { apiFetch } from '../services/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('govflow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initial Auth Check on App Mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('govflow_token');
      if (!storedToken) {
        console.log('[AUTH] No stored token found in localStorage. User unauthenticated.');
        setIsLoading(false);
        return;
      }

      console.log('[AUTH] Stored token found. Initializing validation via /auth/me...');
      try {
        const userData = await apiFetch<User>('/auth/me');
        console.log('[AUTH] Token validated successfully. User metadata loaded:', userData.full_name, `(${userData.role})`);
        setUser(userData);
        setToken(storedToken);
      } catch (err: any) {
        console.warn('[AUTH] Token validation failed. Clearing stale localStorage token:', err.message || err);
        localStorage.removeItem('govflow_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    console.log(`[AUTH] Login request initiated for email: ${email}`);
    setIsLoading(true);
    try {
      const res = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      console.log('[AUTH] Login response received successfully (HTTP 200).');
      console.log(`[AUTH] Token received: ${res.access_token.substring(0, 20)}...`);

      localStorage.setItem('govflow_token', res.access_token);
      console.log('[AUTH] Token saved in localStorage under key "govflow_token"');

      setToken(res.access_token);
      setUser(res.user);

      console.log(`[AUTH] Auth state updated successfully. User: ${res.user.full_name} (${res.user.role})`);
      console.log(`[AUTH] Automatic redirecting initiated to ${res.user.role} dashboard...`);
    } catch (err: any) {
      console.error('[AUTH] Login request failed:', err.message || err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (fullName: string, email: string, password: string, phone?: string) => {
    console.log(`[AUTH] Citizen Registration request initiated for email: ${email}`);
    setIsLoading(true);
    try {
      await apiFetch<User>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
          phone_number: phone,
          role: 'CITIZEN'
        }),
      });

      console.log('[AUTH] Registration successful. Initiating auto-login...');
      await login(email, password);
    } catch (err: any) {
      console.error('[AUTH] Registration failed:', err.message || err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('[AUTH] User initiated logout. Clearing localStorage token & resetting state.');
    localStorage.removeItem('govflow_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
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
