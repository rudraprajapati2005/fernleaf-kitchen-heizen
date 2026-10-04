'use client';

import { useAuth } from '../auth/auth-provider';

export function AppShell() {
  const { user, logout } = useAuth();
  return (
    <main className="dashboard">
      <aside className="sidebar">
        <p className="eyebrow">Fearleaf</p>
        <h2>Kitchen ops</h2>
        <nav>
          <span className="nav-active">Overview</span>
          <span>Orders</span>
          <span>Menu</span>
          <span>Team</span>
        </nav>
      </aside>
      <section className="dashboard-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Today&apos;s workspace</p>
            <h1>Good to see you, {user?.name ?? 'team'}.</h1>
          </div>
          <button className="logout-button" onClick={() => void logout()}>
            Sign out
          </button>
        </header>
        <section className="welcome-card">
          <p className="eyebrow">Operations dashboard</p>
          <h2>Your kitchen, in sync.</h2>
          <p className="muted">Your workspace is ready for the next service.</p>
        </section>
      </section>
    </main>
  );
}
