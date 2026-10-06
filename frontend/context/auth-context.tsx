'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { getAuthToken, setAuthToken, removeAuthToken } from '@/lib/auth-token';
import { UserProfile, AuthSession } from '@/types/api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      try {
        const response = await apiClient.get<UserProfile>('/auth/me');
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          removeAuthToken();
          setToken(null);
          setUser(null);
        }
      } catch {
        removeAuthToken();
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post<AuthSession>('/auth/login', {
        email,
        password,
      });

      if (response.success && response.data) {
        const { token: receivedToken, user: receivedUser } = response.data;
        setAuthToken(receivedToken);
        setToken(receivedToken);
        setUser(receivedUser);
        router.push('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await apiClient.post('/auth/logout');
      }
    } catch {
      // Abaikan error saat revoke token di server
    } finally {
      removeAuthToken();
      setToken(null);
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
