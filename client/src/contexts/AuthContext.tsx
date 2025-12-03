'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const response = await api.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = async (identifier: string, password: string) => {
    const response = await api.post('/api/auth/login', { identifier, password });
    setUser(response.data.user);
    // Store token in localStorage for cross-domain auth
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
  };

  const register = async (name: string, email: string, password: string, phone: string) => {
    const response = await api.post('/api/auth/register', { name, email, password, phone });
    setUser(response.data.user);
    // Store token in localStorage for cross-domain auth
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
  };

  const logout = async () => {
    await api.post('/api/auth/logout');
    setUser(null);
    // Clear token from localStorage
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, fetchMe }}>
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

