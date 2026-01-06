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
    console.log('🔄 fetchMe called - checking authentication...');
    
    // Check localStorage first
    let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    console.log('📦 Token in localStorage:', token ? 'EXISTS (length: ' + token.length + ')' : 'MISSING');
    
    // Check cookie as backup
    if (!token && typeof window !== 'undefined') {
      const cookieMatch = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
      token = cookieMatch ? cookieMatch[1] : null;
      console.log('🍪 Token in cookie:', token ? 'EXISTS (length: ' + token.length + ')' : 'MISSING');
      
      if (token) {
        localStorage.setItem('token', token);
        console.log('🔄 Synced token from cookie to localStorage');
      }
    }
    
    // Check sessionStorage as last resort (survives page reloads)
    if (!token && typeof window !== 'undefined') {
      token = sessionStorage.getItem('token');
      console.log('💾 Token in sessionStorage:', token ? 'EXISTS (length: ' + token.length + ')' : 'MISSING');
      
      if (token) {
        localStorage.setItem('token', token);
        console.log('🔄 Synced token from sessionStorage to localStorage');
      }
    }
    
    if (!token) {
      console.log('❌ No token found - user not authenticated');
      setUser(null);
      setLoading(false);
      return;
    }
    
    try {
      console.log('🌐 Making request to /api/auth/me...');
      const response = await api.get('/api/auth/me');
      console.log('✅ fetchMe SUCCESS - User:', response.data.user);
      setUser(response.data.user);
      
      // Store in sessionStorage for persistence across redirects
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('token', token);
      }
    } catch (error: any) {
      console.log('❌ fetchMe FAILED:', {
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        error: error
      });
      
      // Retry once before giving up (handles temporary network issues)
      try {
        console.log('🔄 Retrying fetchMe...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        const retryResponse = await api.get('/api/auth/me');
        console.log('✅ fetchMe RETRY SUCCESS');
        setUser(retryResponse.data.user);
        
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('token', token);
        }
        setLoading(false);
        return;
      } catch (retryError) {
        console.log('❌ fetchMe RETRY FAILED');
      }
      
      setUser(null);
      // Clear invalid tokens
      localStorage.removeItem('token');
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('token');
      }
      document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 AuthProvider mounted - running initial fetchMe()');
    fetchMe();
  }, []);

  const login = async (identifier: string, password: string) => {
    console.log('🔐 Login attempt for:', identifier);
    const response = await api.post('/api/auth/login', { identifier, password });
    console.log('✅ Login response:', response.data);
    setUser(response.data.user);
    // Store token in localStorage, sessionStorage, AND cookie for maximum persistence
    if (response.data.token) {
      console.log('💾 Storing token (length:', response.data.token.length, ')');
      localStorage.setItem('token', response.data.token);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('token', response.data.token);
      }
      document.cookie = `token=${response.data.token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
      
      console.log('✅ Token stored! Verification:', localStorage.getItem('token') ? 'SUCCESS' : 'FAILED');
    } else {
      console.warn('⚠️ No token in login response!');
    }
  };

  const register = async (name: string, email: string, password: string, phone: string) => {
    const response = await api.post('/api/auth/register', { name, email, password, phone });
    setUser(response.data.user);
    // Store token in localStorage, sessionStorage, AND cookie for maximum persistence
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('token', response.data.token);
      }
      document.cookie = `token=${response.data.token}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    }
  };

  const logout = async () => {
    console.log('🚪 Logout called');
    await api.post('/api/auth/logout');
    setUser(null);
    // Clear token from localStorage, sessionStorage, and cookie
    localStorage.removeItem('token');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('token');
    }
    document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
    console.log('✅ Logout complete - token removed from localStorage, sessionStorage, and cookie');
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

