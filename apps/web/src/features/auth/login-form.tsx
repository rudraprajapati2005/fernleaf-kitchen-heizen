'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from './auth-provider';

export function LoginForm() {
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);
    if (!email.trim() || !email.includes('@') || password.length < 8) {
      setValidationError('Enter a valid email and a password with at least 8 characters.');
      return;
    }
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch {
      // The provider exposes the API error to the form.
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-panel">
        <p className="eyebrow">Fearleaf Kitchen</p>
        <h1>Welcome back.</h1>
        <p className="muted">Sign in to coordinate every service with confidence.</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Work email
            <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Password
            <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {(validationError ?? error) && <p className="form-error">{validationError ?? error}</p>}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in to dashboard'}
          </button>
        </form>
      </div>
      <div className="login-art">
        <span>Built for the rhythm of your kitchen.</span>
      </div>
    </main>
  );
}
