'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import StatCard from '@/components/StatCard';
import InsightCard from '@/components/InsightCard';
import { EquityAreaChart, MaintenanceBarChart, DepreciationChart } from '@/components/Charts';
import {
  calculateEquity,
  calculatePayoffProgress,
  calculateMonthlyDepreciation,
  calculateDepreciation,
  calculateAnnualDepreciationRate,
  calculateWarrantyRemaining,
  calculateMonthlyOwnershipCost,
  calculateRemainingPayments,
} from '@/lib/calculations';
import Link from 'next/link';
import type { Insight } from '@/lib/insights';

interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  vin?: string | null;
  mileage: number;
  annualMiles: number;
  purchasePrice: number;
  purchaseDate: string;
  color?: string | null;
  loan?: {
    originalAmount: number;
    currentBalance: number;
    apr: number;
    termMonths: number;
    monthlyPayment: number;
    startDate: string;
    lender?: string | null;
  } | null;
  warranties: Array<{
    id: string;
    type: string;
    provider?: string | null;
    expirationDate?: string | null;
    expirationMileage?: number | null;
  }>;
  maintenanceRecords: Array<{
    id: string;
    date: string;
    type: string;
    description: string;
    cost: number;
    mileage: number;
    shop?: string | null;
  }>;
  insurancePolicies: Array<{
    id: string;
    provider: string;
    monthlyPremium: number;
    coverageType: string;
  }>;
  modifications: Array<{
    id: string;
    name: string;
    category: string;
    cost: number;
    date: string;
  }>;
  marketValues: Array<{
    id: string;
    estimatedValue: number;
    source: string;
    fetchedAt: string;
  }>;
}

export default function VehicleDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMarket, setFetchingMarket] = useState(false);

  useEffect(() => {
    async function load() {
      const [vRes, iRes] = await Promise.all([
        fetch(`/api/vehicles/${id}`),
        fetch(`/api/vehicles/${id}/insights`),
      ]);
      if (vRes.ok) setVehicle(await vRes.json());
      if (iRes.ok) setInsights(await iRes.json());
      setLoading(false);
    }
    load();
  }, [id]);

  async function fetchMarketValues() {
    setFetchingMarket(true);
    const res = await fetch(`/api/vehicles/${id}/market-value`, { method: 'POST' });
    if (res.ok) {
      // Reload vehicle data
      const vRes = await fetch(`/api/vehicles/${id}`);
      if (vRes.ok) setVehicle(await vRes.json());
    }
    setFetchingMarket(false);
  }

  if (loading || !vehicle) {
    return (
      <Shell>
        <div className="text-gray-500 text-center py-12">Loading vehicle...</div>
      </Shell>
    );
  }

  const v = vehicle;
  const latestMV = v.marketValues[0]?.estimatedValue ?? v.purchasePrice * 0.85;
  const equity = v.loan ? calculateEquity(latestMV, v.loan.currentBalance) : latestMV;
  const payoff = v.loan ? calculatePayoffProgress(v.loan.originalAmount, v.loan.currentBalance) : 100;
  const depreciation = calculateDepreciation(v.purchasePrice, latestMV);
  const depRate = calculateAnnualDepreciationRate(v.purchasePrice, latestMV, new Date(v.purchaseDate));
  const monthlyDep = calculateMonthlyDepreciation(v.purchasePrice, latestMV, new Date(v.purchaseDate));
  const monthlyInsurance = v.insurancePolicies[0]?.monthlyPremium ?? 0;
  const totalMaintenance = v.maintenanceRecords.reduce((s, r) => s + r.cost, 0);
  const totalMods = v.modifications.reduce((s, m) => s + m.cost, 0);
  const remainingPayments = v.loan ? calculateRemainingPayments(v.loan.currentBalance, v.loan.apr, v.loan.monthlyPayment) : 0;
  const monthlyOwnership = calculateMonthlyOwnershipCost(
    v.loan?.monthlyPayment ?? 0,
    monthlyInsurance,
    totalMaintenance / Math.max(1, v.maintenanceRecords.length > 0 ? 1 : 1),
    monthlyDep
  );

  // Chart data for depreciation over time
  const depChartData = v.marketValues
    .slice()
    .reverse()
    .map((mv) => ({
      label: new Date(mv.fetchedAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      value: mv.estimatedValue,
    }));

  // Maintenance chart by type
  const maintByType: Record<string, number> = {};
  v.maintenanceRecords.forEach((r) => {
    maintByType[r.type] = (maintByType[r.type] || 0) + r.cost;
  });
  const maintChartData = Object.entries(maintByType).map(([label, cost]) => ({ label, cost }));

  // Sub-navigation items
  const subNav = [
    { href: `/vehicles/${v.id}/loan`, label: 'Loan', badge: v.loan ? `$${v.loan.currentBalance.toLocaleString()}` : 'Add' },
    { href: `/vehicles/${v.id}/maintenance`, label: 'Maintenance', badge: `${v.maintenanceRecords.length}` },
    { href: `/vehicles/${v.id}/warranty`, label: 'Warranty', badge: `${v.warranties.length}` },
    { href: `/vehicles/${v.id}/insurance`, label: 'Insurance', badge: v.insurancePolicies.length > 0 ? `$${monthlyInsurance}/mo` : 'Add' },
    { href: `/vehicles/${v.id}/modifications`, label: 'Mods', badge: `$${totalMods.toLocaleString()}` },
  ];

  return (
    <Shell>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-300 mb-2">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-white">
            {v.year} {v.make} {v.model}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            {v.trim && <span className="text-sm text-gray-400">{v.trim}</span>}
            {v.color && <span className="badge-blue">{v.color}</span>}
            <span className="text-sm text-gray-500">{v.mileage.toLocaleString()} mi</span>
          </div>
        </div>
        <button
          onClick={fetchMarketValues}
          className="btn-secondary text-xs"
          disabled={fetchingMarket}
        >
          {fetchingMarket ? 'Fetching...' : '↻ Refresh Market Value'}
        </button>
      </div>

      {/* Sub-navigation */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {subNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-800/50 border border-surface-700 hover:border-surface-600 transition-colors text-sm whitespace-nowrap"
          >
            <span className="text-gray-300">{item.label}</span>
            <span className="text-xs text-gray-500">{item.badge}</span>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Market Value"
          value={`$${latestMV.toLocaleString()}`}
          subValue={v.marketValues[0] ? `via ${v.marketValues[0].source}` : 'Estimated'}
        />
        <StatCard
          label="Equity"
          value={`$${Math.abs(equity).toLocaleString()}`}
          trend={equity >= 0 ? 'up' : 'down'}
          subValue={equity >= 0 ? 'Positive equity' : 'Underwater'}
        />
        <StatCard
          label="Depreciation"
          value={`$${depreciation.toLocaleString()}`}
          subValue={`${depRate}% per year`}
          trend="down"
        />
        <StatCard
          label="Monthly Cost"
          value={`$${Math.round(monthlyOwnership).toLocaleString()}`}
          subValue="All-in ownership"
        />
      </div>

      {v.loan && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Loan Balance" value={`$${v.loan.currentBalance.toLocaleString()}`} subValue={`${payoff}% paid off`} />
          <StatCard label="Monthly Payment" value={`$${v.loan.monthlyPayment.toLocaleString()}`} subValue={`${v.loan.apr}% APR`} />
          <StatCard label="Remaining" value={`${remainingPayments} months`} subValue={v.loan.lender || ''} />
          <StatCard label="Monthly Insurance" value={`$${monthlyInsurance}`} subValue={v.insurancePolicies[0]?.provider || 'N/A'} />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {depChartData.length > 1 && (
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Market Value History</h3>
            <DepreciationChart data={depChartData} />
          </div>
        )}
        {maintChartData.length > 0 && (
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Maintenance by Category</h3>
            <MaintenanceBarChart data={maintChartData} />
          </div>
        )}
      </div>

      {/* Warranty Status */}
      {v.warranties.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Warranty Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {v.warranties.map((w) => {
              const wr = calculateWarrantyRemaining(
                w.expirationDate ? new Date(w.expirationDate) : null,
                w.expirationMileage ?? null,
                v.mileage
              );
              return (
                <div key={w.id} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white capitalize">{w.type}</span>
                    {wr.isExpired ? (
                      <span className="badge-red">Expired</span>
                    ) : (
                      <span className="badge-green">Active</span>
                    )}
                  </div>
                  {w.provider && <p className="text-xs text-gray-500 mb-1">{w.provider}</p>}
                  <div className="flex gap-4 text-xs text-gray-400">
                    {wr.daysRemaining !== null && <span>{wr.daysRemaining} days left</span>}
                    {wr.milesRemaining !== null && <span>{wr.milesRemaining.toLocaleString()} mi left</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Maintenance */}
      {v.maintenanceRecords.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Recent Maintenance</h2>
            <Link href={`/vehicles/${v.id}/maintenance`} className="text-sm text-brand-400 hover:text-brand-300">
              View all →
            </Link>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-800/50">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium hidden sm:table-cell">Description</th>
                  <th className="px-4 py-2 font-medium text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800">
                {v.maintenanceRecords.slice(0, 5).map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 text-gray-300">
                      {new Date(r.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="badge-blue capitalize">{r.type.replace('-', ' ')}</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 hidden sm:table-cell">{r.description}</td>
                    <td className="px-4 py-2.5 text-right text-gray-200 font-medium">
                      ${r.cost.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modifications */}
      {v.modifications.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">
              Modifications <span className="text-sm text-gray-500 font-normal">(${totalMods.toLocaleString()} invested)</span>
            </h2>
            <Link href={`/vehicles/${v.id}/modifications`} className="text-sm text-brand-400 hover:text-brand-300">
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {v.modifications.slice(0, 4).map((m) => (
              <div key={m.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{m.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{m.category.replace('-', ' ')}</p>
                </div>
                <span className="text-sm font-medium text-gray-300">${m.cost.toLocaleString()}</span>
              </div>
            ))}
          </div>
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
