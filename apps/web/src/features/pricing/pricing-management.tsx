'use client';
import { useEffect, useState } from 'react';
import { apiRequest, ApiError } from '../../lib/api-client';
import { useAuth } from '../auth/auth-provider';
type Tier = { id: string; name: string; isDefault: boolean; isActive: boolean; derivationType: string | null };
export function PricingManagement() {
  const { can } = useAuth(); const [tiers, setTiers] = useState<Tier[]>([]); const [name, setName] = useState(''); const [error, setError] = useState<string | null>(null);
  async function load() { try { setTiers(await apiRequest<Tier[]>('/pricing/tiers')); } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Unable to load pricing tiers'); } }
  useEffect(() => { if (can('catalogue.read')) void load(); }, [can]);
  if (!can('catalogue.read')) return null;
  async function create() { try { await apiRequest('/pricing/tiers', { method: 'POST', body: JSON.stringify({ name, isDefault: tiers.length === 0 }) }); setName(''); await load(); } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Unable to create tier'); } }
  return <section className="management-card"><p className="eyebrow">Pricing</p><h2>Price tiers</h2>{error && <p className="form-error">{error}</p>}{can('catalogue.manage') && <div className="inline-form"><input placeholder="Standard" value={name} onChange={(e) => setName(e.target.value)} /><button onClick={() => void create()}>Add tier</button></div>}{tiers.map((tier) => <div className="data-row" key={tier.id}><div><strong>{tier.name}</strong><span>{tier.isDefault ? 'Default tier' : 'Company-assigned or fallback'} · {tier.derivationType ?? 'Explicit prices'}</span></div></div>)}</section>;
}
