'use client';

import { useEffect, useState } from 'react';
import { apiRequest, ApiError } from '../../lib/api-client';
import { useAuth } from '../auth/auth-provider';

type Ref = { id: string; name: string };
type Company = { id: string; name: string };
type Employee = {
  id: string; name: string; email: string | null; companyId: string;
  canChooseOwnDeliveryAddress: boolean; canChangeDeliveryTime: boolean; canChangePackaging: boolean;
  allergies: Ref[]; dietaryPreferences: Ref[];
};

export function EmployeeManagement() {
  const { can } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [allergens, setAllergens] = useState<Ref[]>([]);
  const [dietaryTags, setDietaryTags] = useState<Ref[]>([]);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const [employeeData, companyData, allergenData, dietaryData] = await Promise.all([
        apiRequest<Employee[]>('/employees'),
        apiRequest<Company[]>('/companies'),
        apiRequest<Ref[]>('/reference-data/allergens'),
        apiRequest<Ref[]>('/reference-data/dietary-tags'),
      ]);
      setEmployees(employeeData);
      setCompanies(companyData);
      setAllergens(allergenData);
      setDietaryTags(dietaryData);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to load employees');
    }
  }

  useEffect(() => { if (can('employee.read')) void load(); }, [can]);
  if (!can('employee.read')) return null;

  async function save() {
    if (!selected) return;
    try {
      await apiRequest(`/employees/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: selected.name,
          email: selected.email ?? undefined,
          companyId: selected.companyId,
          canChooseOwnDeliveryAddress: selected.canChooseOwnDeliveryAddress,
          canChangeDeliveryTime: selected.canChangeDeliveryTime,
          canChangePackaging: selected.canChangePackaging,
          allergenIds: selected.allergies.map((item) => item.id),
          dietaryPreferenceIds: selected.dietaryPreferences.map((item) => item.id),
        }),
      });
      setSelected(null);
      await load();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to save employee');
    }
  }

  const toggleRef = (key: 'allergies' | 'dietaryPreferences', ref: Ref) => {
    if (!selected) return;
    const current = selected[key];
    const next = current.some((item) => item.id === ref.id)
      ? current.filter((item) => item.id !== ref.id)
      : [...current, ref];
    setSelected({ ...selected, [key]: next });
  };

  return <section className="management-card">
    <p className="eyebrow">People</p>
    <h2>Employee profiles</h2>
    {error && <p className="form-error">{error}</p>}
    <div className="data-list">
      {employees.map((employee) => <div className="data-row" key={employee.id}>
        <div><strong>{employee.name}</strong><span>{employee.email ?? 'No email'} · {companies.find((company) => company.id === employee.companyId)?.name ?? 'Unknown company'}</span><span>Allergies: {employee.allergies.map((item) => item.name).join(', ') || 'None'} · Dietary: {employee.dietaryPreferences.map((item) => item.name).join(', ') || 'None'}</span></div>
        {can('employee.manage') && <button onClick={() => setSelected(employee)}>Edit profile</button>}
      </div>)}
    </div>
    {selected && can('employee.manage') && <div className="management-card">
      <h3>Edit {selected.name}</h3>
      <div className="inline-form"><input value={selected.name} onChange={(event) => setSelected({ ...selected, name: event.target.value })} /><input value={selected.email ?? ''} placeholder="Email" onChange={(event) => setSelected({ ...selected, email: event.target.value })} /><select value={selected.companyId} onChange={(event) => setSelected({ ...selected, companyId: event.target.value })}>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></div>
      <p>Ordering permissions</p>
      {([
        ['canChooseOwnDeliveryAddress', 'Choose own delivery address'],
        ['canChangeDeliveryTime', 'Change delivery time'],
        ['canChangePackaging', 'Change packaging'],
      ] as const).map(([key, label]) => <label key={key}><input type="checkbox" checked={selected[key]} onChange={(event) => setSelected({ ...selected, [key]: event.target.checked })} /> {label}</label>)}
      <p>Allergies</p><div className="inline-form">{allergens.map((ref) => <label key={ref.id}><input type="checkbox" checked={selected.allergies.some((item) => item.id === ref.id)} onChange={() => toggleRef('allergies', ref)} /> {ref.name}</label>)}</div>
      <p>Dietary preferences</p><div className="inline-form">{dietaryTags.map((ref) => <label key={ref.id}><input type="checkbox" checked={selected.dietaryPreferences.some((item) => item.id === ref.id)} onChange={() => toggleRef('dietaryPreferences', ref)} /> {ref.name}</label>)}</div>
      <button onClick={() => void save()}>Save employee</button>
    </div>}
  </section>;
}
