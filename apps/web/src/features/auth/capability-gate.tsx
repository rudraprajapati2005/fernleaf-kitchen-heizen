'use client';

import type { ReactNode } from 'react';
import { useAuth } from './auth-provider';
import type { Capability } from './capabilities';

export function CapabilityGate({
  capability,
  children,
  fallback = <UnauthorizedNotice />,
}: Readonly<{ capability: Capability; children: ReactNode; fallback?: ReactNode }>) {
  const { can } = useAuth();
  return can(capability) ? children : fallback;
}

export function UnauthorizedNotice() {
  return (
    <section className="welcome-card">
      <p className="eyebrow">Access restricted</p>
      <h2>You don&apos;t have access to this area.</h2>
      <p className="muted">Ask an administrator if you need access to this workspace.</p>
    </section>
  );
}
