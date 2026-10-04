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
    try { setError(null); await apiRequest('/menu/categories', { method: 'POST', body: JSON.stringify({ name: name.trim() }) }); setName(''); await load(); }
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
  return <section className="management-card menu-management">
    <div className="management-heading"><div><p className="eyebrow">Menu structure</p><h2>Categories</h2><p className="muted">Organize the dishes your teams can order by service-friendly collections.</p></div></div>
    {error && <p className="form-error">{error}</p>}
    {can('catalogue.manage') && <div className="category-create"><input aria-label="New menu category" placeholder="New category name" value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void create(); }} /><button type="button" onClick={() => void create()}>Add category</button></div>}
    <div className="category-list">{categories.map((category, categoryIndex) => <article className="category-card" key={category.id}>
      <header className="category-header"><div><strong>{category.name}</strong><span className={`status-dot ${category.isActive ? 'is-active' : ''}`}>{category.isActive ? 'Active' : 'Inactive'}</span></div>{can('catalogue.manage') && <div className="row-actions"><button type="button" aria-label="Move category up" onClick={() => void reorderCategory(categoryIndex, -1)}>↑</button><button type="button" aria-label="Move category down" onClick={() => void reorderCategory(categoryIndex, 1)}>↓</button></div>}</header>
      <div className="category-dishes">{category.dishes.length === 0 && <p className="muted">No dishes in this category yet.</p>}{category.dishes.map((membership, dishIndex) => <div className="category-dish" key={membership.dishId}><span className="dish-order">{membership.displayOrder + 1}</span><div><strong>{membership.dish.name}</strong><span>{membership.isActive ? 'Available' : 'Inactive'}</span></div>{can('catalogue.manage') && <div className="row-actions"><button type="button" aria-label="Move dish up" onClick={() => void reorderDish(category, dishIndex, -1)}>↑</button><button type="button" aria-label="Move dish down" onClick={() => void reorderDish(category, dishIndex, 1)}>↓</button></div>}</div>)}</div>
      {can('catalogue.manage') && <select className="category-add-dish" aria-label={`Add dish to ${category.name}`} defaultValue="" onChange={(event) => { if (event.target.value) void addDish(category, event.target.value); }}><option value="">Add a dish to this category</option>{dishes.filter((dish) => !category.dishes.some((item) => item.dishId === dish.id)).map((dish) => <option key={dish.id} value={dish.id}>{dish.name}</option>)}</select>}
    </article>)}</div>
  </section>;
}
