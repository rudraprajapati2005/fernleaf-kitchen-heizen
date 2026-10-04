'use client';

import { useEffect, useState } from 'react';
import { apiRequest, ApiError } from '../../lib/api-client';
import { useAuth } from '../auth/auth-provider';

type Dish = { id: string; name: string; isActive: boolean };
type Category = { id: string; name: string; displayOrder: number; isActive: boolean; dishes: Array<{ dishId: string; displayOrder: number; isActive: boolean; dish: Dish }> };

export function MenuCategoryManagement() {
  const { can } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  async function load() {
    try {
      const [categoryData, dishData] = await Promise.all([
        apiRequest<Category[]>('/menu/categories'),
        apiRequest<{ items: Dish[] }>('/catalogue/dishes?isActive=true&limit=100'),
      ]);
      setCategories(categoryData);
      setDishes(dishData.items);
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Unable to load menu categories'); }
  }
  useEffect(() => { if (can('catalogue.read')) void load(); }, [can]);
  if (!can('catalogue.read')) return null;
  async function create() {
    if (!name.trim()) return;
    try { await apiRequest('/menu/categories', { method: 'POST', body: JSON.stringify({ name, displayOrder: categories.length }) }); setName(''); await load(); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Unable to create category'); }
  }
  async function addDish(category: Category, dishId: string) {
    try { await apiRequest(`/menu/categories/${category.id}/dishes`, { method: 'POST', body: JSON.stringify({ dishId, displayOrder: category.dishes.length }) }); await load(); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Unable to add dish'); }
  }
  async function reorderCategory(index: number, direction: -1 | 1) {
    const next = [...categories];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const current = next[index];
    const replacement = next[target];
    if (!current || !replacement) return;
    next[index] = replacement;
    next[target] = current;
    try { await apiRequest('/menu/categories/order', { method: 'PATCH', body: JSON.stringify({ ids: next.map((item) => item.id) }) }); await load(); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Unable to reorder categories'); }
  }
  async function reorderDish(category: Category, index: number, direction: -1 | 1) {
    const next = [...category.dishes];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const current = next[index];
    const replacement = next[target];
    if (!current || !replacement) return;
    next[index] = replacement;
    next[target] = current;
    try { await apiRequest(`/menu/categories/${category.id}/dishes/order`, { method: 'PATCH', body: JSON.stringify({ ids: next.map((item) => item.dishId) }) }); await load(); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Unable to reorder dishes'); }
  }
  return <section className="management-card"><p className="eyebrow">Menu</p><h2>Categories</h2>{error && <p className="form-error">{error}</p>}{can('catalogue.manage') && <div className="inline-form"><input aria-label="New menu category" placeholder="Category name" value={name} onChange={(event) => setName(event.target.value)} /><button onClick={() => void create()}>Add category</button></div>}{categories.map((category, categoryIndex) => <div className="data-row" key={category.id}><div><strong>{category.name}</strong><span>{category.isActive ? 'Active' : 'Inactive'} · ordered {category.displayOrder + 1}</span>{category.dishes.map((membership, dishIndex) => <span key={membership.dishId}>{membership.displayOrder + 1}. {membership.dish.name} · {membership.isActive ? 'Active' : 'Inactive'} {can('catalogue.manage') && <><button aria-label="Move dish up" onClick={() => void reorderDish(category, dishIndex, -1)}>↑</button><button aria-label="Move dish down" onClick={() => void reorderDish(category, dishIndex, 1)}>↓</button></>}</span>)}</div>{can('catalogue.manage') && <><button aria-label="Move category up" onClick={() => void reorderCategory(categoryIndex, -1)}>↑</button><button aria-label="Move category down" onClick={() => void reorderCategory(categoryIndex, 1)}>↓</button><select aria-label={`Add dish to ${category.name}`} defaultValue="" onChange={(event) => { if (event.target.value) void addDish(category, event.target.value); }}><option value="">Add dish</option>{dishes.filter((dish) => !category.dishes.some((item) => item.dishId === dish.id)).map((dish) => <option key={dish.id} value={dish.id}>{dish.name}</option>)}</select></>}</div>)}</section>;
}
