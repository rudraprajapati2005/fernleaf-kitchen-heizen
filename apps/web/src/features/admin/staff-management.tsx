'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { apiRequest, ApiError } from '../../lib/api-client';
import { useAuth } from '../auth/auth-provider';
import type { StaffRole } from '../auth/auth-types';
import { EditDialog } from '../../components/ui';

interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: StaffRole;
  isActive: boolean;
}

const roles: StaffRole[] = ['ADMIN', 'KITCHEN', 'DISPATCH', 'DRIVER'];

export function StaffManagement() {
  const { can } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'KITCHEN' as StaffRole,
  });
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadStaff = useCallback(async () => {
    try {
      setStaff(
        await apiRequest<StaffMember[]>(
          `/staff?search=${encodeURIComponent(search)}${role ? `&role=${role}` : ''}`,
        ),
      );
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to load staff accounts');
    }
  }, [role, search]);

  useEffect(() => {
    if (can('staff.manage')) void loadStaff();
  }, [can, loadStaff]);

  if (!can('staff.manage')) return null;

  async function createStaff(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await apiRequest('/staff', { method: 'POST', body: JSON.stringify(form) });
      setForm({ name: '', email: '', password: '', role: 'KITCHEN' });
      setMessage('Staff account created.');
      await loadStaff();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to create staff account');
    }
  }

  async function updateStaff() {
    if (!editing) return;
    try {
      await apiRequest(`/staff/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editing.name,
          email: editing.email,
          role: editing.role,
          isActive: editing.isActive,
        }),
      });
      setEditing(null);
      setMessage('Staff account updated.');
      await loadStaff();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to update staff account');
    }
  }

  async function toggleStaff(member: StaffMember) {
    try {
      await apiRequest(`/staff/${member.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !member.isActive }),
      });
      await loadStaff();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to update staff account');
    }
  }

  return (
    <section className="management-card">
      <div className="management-heading">
        <div>
          <p className="eyebrow">Staff accounts</p>
          <h2>Team access</h2>
        </div>
        <div className="filters">
          <input
            aria-label="Search staff"
            placeholder="Search staff"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            aria-label="Filter by role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="">All roles</option>
            {roles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>
      <form className="inline-form" onSubmit={createStaff}>
        <input
          required
          minLength={2}
          placeholder="Name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <input
          required
          minLength={8}
          type="password"
          placeholder="Temporary password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <select
          value={form.role}
          onChange={(event) => setForm({ ...form, role: event.target.value as StaffRole })}
        >
          {roles.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button type="submit">Create staff</button>
      </form>
      {error && <p className="form-error">{error}</p>}
      {message && <p className="form-success">{message}</p>}
      {editing && (
        <EditDialog
          title={`Edit ${editing.name}`}
          description="Review the account details before saving them."
          onCancel={() => setEditing(null)}
          onSave={() => void updateStaff()}
        >
          <div className="dialog-form">
            <label>Name<input required value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} /></label>
            <label>Email<input required type="email" value={editing.email} onChange={(event) => setEditing({ ...editing, email: event.target.value })} /></label>
            <label>Role<select value={editing.role} onChange={(event) => setEditing({ ...editing, role: event.target.value as StaffRole })}>{roles.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          </div>
        </EditDialog>
      )}
      <div className="data-list">
        {staff.map((member) => (
          <div className="data-row" key={member.id}>
            <div>
              <strong>{member.name}</strong>
              <span>{member.email}</span>
            </div>
            <span>{member.role}</span>
            <span>{member.isActive ? 'Active' : 'Inactive'}</span>
            <div className="row-actions">
              <button onClick={() => setEditing(member)}>Edit</button>
              <button onClick={() => void toggleStaff(member)}>
                {member.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
