'use client';
import { useEffect, useState } from 'react';
import { apiRequest, ApiError } from '../../lib/api-client';
import { useAuth } from '../auth/auth-provider';
export function CompanyCalendar() {
  const { can } = useAuth(); const [companyId, setCompanyId] = useState(''); const [workingDays, setWorkingDays] = useState<number[]>([1,2,3,4,5]); const [date, setDate] = useState(''); const [error, setError] = useState<string | null>(null);
  useEffect(() => { void apiRequest<Array<{ id: string }>>('/companies').then((items) => setCompanyId(items[0]?.id ?? '')).catch((cause) => setError(cause instanceof ApiError ? cause.message : 'Unable to load companies')); }, []);
  if (!can('company.read') || !companyId) return null;
  async function saveDays() { try { await apiRequest(`/companies/${companyId}/calendar/working-days`, { method: 'PATCH', body: JSON.stringify({ workingDays }) }); } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Unable to save working days'); } }
  async function addHoliday() { try { await apiRequest(`/companies/${companyId}/calendar/holidays`, { method: 'POST', body: JSON.stringify({ date }) }); setDate(''); } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Unable to add holiday'); } }
  return <section className="management-card"><p className="eyebrow">Delivery calendar</p><h2>Working days & holidays</h2>{error && <p className="form-error">{error}</p>}<div className="inline-form">{[1,2,3,4,5,6,0].map((day) => <label key={day}><input type="checkbox" checked={workingDays.includes(day)} onChange={() => setWorkingDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day])} /> {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day]}</label>)}<button disabled={!can('company.manage')} onClick={() => void saveDays()}>Save days</button></div><div className="inline-form"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /><button disabled={!can('company.manage')} onClick={() => void addHoliday()}>Add holiday</button></div></section>;
}
