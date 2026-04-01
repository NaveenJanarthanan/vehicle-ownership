'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import VehicleCard from '@/components/VehicleCard';
import Link from 'next/link';

interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  color?: string | null;
  mileage: number;
  purchasePrice: number;
  loan?: { currentBalance: number; monthlyPayment: number } | null;
  marketValues: { estimatedValue: number }[];
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vehicles')
      .then((r) => r.json())
      .then(setVehicles)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">My Vehicles</h1>
        <Link href="/vehicles/new" className="btn-primary">+ Add Vehicle</Link>
      </div>

      {loading ? (
        <div className="text-gray-500 text-center py-12">Loading...</div>
      ) : vehicles.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 mb-4">No vehicles in your garage yet.</p>
          <Link href="/vehicles/new" className="btn-primary">+ Add Your First Vehicle</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((v) => {
            const mv = v.marketValues[0]?.estimatedValue;
            const equity = mv && v.loan ? mv - v.loan.currentBalance : undefined;
            return (
              <VehicleCard
                key={v.id}
                id={v.id}
                year={v.year}
                make={v.make}
                model={v.model}
                trim={v.trim}
                color={v.color}
                mileage={v.mileage}
                equity={equity}
                monthlyPayment={v.loan?.monthlyPayment}
                marketValue={mv}
              />
            );
          })}
        </div>
      )}
    </Shell>
  );
}
