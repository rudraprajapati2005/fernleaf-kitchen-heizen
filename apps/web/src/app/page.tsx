'use client';

import { useAuth } from '../features/auth/auth-provider';
import { LoginForm } from '../features/auth/login-form';
import { AppShell } from '../features/shell/app-shell';

export default function HomePage() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <main className="auth-state">Loading your workspace...</main>;
  }

  if (status === 'unauthenticated') {
    return <LoginForm />;
  }

  return <AppShell />;
}
