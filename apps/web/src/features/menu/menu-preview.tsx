'use client';
import { useState } from 'react';
import { apiRequest, ApiError } from '../../lib/api-client';
import { useAuth } from '../auth/auth-provider';
type Preview = { tier: { name: string } | null; categories: Array<{ name: string; dishes: Array<{ name: string; price: string; optionGroups: Array<{ name: string; options: Array<{ name: string; price: string }> }> }> }> };
export function MenuPreview() {
  const { can } = useAuth(); const [employeeId, setEmployeeId] = useState(''); const [preview, setPreview] = useState<Preview | null>(null); const [error, setError] = useState<string | null>(null);
  if (!can('employee.read')) return null;
  async function previewMenu() { try { setPreview(await apiRequest<Preview>(`/menu/employees/${employeeId}?secret=true`)); } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Unable to preview menu'); } }
  return <section className="management-card"><p className="eyebrow">Reviewer tool</p><h2>Preview menu as employee</h2>{error && <p className="form-error">{error}</p>}<div className="inline-form"><input placeholder="Employee ID" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} /><button onClick={() => void previewMenu()}>Preview</button></div>{preview && <div><p>Tier: {preview.tier?.name ?? 'No valid pricing tier'}</p>{preview.categories.map((category) => <div key={category.name}><h3>{category.name}</h3>{category.dishes.map((dish) => <div className="data-row" key={dish.name}><strong>{dish.name} · ${dish.price}</strong><span>{dish.optionGroups.map((group) => `${group.name}: ${group.options.map((option) => `${option.name} $${option.price}`).join(', ')}`).join(' · ')}</span></div>)}</div>)}</div>}</section>;
}
