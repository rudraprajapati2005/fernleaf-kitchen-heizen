'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { ApiError, apiRequest } from '../../lib/api-client';
import { CapabilityGate } from '../auth/capability-gate';
import { useAuth } from '../auth/auth-provider';

type Ref = { id: string; name: string; isActive: boolean };
type Dish = {
  id: string; name: string; description: string | null; image: string | null; sku: string;
  temperature: 'HOT' | 'COLD'; costPrice: string; minimumOrderQuantity: number | null; isActive: boolean;
  allergens: Ref[]; dietaryTags: Ref[]; kitchenStation: Ref | null;
};
type Option = { id: string; name: string; cost: string; isActive: boolean; allergens: Ref[]; dietaryTags: Ref[] };
type Page<T> = { items: T[]; page: number; totalPages: number; total: number };

const blankDish = { name: '', description: '', image: '', sku: '', temperature: 'HOT', costPrice: '', minimumOrderQuantity: '', kitchenStationId: '', allergenIds: [] as string[], dietaryTagIds: [] as string[] };
const blankOption = { name: '', cost: '', allergenIds: [] as string[], dietaryTagIds: [] as string[] };

export function CatalogueManagement() {
  const { can } = useAuth();
  const [dishes, setDishes] = useState<Page<Dish> | null>(null);
  const [options, setOptions] = useState<Page<Option> | null>(null);
  const [refs, setRefs] = useState<Record<string, Ref[]>>({});
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('true');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dish, setDish] = useState(blankDish);
  const [option, setOption] = useState(blankOption);
  const [editingDish, setEditingDish] = useState<string | null>(null);
  const [editingOption, setEditingOption] = useState<string | null>(null);

  async function load() {
    try {
      const suffix = `search=${encodeURIComponent(search)}&isActive=${active}`;
      const [dishPage, optionPage] = await Promise.all([
        apiRequest<Page<Dish>>(`/catalogue/dishes?${suffix}`),
        apiRequest<Page<Option>>(`/catalogue/options?${suffix}`),
      ]);
      setDishes(dishPage);
      setOptions(optionPage);
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Unable to load catalogue'); }
  }
  useEffect(() => {
    if (!can('catalogue.read')) return;
    void Promise.all(['allergens', 'dietary-tags', 'kitchen-stations'].map(async (type) => {
      const values = await apiRequest<Ref[]>(`/reference-data/${type}?activeOnly=true`);
      setRefs((current) => ({ ...current, [type]: values }));
    })).then(load).catch((cause) => setError(cause instanceof ApiError ? cause.message : 'Unable to load catalogue'));
    // load is stable for this component and intentionally follows the filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [can, search, active]);
  if (!can('catalogue.read')) return null;

  const ids = (event: ChangeEvent<HTMLSelectElement>) => Array.from(event.target.selectedOptions, (item) => item.value);
  const names = (items: Ref[]) => items.map((item) => item.name).join(', ') || 'None';
  async function save(path: string, body: unknown) {
    try { await apiRequest(path, { method: editingDish || editingOption ? 'PATCH' : 'POST', body: JSON.stringify(body) }); setNotice('Catalogue saved'); setEditingDish(null); setEditingOption(null); setDish(blankDish); setOption(blankOption); await load(); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Unable to save catalogue item'); }
  }
  async function toggle(kind: 'dishes' | 'options', item: Dish | Option) {
    if (!window.confirm(`${item.isActive ? 'Deactivate' : 'Activate'} ${item.name}?`)) return;
    try { await apiRequest(`/catalogue/${kind}/${item.id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive: !item.isActive }) }); await load(); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Unable to update status'); }
  }
  const canManage = can('catalogue.manage');
  return <CapabilityGate capability="catalogue.read"><section className="management-card catalogue-card">
    <div className="management-heading"><div><p className="eyebrow">Catalogue</p><h2>Dishes & options</h2></div><div className="filters"><input aria-label="Search catalogue" placeholder="Search name or SKU" value={search} onChange={(event) => setSearch(event.target.value)} /><select aria-label="Catalogue status" value={active} onChange={(event) => setActive(event.target.value)}><option value="true">Active</option><option value="false">Inactive</option><option value="">All</option></select></div></div>
    {error && <p className="form-error">{error}</p>}{notice && <p className="form-success">{notice}</p>}
    {canManage && <div className="catalogue-editor">
      <h3>{editingDish ? 'Edit dish' : 'New dish'}</h3>
      <div className="inline-form"><input placeholder="Name" value={dish.name} onChange={(e) => setDish({ ...dish, name: e.target.value })} /><input placeholder="SKU" value={dish.sku} onChange={(e) => setDish({ ...dish, sku: e.target.value })} /><select value={dish.temperature} onChange={(e) => setDish({ ...dish, temperature: e.target.value })}><option value="HOT">Hot</option><option value="COLD">Cold</option></select><input placeholder="Cost price" inputMode="decimal" value={dish.costPrice} onChange={(e) => setDish({ ...dish, costPrice: e.target.value })} /><input placeholder="MOQ (optional)" inputMode="numeric" value={dish.minimumOrderQuantity} onChange={(e) => setDish({ ...dish, minimumOrderQuantity: e.target.value })} /><select aria-label="Dish kitchen station" value={dish.kitchenStationId} onChange={(e) => setDish({ ...dish, kitchenStationId: e.target.value })}><option value="">Station</option>{(refs['kitchen-stations'] ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select multiple aria-label="Dish allergens" value={dish.allergenIds} onChange={(e) => setDish({ ...dish, allergenIds: ids(e) })}>{(refs.allergens ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select multiple aria-label="Dish dietary tags" value={dish.dietaryTagIds} onChange={(e) => setDish({ ...dish, dietaryTagIds: ids(e) })}>{(refs['dietary-tags'] ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button onClick={() => void save(editingDish ? `/catalogue/dishes/${editingDish}` : '/catalogue/dishes', { ...dish, minimumOrderQuantity: dish.minimumOrderQuantity ? Number(dish.minimumOrderQuantity) : undefined })}>{editingDish ? 'Save dish' : 'Add dish'}</button></div>
      <h3>{editingOption ? 'Edit option' : 'New option'}</h3><div className="inline-form"><input placeholder="Option name" value={option.name} onChange={(e) => setOption({ ...option, name: e.target.value })} /><input placeholder="Cost" inputMode="decimal" value={option.cost} onChange={(e) => setOption({ ...option, cost: e.target.value })} /><select multiple aria-label="Option allergens" value={option.allergenIds} onChange={(e) => setOption({ ...option, allergenIds: ids(e) })}>{(refs.allergens ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><select multiple aria-label="Option dietary tags" value={option.dietaryTagIds} onChange={(e) => setOption({ ...option, dietaryTagIds: ids(e) })}>{(refs['dietary-tags'] ?? []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button onClick={() => void save(editingOption ? `/catalogue/options/${editingOption}` : '/catalogue/options', option)}>{editingOption ? 'Save option' : 'Add option'}</button></div>
    </div>}
    <h3>Dishes</h3><div className="catalogue-table">{dishes?.items.map((item) => <div className="data-row" key={item.id}><div><strong>{item.name}</strong><span>{item.sku} · {item.temperature.toLowerCase()} · {item.costPrice} · MOQ {item.minimumOrderQuantity ?? '—'}</span><span>Allergens: {names(item.allergens)} · Dietary: {names(item.dietaryTags)} · Station: {item.kitchenStation?.name ?? '—'}</span></div>{canManage && <>    <button onClick={() => { setEditingDish(item.id); setDish({ ...dish, name: item.name, description: item.description ?? '', image: item.image ?? '', sku: item.sku, temperature: item.temperature, costPrice: item.costPrice, minimumOrderQuantity: item.minimumOrderQuantity?.toString() ?? '', kitchenStationId: item.kitchenStation?.id ?? '', allergenIds: item.allergens.map((ref) => ref.id), dietaryTagIds: item.dietaryTags.map((ref) => ref.id) }); }}>Edit</button><button onClick={() => void toggle('dishes', item)}>{item.isActive ? 'Deactivate' : 'Activate'}</button></>}</div>) ?? <p className="muted">No dishes match your filters.</p>}</div>
    <h3>Options</h3><div className="catalogue-table">{options?.items.map((item) => <div className="data-row" key={item.id}><div><strong>{item.name}</strong><span>{item.cost} · Allergens: {names(item.allergens)} · Dietary: {names(item.dietaryTags)}</span></div>{canManage && <>    <button onClick={() => { setEditingOption(item.id); setOption({ ...option, name: item.name, cost: item.cost, allergenIds: item.allergens.map((ref) => ref.id), dietaryTagIds: item.dietaryTags.map((ref) => ref.id) }); }}>Edit</button><button onClick={() => void toggle('options', item)}>{item.isActive ? 'Deactivate' : 'Activate'}</button></>}</div>) ?? <p className="muted">No options match your filters.</p>}</div>
  </section></CapabilityGate>;
}
