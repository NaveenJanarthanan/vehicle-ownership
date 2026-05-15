'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import VehicleCard from '@/components/VehicleCard';
import StatCard from '@/components/StatCard';
import InsightCard from '@/components/InsightCard';
import { EquityAreaChart, CostBreakdownPie } from '@/components/Charts';
import Link from 'next/link';
import type { Insight } from '@/lib/insights';
import { estimateCurrentValue } from '@/lib/calculations';

interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  color?: string | null;
  mileage: number;
  purchasePrice: number;
  purchaseDate: string;
  imageUrl?: string | null;
  loan?: { currentBalance: number; monthlyPayment: number; originalAmount: number; apr: number } | null;
  marketValues: { estimatedValue: number }[];
  insurancePolicies: { monthlyPremium: number }[];
  maintenanceRecords: { cost: number; date: string }[];
  modifications: { cost: number }[];
}

export default function DashboardPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/vehicles');
        if (res.ok) {
          const data = await res.json();
          setVehicles(data);

          // Fetch insights for each vehicle
          const allInsights: Insight[] = [];
          for (const v of data) {
            const iRes = await fetch(`/api/vehicles/${v.id}/insights`);
            if (iRes.ok) {
              const vi = await iRes.json();
              allInsights.push(...vi.map((i: Insight) => ({ ...i, _vehicleName: `${v.year} ${v.make} ${v.model}` })));
            }
          }
          setInsights(allInsights.sort((a, b) => b.confidence - a.confidence).slice(0, 6));
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalPortfolioValue = vehicles.reduce(
    (sum, v) => sum + (v.marketValues[0]?.estimatedValue ?? estimateCurrentValue(v.purchasePrice, new Date(v.purchaseDate))),
    0
  );
  const totalDebt = vehicles.reduce((sum, v) => sum + (v.loan?.currentBalance ?? 0), 0);
  const totalEquity = totalPortfolioValue - totalDebt;
  const totalMonthlyPayments = vehicles.reduce((sum, v) => sum + (v.loan?.monthlyPayment ?? 0), 0);
  const totalInsurance = vehicles.reduce(
    (sum, v) => sum + (v.insurancePolicies[0]?.monthlyPremium ?? 0),
    0
  );
  const totalMaintenance = vehicles.reduce(
    (sum, v) => sum + v.maintenanceRecords.reduce((s, r) => s + r.cost, 0),
    0
  );
  const totalMods = vehicles.reduce(
    (sum, v) => sum + v.modifications.reduce((s, m) => s + m.cost, 0),
    0
  );

  // Chart data
  const equityChartData = vehicles.map((v) => ({
    label: `${v.year} ${v.make}`,
    marketValue: v.marketValues[0]?.estimatedValue ?? estimateCurrentValue(v.purchasePrice, new Date(v.purchaseDate)),
    loanBalance: v.loan?.currentBalance ?? 0,
  }));

  const costBreakdownData = [
    { name: 'Loan Payments', value: totalMonthlyPayments * 12 },
    { name: 'Insurance', value: totalInsurance * 12 },
    { name: 'Maintenance', value: totalMaintenance },
    { name: 'Modifications', value: totalMods },
  ].filter((d) => d.value > 0);

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading your garage...</div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500">Your automotive portfolio at a glance</p>
        </div>
        <Link href="/vehicles/new" className="btn-primary">
          + Add Vehicle
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Portfolio Value"
          value={`$${totalPortfolioValue.toLocaleString()}`}
          subValue={`${vehicles.length} vehicle${vehicles.length !== 1 ? 's' : ''}`}
        />
        <StatCard
          label="Total Equity"
          value={`$${totalEquity.toLocaleString()}`}
          trend={totalEquity >= 0 ? 'up' : 'down'}
          subValue={totalEquity >= 0 ? 'Positive position' : 'Underwater'}
        />
        <StatCard
          label="Monthly Payments"
          value={`$${totalMonthlyPayments.toLocaleString()}`}
          subValue={`+ $${totalInsurance}/mo insurance`}
        />
        <StatCard
          label="Total Maintenance"
          value={`$${totalMaintenance.toLocaleString()}`}
          subValue={`$${totalMods.toLocaleString()} in mods`}
        />
      </div>

      {/* Charts Row */}
      {vehicles.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Equity by Vehicle</h3>
            <EquityAreaChart data={equityChartData} />
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Annual Cost Breakdown</h3>
            <CostBreakdownPie data={costBreakdownData} />
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {costBreakdownData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: ['#24a873', '#3b82f6', '#f59e0b', '#8b5cf6'][i] }}
                  />
                  {d.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vehicles */}
      <h2 className="text-lg font-semibold text-white mb-3">Your Vehicles</h2>
      {vehicles.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500 mb-4">No vehicles yet. Add your first one to get started.</p>
          <Link href="/vehicles/new" className="btn-primary">
            + Add Vehicle
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {vehicles.map((v) => {
            const mv = v.marketValues[0]?.estimatedValue ?? estimateCurrentValue(v.purchasePrice, new Date(v.purchaseDate));
            const equity = v.loan ? mv - v.loan.currentBalance : undefined;
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
                imageUrl={v.imageUrl}
                equity={equity}
                monthlyPayment={v.loan?.monthlyPayment}
                marketValue={mv}
              />
            );
          })}
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-white mb-3">Ownership Insights</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {insights.map((insight) => (
              <InsightCard key={insight.id} {...insight} />
            ))}
          </div>
        </>
      )}
    </Shell>
  );
}
