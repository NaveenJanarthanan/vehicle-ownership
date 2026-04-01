'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Shell from '@/components/Shell';
import StatCard from '@/components/StatCard';
import { EquityAreaChart } from '@/components/Charts';
import {
  calculatePayoffProgress,
  calculateRemainingPayments,
  calculateInterestPaid,
  calculateTotalInterest,
  projectLoanBalance,
  projectMarketValue,
  calculateMonthlyDepreciation,
} from '@/lib/calculations';

interface Loan {
  originalAmount: number;
  currentBalance: number;
  apr: number;
  termMonths: number;
  monthlyPayment: number;
  startDate: string;
  lender?: string | null;
}

interface VehicleInfo {
  year: number;
  make: string;
  model: string;
  purchasePrice: number;
  purchaseDate: string;
  marketValues: { estimatedValue: number }[];
}

export default function LoanTrackerPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    originalAmount: 0,
    currentBalance: 0,
    apr: 0,
    termMonths: 60,
    monthlyPayment: 0,
    startDate: '',
    lender: '',
  });

  useEffect(() => {
    async function load() {
      const [lRes, vRes] = await Promise.all([
        fetch(`/api/vehicles/${id}/loan`),
        fetch(`/api/vehicles/${id}`),
      ]);
      if (lRes.ok) {
        const data = await lRes.json();
        if (data) {
          setLoan(data);
          setForm({
            originalAmount: data.originalAmount,
            currentBalance: data.currentBalance,
            apr: data.apr,
            termMonths: data.termMonths,
            monthlyPayment: data.monthlyPayment,
            startDate: data.startDate?.slice(0, 10) || '',
            lender: data.lender || '',
          });
        }
      }
      if (vRes.ok) setVehicle(await vRes.json());
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/vehicles/${id}/loan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setLoan(await res.json());
      setShowForm(false);
    }
  }

  if (loading) {
    return <Shell><div className="text-gray-500 text-center py-12">Loading...</div></Shell>;
  }

  const mv = vehicle?.marketValues?.[0]?.estimatedValue ?? vehicle?.purchasePrice ?? 0;

  // Projection chart: loan paydown vs market value over next 24 months
  const projectionData = loan
    ? Array.from({ length: 25 }, (_, i) => {
        const monthlyDep = vehicle
          ? calculateMonthlyDepreciation(vehicle.purchasePrice, mv, new Date(vehicle.purchaseDate))
          : 0;
        return {
          label: `+${i}mo`,
          loanBalance: projectLoanBalance(loan.currentBalance, loan.apr, loan.monthlyPayment, i),
          marketValue: projectMarketValue(mv, monthlyDep, i),
        };
      })
    : [];

  return (
    <Shell>
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-300 mb-2">
        ← Back to vehicle
      </button>
      <h1 className="text-2xl font-bold text-white mb-6">
        Loan Tracker
        {vehicle && (
          <span className="text-gray-500 font-normal text-lg ml-2">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </span>
        )}
      </h1>

      {!loan && !showForm ? (
        <div className="card p-8 text-center">
          <p className="text-gray-500 mb-4">No loan data for this vehicle.</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + Add Loan Details
          </button>
        </div>
      ) : showForm || !loan ? (
        <form onSubmit={handleSubmit} className="card p-6 max-w-2xl space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Original Loan Amount</label>
              <input type="number" step="0.01" value={form.originalAmount} onChange={(e) => setForm({ ...form, originalAmount: parseFloat(e.target.value) })} className="w-full" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Current Balance</label>
              <input type="number" step="0.01" value={form.currentBalance} onChange={(e) => setForm({ ...form, currentBalance: parseFloat(e.target.value) })} className="w-full" required />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">APR (%)</label>
              <input type="number" step="0.01" value={form.apr} onChange={(e) => setForm({ ...form, apr: parseFloat(e.target.value) })} className="w-full" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Term (months)</label>
              <input type="number" value={form.termMonths} onChange={(e) => setForm({ ...form, termMonths: parseInt(e.target.value) })} className="w-full" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Monthly Payment</label>
              <input type="number" step="0.01" value={form.monthlyPayment} onChange={(e) => setForm({ ...form, monthlyPayment: parseFloat(e.target.value) })} className="w-full" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Lender</label>
              <input type="text" value={form.lender} onChange={(e) => setForm({ ...form, lender: e.target.value })} className="w-full" placeholder="Optional" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">Save Loan</button>
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); }}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Payoff Progress"
              value={`${calculatePayoffProgress(loan.originalAmount, loan.currentBalance)}%`}
              subValue={`$${(loan.originalAmount - loan.currentBalance).toLocaleString()} paid`}
              trend="up"
            />
            <StatCard
              label="Remaining"
              value={`${calculateRemainingPayments(loan.currentBalance, loan.apr, loan.monthlyPayment)} mo`}
              subValue={`$${loan.currentBalance.toLocaleString()} left`}
            />
            <StatCard
              label="Interest Paid"
              value={`$${calculateInterestPaid(loan.originalAmount, loan.currentBalance, loan.monthlyPayment, new Date(loan.startDate)).toLocaleString()}`}
              subValue={`of $${calculateTotalInterest(loan.originalAmount, loan.monthlyPayment, loan.termMonths).toLocaleString()} total`}
              trend="down"
            />
            <StatCard
              label="Equity"
              value={`$${Math.abs(mv - loan.currentBalance).toLocaleString()}`}
              subValue={mv - loan.currentBalance >= 0 ? 'Positive' : 'Negative'}
              trend={mv - loan.currentBalance >= 0 ? 'up' : 'down'}
            />
          </div>

          {/* Payoff Progress Bar */}
          <div className="card p-5 mb-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Payoff Progress</span>
              <span className="text-white font-medium">
                {calculatePayoffProgress(loan.originalAmount, loan.currentBalance)}%
              </span>
            </div>
            <div className="w-full h-3 bg-surface-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-500"
                style={{ width: `${calculatePayoffProgress(loan.originalAmount, loan.currentBalance)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>$0</span>
              <span>${loan.originalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Projection Chart */}
          {projectionData.length > 0 && (
            <div className="card p-5 mb-6">
              <h3 className="text-sm font-medium text-gray-400 mb-3">24-Month Equity Projection</h3>
              <EquityAreaChart data={projectionData} />
              <p className="text-xs text-gray-500 mt-2">
                Green = projected market value, Red = projected loan balance. Where they cross is your break-even point.
              </p>
            </div>
          )}

          <div className="card p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-gray-400">Loan Details</h3>
              <button className="btn-secondary text-xs" onClick={() => setShowForm(true)}>Edit</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-500 block">Original Amount</span><span className="text-white">${loan.originalAmount.toLocaleString()}</span></div>
              <div><span className="text-gray-500 block">APR</span><span className="text-white">{loan.apr}%</span></div>
              <div><span className="text-gray-500 block">Term</span><span className="text-white">{loan.termMonths} months</span></div>
              <div><span className="text-gray-500 block">Monthly Payment</span><span className="text-white">${loan.monthlyPayment.toLocaleString()}</span></div>
              <div><span className="text-gray-500 block">Start Date</span><span className="text-white">{new Date(loan.startDate).toLocaleDateString()}</span></div>
              {loan.lender && <div><span className="text-gray-500 block">Lender</span><span className="text-white">{loan.lender}</span></div>}
            </div>
          </div>
        </>
      )}
    </Shell>
  );
}
