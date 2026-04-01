'use client';

import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { EquityAreaChart } from '@/components/Charts';
import {
  projectLoanBalance,
  projectMarketValue,
  calculateMonthlyDepreciation,
  calculateEquity,
  calculateMonthlyOwnershipCost,
} from '@/lib/calculations';

interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  purchasePrice: number;
  purchaseDate: string;
  mileage: number;
  annualMiles: number;
  loan?: {
    currentBalance: number;
    apr: number;
    monthlyPayment: number;
  } | null;
  marketValues: { estimatedValue: number }[];
  insurancePolicies: { monthlyPremium: number }[];
  maintenanceRecords: { cost: number }[];
}

export default function ScenarioPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);

  // Scenario inputs
  const [extraPayment, setExtraPayment] = useState(0);
  const [newApr, setNewApr] = useState(0);
  const [monthsAhead, setMonthsAhead] = useState(12);
  const [depRateOverride, setDepRateOverride] = useState(0);

  useEffect(() => {
    fetch('/api/vehicles')
      .then((r) => r.json())
      .then((data) => {
        setVehicles(data);
        if (data.length > 0) {
          setSelectedId(data[0].id);
          if (data[0].loan) setNewApr(data[0].loan.apr);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const vehicle = vehicles.find((v) => v.id === selectedId);

  if (loading) {
    return <Shell><div className="text-gray-500 text-center py-12">Loading...</div></Shell>;
  }

  if (!vehicle) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold text-white mb-4">Scenario Simulator</h1>
        <div className="card p-8 text-center text-gray-500">
          Add vehicles first to run scenarios.
        </div>
      </Shell>
    );
  }

  const mv = vehicle.marketValues[0]?.estimatedValue ?? vehicle.purchasePrice * 0.85;
  const currentBalance = vehicle.loan?.currentBalance ?? 0;
  const currentApr = vehicle.loan?.apr ?? 0;
  const monthlyPayment = (vehicle.loan?.monthlyPayment ?? 0) + extraPayment;
  const monthlyInsurance = vehicle.insurancePolicies[0]?.monthlyPremium ?? 0;
  const totalMaintenance = vehicle.maintenanceRecords.reduce((s, r) => s + r.cost, 0);
  const baseDep = calculateMonthlyDepreciation(vehicle.purchasePrice, mv, new Date(vehicle.purchaseDate));
  const monthlyDep = depRateOverride > 0 ? (mv * depRateOverride / 100 / 12) : baseDep;

  // Current scenario (no changes)
  const currentProjection = Array.from({ length: monthsAhead + 1 }, (_, i) => ({
    label: `+${i}mo`,
    marketValue: projectMarketValue(mv, baseDep, i),
    loanBalance: vehicle.loan
      ? projectLoanBalance(currentBalance, currentApr, vehicle.loan.monthlyPayment, i)
      : 0,
  }));

  // Modified scenario
  const modifiedProjection = Array.from({ length: monthsAhead + 1 }, (_, i) => ({
    label: `+${i}mo`,
    marketValue: projectMarketValue(mv, monthlyDep, i),
    loanBalance: vehicle.loan
      ? projectLoanBalance(currentBalance, newApr || currentApr, monthlyPayment, i)
      : 0,
  }));

  const currentEquityEnd = calculateEquity(
    currentProjection[monthsAhead].marketValue,
    currentProjection[monthsAhead].loanBalance
  );
  const modifiedEquityEnd = calculateEquity(
    modifiedProjection[monthsAhead].marketValue,
    modifiedProjection[monthsAhead].loanBalance
  );
  const equityDiff = modifiedEquityEnd - currentEquityEnd;

  const currentMonthlyCost = calculateMonthlyOwnershipCost(
    vehicle.loan?.monthlyPayment ?? 0,
    monthlyInsurance,
    totalMaintenance,
    baseDep
  );
  const modifiedMonthlyCost = calculateMonthlyOwnershipCost(
    monthlyPayment,
    monthlyInsurance,
    totalMaintenance,
    monthlyDep
  );

  return (
    <Shell>
      <h1 className="text-2xl font-bold text-white mb-2">Scenario Simulator</h1>
      <p className="text-sm text-gray-500 mb-6">
        Model &quot;what if&quot; scenarios to see how changes affect your equity and costs
      </p>

      {/* Vehicle selector */}
      <div className="mb-6">
        <select
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            const v = vehicles.find((v) => v.id === e.target.value);
            if (v?.loan) setNewApr(v.loan.apr);
          }}
          className="w-full max-w-md"
        >
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.year} {v.make} {v.model}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="card p-5 space-y-5">
          <h3 className="font-semibold text-white">Adjust Parameters</h3>

          <div>
            <label className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Extra Monthly Payment</span>
              <span className="text-brand-400">${extraPayment}</span>
            </label>
            <input
              type="range"
              min={0}
              max={1000}
              step={25}
              value={extraPayment}
              onChange={(e) => setExtraPayment(parseInt(e.target.value))}
              className="w-full accent-brand-500"
            />
          </div>

          <div>
            <label className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Refinance APR (%)</span>
              <span className="text-brand-400">{newApr}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={15}
              step={0.25}
              value={newApr}
              onChange={(e) => setNewApr(parseFloat(e.target.value))}
              className="w-full accent-brand-500"
            />
          </div>

          <div>
            <label className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Projection Period</span>
              <span className="text-brand-400">{monthsAhead} months</span>
            </label>
            <input
              type="range"
              min={6}
              max={60}
              step={6}
              value={monthsAhead}
              onChange={(e) => setMonthsAhead(parseInt(e.target.value))}
              className="w-full accent-brand-500"
            />
          </div>

          <div>
            <label className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Depreciation Rate Override (%/yr)</span>
              <span className="text-brand-400">{depRateOverride || 'Auto'}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={25}
              step={1}
              value={depRateOverride}
              onChange={(e) => setDepRateOverride(parseInt(e.target.value))}
              className="w-full accent-brand-500"
            />
            <p className="text-xs text-gray-600 mt-0.5">0 = use historical rate</p>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Comparison Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Path</p>
              <p className="text-xl font-bold text-white">
                ${Math.abs(currentEquityEnd).toLocaleString()}
              </p>
              <p className={`text-xs ${currentEquityEnd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {currentEquityEnd >= 0 ? 'Positive' : 'Negative'} equity at +{monthsAhead}mo
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Monthly cost: ${Math.round(currentMonthlyCost).toLocaleString()}
              </p>
            </div>
            <div className="card p-4 border-brand-500/30">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Modified Scenario</p>
              <p className="text-xl font-bold text-white">
                ${Math.abs(modifiedEquityEnd).toLocaleString()}
              </p>
              <p className={`text-xs ${modifiedEquityEnd >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {modifiedEquityEnd >= 0 ? 'Positive' : 'Negative'} equity at +{monthsAhead}mo
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Monthly cost: ${Math.round(modifiedMonthlyCost).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Delta */}
          <div className={`card p-4 ${equityDiff >= 0 ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Equity Difference</span>
              <span className={`text-lg font-bold ${equityDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {equityDiff >= 0 ? '+' : '-'}${Math.abs(Math.round(equityDiff)).toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {equityDiff > 0
                ? `The modified scenario puts you $${Math.round(equityDiff).toLocaleString()} ahead after ${monthsAhead} months.`
                : equityDiff < 0
                ? `The modified scenario costs $${Math.abs(Math.round(equityDiff)).toLocaleString()} more vs. current path.`
                : 'No change from current trajectory.'}
            </p>
          </div>

          {/* Charts */}
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Current Trajectory</h3>
            <EquityAreaChart data={currentProjection} />
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Modified Scenario</h3>
            <EquityAreaChart data={modifiedProjection} />
          </div>

          {/* Insight summary */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Scenario Analysis</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {extraPayment > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-brand-400 mt-0.5">•</span>
                  Extra $${extraPayment}/mo accelerates payoff and builds equity {Math.round(extraPayment * monthsAhead * 0.8)} faster in principal reduction.
                </li>
              )}
              {newApr !== currentApr && newApr > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-brand-400 mt-0.5">•</span>
                  {newApr < currentApr
                    ? `Refinancing from ${currentApr}% to ${newApr}% saves approximately $${Math.round((currentApr - newApr) / 100 / 12 * currentBalance * monthsAhead)} over ${monthsAhead} months.`
                    : `Higher rate of ${newApr}% increases interest cost vs. current ${currentApr}%.`}
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="text-brand-400 mt-0.5">•</span>
                Projected market value in {monthsAhead} months: ${modifiedProjection[monthsAhead].marketValue.toLocaleString()}.
              </li>
              {vehicle.loan && (
                <li className="flex items-start gap-2">
                  <span className="text-brand-400 mt-0.5">•</span>
                  Projected loan balance: ${modifiedProjection[monthsAhead].loanBalance.toLocaleString()}.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </Shell>
  );
}
