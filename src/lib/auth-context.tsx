'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from './types';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerPatient: (fullName: string, email: string, phone: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  /** Replaces the cached session user after a profile edit, so the navbar and
   *  sidebar pick up a new name or avatar without signing out and back in. */
  applyProfileUpdate: (profile: UserProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from server-side HTTP-Only cookie or localStorage fallback
  useEffect(() => {
    async function restoreSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            const userProfile: UserProfile = {
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.full_name,
              role: data.user.role as UserRole,
              phone: data.user.phone || undefined,
              avatar_url: data.user.avatar_url || undefined,
              created_at: data.user.created_at,
            };
            setUser(userProfile);
            localStorage.setItem('pulsetriage_session', JSON.stringify(userProfile));
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Fallback to local session if network check fails
      }

      const savedUser = localStorage.getItem('pulsetriage_session');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem('pulsetriage_session');
        }
      }
      setIsLoading(false);
    }

    restoreSession();
  }, []);

  // Login — calls real API, validates against database
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      const userProfile: UserProfile = {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.full_name,
        role: data.user.role as UserRole,
        phone: data.user.phone || undefined,
        avatar_url: data.user.avatar_url || undefined,
        created_at: data.user.created_at,
      };

      setUser(userProfile);
      localStorage.setItem('pulsetriage_session', JSON.stringify(userProfile));
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  // Register new patient — calls real API
  const registerPatient = async (
    fullName: string,
    email: string,
    phone: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      const userProfile: UserProfile = {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.full_name,
        role: 'PATIENT',
        phone: data.user.phone || undefined,
        created_at: data.user.created_at,
      };

      setUser(userProfile);
      localStorage.setItem('pulsetriage_session', JSON.stringify(userProfile));
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pulsetriage_session');
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
  };

  const applyProfileUpdate = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('pulsetriage_session', JSON.stringify(profile));
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, registerPatient, logout, applyProfileUpdate }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
