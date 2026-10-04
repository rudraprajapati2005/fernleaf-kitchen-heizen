'use client';

import { useEffect, useState } from 'react';
import { apiRequest, ApiError } from '../../lib/api-client';
import { useAuth } from '../auth/auth-provider';

type Company = { id: string; name: string; billingContactName: string | null; billingContactEmail: string | null; emailDomains: Array<{ id: string; domain: string }>; deliveryAddresses: Array<{ id: string; label: string; addressLine1: string; city: string; postalCode: string; isActive: boolean }> };
export function CompanyManagement() {
  const { can } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [domain, setDomain] = useState('');
  const [error, setError] = useState<string | null>(null);
  async function load() { try { setCompanies(await apiRequest<Company[]>('/companies')); } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Unable to load companies'); } }
  useEffect(() => { if (can('company.read')) void load(); }, [can]);
  if (!can('company.read')) return null;
  async function addDomain(companyId: string) { try { await apiRequest(`/companies/${companyId}/domains`, { method: 'POST', body: JSON.stringify({ domain }) }); setDomain(''); await load(); } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Unable to add domain'); } }
  return <section className="management-card"><p className="eyebrow">Company settings</p><h2>Companies</h2>{error && <p className="form-error">{error}</p>}{companies.map((company) => <div className="data-row" key={company.id}><div><strong>{company.name}</strong><span>Billing: {company.billingContactName ?? 'Not configured'} · {company.billingContactEmail ?? '—'}</span><span>Domains: {company.emailDomains.map((item) => item.domain).join(', ') || 'None'}</span><span>Delivery addresses: {company.deliveryAddresses.filter((item) => item.isActive).map((item) => item.label).join(', ') || 'None'}</span></div>{can('company.manage') && <div className="inline-form"><input aria-label={`Add domain for ${company.name}`} placeholder="company.com" value={domain} onChange={(event) => setDomain(event.target.value)} /><button onClick={() => void addDomain(company.id)}>Add domain</button></div>}</div>)}</section>;
}
