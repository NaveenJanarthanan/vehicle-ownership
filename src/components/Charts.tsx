'use client';

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#24a873', '#46c28c', '#7cd9ae', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

interface ChartProps {
  data: Record<string, unknown>[];
  className?: string;
}

export function EquityAreaChart({ data, className }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#24a873" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#24a873" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorLoan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
          <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: '#2a2d3e' }} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: '#2a2d3e' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e2130', border: '1px solid #2a2d3e', borderRadius: '8px' }}
            labelStyle={{ color: '#9ca3af' }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
          />
          <Area type="monotone" dataKey="marketValue" stroke="#24a873" fill="url(#colorValue)" strokeWidth={2} name="Market Value" />
          <Area type="monotone" dataKey="loanBalance" stroke="#ef4444" fill="url(#colorLoan)" strokeWidth={2} name="Loan Balance" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CostBreakdownPie({ data, className }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#1e2130', border: '1px solid #2a2d3e', borderRadius: '8px' }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MaintenanceBarChart({ data, className }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
          <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: '#2a2d3e' }} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: '#2a2d3e' }} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e2130', border: '1px solid #2a2d3e', borderRadius: '8px' }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
          />
          <Bar dataKey="cost" fill="#24a873" radius={[4, 4, 0, 0]} name="Cost" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DepreciationChart({ data, className }: ChartProps) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id="colorDep" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
          <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: '#2a2d3e' }} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: '#2a2d3e' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e2130', border: '1px solid #2a2d3e', borderRadius: '8px' }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
          />
          <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="url(#colorDep)" strokeWidth={2} name="Value" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
