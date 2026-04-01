'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import { MaintenanceBarChart } from '@/components/Charts';

interface Record {
  id: string;
  date: string;
  type: string;
  description: string;
  cost: number;
  mileage: number;
  shop?: string | null;
}

const TYPES = ['oil-change', 'tires', 'brakes', 'fluid', 'inspection', 'repair', 'other'];

export default function MaintenancePage() {
  const { id } = useParams();
  const router = useRouter();
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'oil-change',
    description: '',
    cost: 0,
    mileage: 0,
    shop: '',
  });

  useEffect(() => {
    fetch(`/api/vehicles/${id}/maintenance`)
      .then((r) => r.json())
      .then(setRecords)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/vehicles/${id}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const newRecord = await res.json();
      setRecords([newRecord, ...records]);
      setShowForm(false);
      setForm({ date: new Date().toISOString().slice(0, 10), type: 'oil-change', description: '', cost: 0, mileage: 0, shop: '' });
    }
  }

  const total = records.reduce((s, r) => s + r.cost, 0);
  const byType: Record<string, number> = {};
  records.forEach((r) => { byType[r.type] = (byType[r.type] || 0) + r.cost; });
  const chartData = Object.entries(byType).map(([label, cost]) => ({ label: label.replace('-', ' '), cost }));

  return (
    <Shell>
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-300 mb-2">← Back</button>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Maintenance History</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">Total: <strong className="text-white">${total.toLocaleString()}</strong></span>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Record</button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 mb-6 space-y-4 max-w-2xl animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full">
                {TYPES.map((t) => <option key={t} value={t}>{t.replace('-', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full" placeholder="What was done?" required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cost ($)</label>
              <input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) })} className="w-full" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Mileage</label>
              <input type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: parseInt(e.target.value) })} className="w-full" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Shop</label>
              <input type="text" value={form.shop} onChange={(e) => setForm({ ...form, shop: e.target.value })} className="w-full" placeholder="Optional" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">Save</button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {chartData.length > 0 && (
        <div className="card p-5 mb-6">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Cost by Category</h3>
          <MaintenanceBarChart data={chartData} />
        </div>
      )}

      {loading ? (
        <div className="text-gray-500 text-center py-8">Loading...</div>
      ) : records.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">No maintenance records yet.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-800/50">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium hidden md:table-cell">Description</th>
                <th className="px-4 py-2 font-medium hidden sm:table-cell">Mileage</th>
                <th className="px-4 py-2 font-medium hidden lg:table-cell">Shop</th>
                <th className="px-4 py-2 font-medium text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-800">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-surface-800/30">
                  <td className="px-4 py-3 text-gray-300">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><span className="badge-blue capitalize">{r.type.replace('-', ' ')}</span></td>
                  <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{r.description}</td>
                  <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{r.mileage.toLocaleString()} mi</td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{r.shop || '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-200 font-medium">${r.cost.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-surface-800/30">
              <tr>
                <td colSpan={5} className="px-4 py-2 text-sm text-gray-500 font-medium">Total ({records.length} records)</td>
                <td className="px-4 py-2 text-right text-white font-semibold">${total.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Shell>
  );
}
