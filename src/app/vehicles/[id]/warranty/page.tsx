'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Shell from '@/components/Shell';

interface Warranty {
  id: string;
  type: string;
  provider?: string | null;
  expirationDate?: string | null;
  expirationMileage?: number | null;
  cost?: number | null;
}

const WARRANTY_TYPES = ['factory', 'extended', 'powertrain', 'bumper-to-bumper'];

export default function WarrantyPage() {
  const { id } = useParams();
  const router = useRouter();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'factory',
    provider: '',
    expirationDate: '',
    expirationMileage: 0,
    cost: 0,
  });

  useEffect(() => {
    fetch(`/api/vehicles/${id}/warranty`)
      .then((r) => r.json())
      .then(setWarranties)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/vehicles/${id}/warranty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        expirationDate: form.expirationDate || null,
        expirationMileage: form.expirationMileage || null,
        cost: form.cost || null,
      }),
    });
    if (res.ok) {
      const newW = await res.json();
      setWarranties([...warranties, newW]);
      setShowForm(false);
      setForm({ type: 'factory', provider: '', expirationDate: '', expirationMileage: 0, cost: 0 });
    }
  }

  function getStatus(w: Warranty) {
    const now = new Date();
    if (w.expirationDate && new Date(w.expirationDate) < now) return 'expired';
    return 'active';
  }

  return (
    <Shell>
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-300 mb-2">← Back</button>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Warranty Tracker</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Warranty</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 mb-6 max-w-2xl space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full">
                {WARRANTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Provider</label>
              <input type="text" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="w-full" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Expiration Date</label>
              <input type="date" value={form.expirationDate} onChange={(e) => setForm({ ...form, expirationDate: e.target.value })} className="w-full" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Expiry Mileage</label>
              <input type="number" value={form.expirationMileage} onChange={(e) => setForm({ ...form, expirationMileage: parseInt(e.target.value) })} className="w-full" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cost ($)</label>
              <input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) })} className="w-full" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">Save</button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-gray-500 text-center py-8">Loading...</div>
      ) : warranties.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">No warranties tracked yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {warranties.map((w) => {
            const status = getStatus(w);
            const daysLeft = w.expirationDate
              ? Math.max(0, Math.round((new Date(w.expirationDate).getTime() - Date.now()) / 86400000))
              : null;
            return (
              <div key={w.id} className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white capitalize">{w.type} Warranty</h3>
                  {status === 'active' ? (
                    <span className="badge-green">Active</span>
                  ) : (
                    <span className="badge-red">Expired</span>
                  )}
                </div>
                {w.provider && <p className="text-sm text-gray-400 mb-3">{w.provider}</p>}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {w.expirationDate && (
                    <div>
                      <span className="text-gray-500 block">Expires</span>
                      <span className="text-gray-200">{new Date(w.expirationDate).toLocaleDateString()}</span>
                      {daysLeft !== null && status === 'active' && (
                        <span className={`text-xs block ${daysLeft < 90 ? 'text-amber-400' : 'text-gray-500'}`}>
                          {daysLeft} days remaining
                        </span>
                      )}
                    </div>
                  )}
                  {w.expirationMileage && (
                    <div>
                      <span className="text-gray-500 block">Mileage Limit</span>
                      <span className="text-gray-200">{w.expirationMileage.toLocaleString()} mi</span>
                    </div>
                  )}
                  {w.cost && (
                    <div>
                      <span className="text-gray-500 block">Cost</span>
                      <span className="text-gray-200">${w.cost.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                {status === 'active' && daysLeft !== null && daysLeft < 90 && (
                  <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
                    ⚠ Expiring soon — schedule any needed warranty work now
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}
