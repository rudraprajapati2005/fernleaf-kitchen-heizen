'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import { apiRequest, ApiError } from '../../lib/api-client';
import { useAuth } from '../auth/auth-provider';

type ReferenceType = 'allergens' | 'dietary-tags' | 'kitchen-stations';
interface ReferenceValue {
  id: string;
  name: string;
  isActive: boolean;
}
const lists: Array<{ type: ReferenceType; label: string }> = [
  { type: 'allergens', label: 'Allergens' },
  { type: 'dietary-tags', label: 'Dietary tags' },
  { type: 'kitchen-stations', label: 'Kitchen stations' },
];

export function ReferenceDataManagement() {
  const { can } = useAuth();
  const [values, setValues] = useState<Record<ReferenceType, ReferenceValue[]>>({
    allergens: [],
    'dietary-tags': [],
    'kitchen-stations': [],
  });
  const [draft, setDraft] = useState<Record<ReferenceType, string>>({
    allergens: '',
    'dietary-tags': '',
    'kitchen-stations': '',
  });
  const [error, setError] = useState<string | null>(null);
  const [dish, setDish] = useState({
    name: '',
    price: '',
    kitchenStationId: '',
    allergenIds: [] as string[],
    dietaryTagIds: [] as string[],
  });
  const [option, setOption] = useState({
    name: '',
    priceAdjustment: '',
    allergenIds: [] as string[],
    dietaryTagIds: [] as string[],
  });

  async function load(type: ReferenceType) {
    try {
      const data = await apiRequest<ReferenceValue[]>(`/reference-data/${type}?activeOnly=false`);
      setValues((current) => ({ ...current, [type]: data }));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to load reference data');
    }
  }
  useEffect(() => {
    if (can('catalogue.manage')) lists.forEach(({ type }) => void load(type));
  }, [can]);
  if (!can('catalogue.manage')) return null;

  async function add(type: ReferenceType) {
    if (!draft[type].trim()) return;
    try {
      await apiRequest(`/reference-data/${type}`, {
        method: 'POST',
        body: JSON.stringify({ name: draft[type] }),
      });
      setDraft((current) => ({ ...current, [type]: '' }));
      await load(type);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to save reference data');
    }
  }
  async function toggle(type: ReferenceType, value: ReferenceValue) {
    try {
      await apiRequest(`/reference-data/${type}/${value.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !value.isActive }),
      });
      await load(type);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to update reference data');
    }
  }
  const selectIds = (event: ChangeEvent<HTMLSelectElement>) =>
    Array.from(event.target.selectedOptions, (selected) => selected.value);
  async function createDish() {
    try {
      await apiRequest('/catalogue/dishes', { method: 'POST', body: JSON.stringify(dish) });
      setDish({ name: '', price: '', kitchenStationId: '', allergenIds: [], dietaryTagIds: [] });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to create dish');
    }
  }
  async function createOption() {
    try {
      await apiRequest('/catalogue/options', { method: 'POST', body: JSON.stringify(option) });
      setOption({ name: '', priceAdjustment: '', allergenIds: [], dietaryTagIds: [] });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Unable to create option');
    }
  }
  const active = (type: ReferenceType) => values[type].filter((value) => value.isActive);
  return (
    <section className="management-card">
      <p className="eyebrow">Catalogue setup</p>
      <h2>Reference data</h2>
      {error && <p className="form-error">{error}</p>}
      <div className="reference-grid">
        {lists.map(({ type, label }) => (
          <div className="reference-column" key={type}>
            <h3>{label}</h3>
            <div className="inline-form">
              <input
                aria-label={`New ${label}`}
                value={draft[type]}
                onChange={(event) => setDraft({ ...draft, [type]: event.target.value })}
                placeholder={`Add ${label.toLowerCase()}`}
              />
              <button onClick={() => void add(type)}>Add</button>
            </div>
            {values[type].map((value) => (
              <div className="data-row" key={value.id}>
                <span>{value.name}</span>
                <span>{value.isActive ? 'Active' : 'Inactive'}</span>
                <button onClick={() => void toggle(type, value)}>
                  {value.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="catalogue-drafts">
        <h3>Dish and option metadata</h3>
        <div className="inline-form">
          <input
            placeholder="Dish name"
            value={dish.name}
            onChange={(event) => setDish({ ...dish, name: event.target.value })}
          />
          <input
            placeholder="Price"
            inputMode="decimal"
            value={dish.price}
            onChange={(event) => setDish({ ...dish, price: event.target.value })}
          />
          <select
            value={dish.kitchenStationId}
            onChange={(event) => setDish({ ...dish, kitchenStationId: event.target.value })}
          >
            <option value="">Kitchen station</option>
            {active('kitchen-stations').map((value) => (
              <option key={value.id} value={value.id}>
                {value.name}
              </option>
            ))}
          </select>
          <select
            multiple
            aria-label="Dish allergens"
            value={dish.allergenIds}
            onChange={(event) => setDish({ ...dish, allergenIds: selectIds(event) })}
          >
            {active('allergens').map((value) => (
              <option key={value.id} value={value.id}>
                {value.name}
              </option>
            ))}
          </select>
          <select
            multiple
            aria-label="Dish dietary tags"
            value={dish.dietaryTagIds}
            onChange={(event) => setDish({ ...dish, dietaryTagIds: selectIds(event) })}
          >
            {active('dietary-tags').map((value) => (
              <option key={value.id} value={value.id}>
                {value.name}
              </option>
            ))}
          </select>
          <button onClick={() => void createDish()}>Create dish</button>
        </div>
        <div className="inline-form">
          <input
            placeholder="Option name"
            value={option.name}
            onChange={(event) => setOption({ ...option, name: event.target.value })}
          />
          <input
            placeholder="Price adjustment"
            inputMode="decimal"
            value={option.priceAdjustment}
            onChange={(event) => setOption({ ...option, priceAdjustment: event.target.value })}
          />
          <select
            multiple
            aria-label="Option allergens"
            value={option.allergenIds}
            onChange={(event) => setOption({ ...option, allergenIds: selectIds(event) })}
          >
            {active('allergens').map((value) => (
              <option key={value.id} value={value.id}>
                {value.name}
              </option>
            ))}
          </select>
          <select
            multiple
            aria-label="Option dietary tags"
            value={option.dietaryTagIds}
            onChange={(event) => setOption({ ...option, dietaryTagIds: selectIds(event) })}
          >
            {active('dietary-tags').map((value) => (
              <option key={value.id} value={value.id}>
                {value.name}
              </option>
            ))}
          </select>
          <button onClick={() => void createOption()}>Create option</button>
        </div>
      </div>
    </section>
  );
}
