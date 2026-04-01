'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Shell from '@/components/Shell';

interface Mod {
  id: string;
  name: string;
  category: string;
  cost: number;
  date: string;
  description?: string | null;
  shop?: string | null;
}

const CATEGORIES = [
  'performance', 'appearance', 'interior', 'wheels-tires',
  'suspension', 'exhaust', 'lighting', 'audio', 'other',
];

export default function ModificationsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [mods, setMods] = useState<Mod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: 'performance',
    cost: 0,
    date: new Date().toISOString().slice(0, 10),
    description: '',
    shop: '',
  });

  useEffect(() => {
    fetch(`/api/vehicles/${id}/modifications`)
      .then((r) => r.json())
      .then(setMods)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/vehicles/${id}/modifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const newMod = await res.json();
      setMods([newMod, ...mods]);
      setShowForm(false);
      setForm({ name: '', category: 'performance', cost: 0, date: new Date().toISOString().slice(0, 10), description: '', shop: '' });
    }
  }

  const total = mods.reduce((s, m) => s + m.cost, 0);
  const byCat: Record<string, { count: number; cost: number }> = {};
  mods.forEach((m) => {
    if (!byCat[m.category]) byCat[m.category] = { count: 0, cost: 0 };
    byCat[m.category].count++;
    byCat[m.category].cost += m.cost;
  });

  return (
    <Shell>
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-300 mb-2">← Back</button>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Modifications</h1>
          <p className="text-sm text-gray-500">${total.toLocaleString()} total invested · {mods.length} mods</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Mod</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 mb-6 max-w-2xl space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name</label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full" placeholder="e.g. Catback Exhaust" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace('-', ' / ')}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cost ($)</label>
              <input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) })} className="w-full" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Shop</label>
              <input type="text" value={form.shop} onChange={(e) => setForm({ ...form, shop: e.target.value })} className="w-full" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">Save</button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Category breakdown */}
      {Object.keys(byCat).length > 0 && (
        <div className="flex flex-wrap gap-3 mb-6">
          {Object.entries(byCat).map(([cat, data]) => (
            <div key={cat} className="card px-4 py-2">
              <span className="text-xs text-gray-500 capitalize block">{cat.replace('-', ' / ')}</span>
              <span className="text-sm font-medium text-white">${data.cost.toLocaleString()}</span>
              <span className="text-xs text-gray-500 ml-1">({data.count})</span>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-gray-500 text-center py-8">Loading...</div>
      ) : mods.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">No modifications tracked yet.</div>
      ) : (
        <div className="space-y-3">
          {mods.map((m) => (
            <div key={m.id} className="card p-4 flex items-start justify-between">
              <div>
                <h3 className="font-medium text-white">{m.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge-blue capitalize text-xs">{m.category.replace('-', ' / ')}</span>
                  <span className="text-xs text-gray-500">{new Date(m.date).toLocaleDateString()}</span>
                  {m.shop && <span className="text-xs text-gray-500">· {m.shop}</span>}
                </div>
                {m.description && <p className="text-sm text-gray-400 mt-1">{m.description}</p>}
              </div>
              <span className="text-lg font-semibold text-white">${m.cost.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
