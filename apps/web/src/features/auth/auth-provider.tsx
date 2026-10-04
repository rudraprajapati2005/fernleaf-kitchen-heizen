'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiRequest, ApiError } from '../../lib/api-client';
import type { AuthUser } from './auth-types';
import { hasCapability, type Capability } from './capabilities';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  can: (capability: Capability) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleExpiredSession = () => {
      setUser(null);
      setStatus('unauthenticated');
      setError('Your session has expired. Please sign in again.');
    };
    window.addEventListener('auth:expired', handleExpiredSession);
    void apiRequest<{ user: AuthUser }>('/auth/me')
      .then(({ user: currentUser }) => {
        setUser(currentUser);
        setStatus('authenticated');
      })
      .catch(() => {
        setUser(null);
        setStatus('unauthenticated');
      });
    return () => window.removeEventListener('auth:expired', handleExpiredSession);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      error,
      can: (capability) => (user ? hasCapability(user.role, capability) : false),
      async login(email, password) {
        setError(null);
        try {
          const result = await apiRequest<{ user: AuthUser }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          });
          setUser(result.user);
          setStatus('authenticated');
        } catch (cause) {
          setStatus('unauthenticated');
          setError(cause instanceof ApiError ? cause.message : 'Unable to sign in');
          throw cause;
        }
      },
      async logout() {
        await apiRequest('/auth/logout', { method: 'POST' });
        setUser(null);
        setStatus('unauthenticated');
      },
    }),
    [error, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
