'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Shell from '@/components/Shell';

interface Policy {
  id: string;
  provider: string;
  policyNumber?: string | null;
  monthlyPremium: number;
  deductible?: number | null;
  coverageType: string;
  startDate: string;
  endDate?: string | null;
}

export default function InsurancePage() {
  const { id } = useParams();
  const router = useRouter();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    provider: '',
    policyNumber: '',
    monthlyPremium: 0,
    deductible: 500,
    coverageType: 'full',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
  });

  useEffect(() => {
    fetch(`/api/vehicles/${id}/insurance`)
      .then((r) => r.json())
      .then(setPolicies)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/vehicles/${id}/insurance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        endDate: form.endDate || null,
      }),
    });
    if (res.ok) {
      const newP = await res.json();
      setPolicies([newP, ...policies]);
      setShowForm(false);
    }
  }

  const totalAnnual = policies.length > 0 ? policies[0].monthlyPremium * 12 : 0;

  return (
    <Shell>
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-300 mb-2">← Back</button>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Insurance Tracker</h1>
          {policies.length > 0 && (
            <p className="text-sm text-gray-500">
              Current: ${policies[0].monthlyPremium}/mo · ${totalAnnual.toLocaleString()}/year
            </p>
          )}
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Policy</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 mb-6 max-w-2xl space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Provider</label>
              <input type="text" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="w-full" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Policy Number</label>
              <input type="text" value={form.policyNumber} onChange={(e) => setForm({ ...form, policyNumber: e.target.value })} className="w-full" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Monthly Premium ($)</label>
              <input type="number" step="0.01" value={form.monthlyPremium} onChange={(e) => setForm({ ...form, monthlyPremium: parseFloat(e.target.value) })} className="w-full" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Deductible ($)</label>
              <input type="number" value={form.deductible} onChange={(e) => setForm({ ...form, deductible: parseInt(e.target.value) })} className="w-full" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Coverage</label>
              <select value={form.coverageType} onChange={(e) => setForm({ ...form, coverageType: e.target.value })} className="w-full">
                <option value="full">Full Coverage</option>
                <option value="liability">Liability Only</option>
                <option value="comprehensive">Comprehensive</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full" />
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
      ) : policies.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">No insurance policies tracked yet.</div>
      ) : (
        <div className="space-y-4">
          {policies.map((p, i) => (
            <div key={p.id} className={`card p-5 ${i === 0 ? 'border-brand-500/30' : ''}`}>
              {i === 0 && <span className="badge-green text-xs mb-2 inline-block">Current Policy</span>}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{p.provider}</h3>
                  {p.policyNumber && <p className="text-xs text-gray-500 font-mono">{p.policyNumber}</p>}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">${p.monthlyPremium}/mo</p>
                  <p className="text-xs text-gray-500">${(p.monthlyPremium * 12).toLocaleString()}/year</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                <div>
                  <span className="text-gray-500 block">Coverage</span>
                  <span className="text-gray-200 capitalize">{p.coverageType}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Deductible</span>
                  <span className="text-gray-200">{p.deductible ? `$${p.deductible.toLocaleString()}` : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Period</span>
                  <span className="text-gray-200">
                    {new Date(p.startDate).toLocaleDateString()}{p.endDate ? ` — ${new Date(p.endDate).toLocaleDateString()}` : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
