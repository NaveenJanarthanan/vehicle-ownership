'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Shell from '@/components/Shell';

export default function NewVehiclePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    make: '',
    model: '',
    trim: '',
    vin: '',
    mileage: 0,
    annualMiles: 12000,
    purchasePrice: 0,
    purchaseDate: new Date().toISOString().slice(0, 10),
    color: '',
  });

  function update(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/vehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const vehicle = await res.json();
      router.push(`/vehicles/${vehicle.id}`);
    }
    setLoading(false);
  }

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-white mb-6">Add New Vehicle</h1>

      <form onSubmit={handleSubmit} className="card p-6 max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Year</label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => update('year', parseInt(e.target.value))}
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Make</label>
            <input
              type="text"
              value={form.make}
              onChange={(e) => update('make', e.target.value)}
              className="w-full"
              placeholder="e.g. BMW"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Model</label>
            <input
              type="text"
              value={form.model}
              onChange={(e) => update('model', e.target.value)}
              className="w-full"
              placeholder="e.g. M3 Competition"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Trim</label>
            <input
              type="text"
              value={form.trim}
              onChange={(e) => update('trim', e.target.value)}
              className="w-full"
              placeholder="e.g. xDrive"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">VIN</label>
            <input
              type="text"
              value={form.vin}
              onChange={(e) => update('vin', e.target.value)}
              className="w-full"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Color</label>
            <input
              type="text"
              value={form.color}
              onChange={(e) => update('color', e.target.value)}
              className="w-full"
              placeholder="e.g. Alpine White"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Current Mileage</label>
            <input
              type="number"
              value={form.mileage}
              onChange={(e) => update('mileage', parseInt(e.target.value))}
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Annual Miles</label>
            <input
              type="number"
              value={form.annualMiles}
              onChange={(e) => update('annualMiles', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Purchase Price ($)</label>
            <input
              type="number"
              value={form.purchasePrice}
              onChange={(e) => update('purchasePrice', parseFloat(e.target.value))}
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Purchase Date</label>
            <input
              type="date"
              value={form.purchaseDate}
              onChange={(e) => update('purchaseDate', e.target.value)}
              className="w-full"
              required
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Adding...' : 'Add Vehicle'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.back()}>
            Cancel
          </button>
        </div>
      </form>
    </Shell>
  );
}
