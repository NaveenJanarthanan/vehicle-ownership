interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export default function StatCard({ label, value, subValue, trend, className = '' }: StatCardProps) {
  return (
    <div className={`card p-4 ${className}`}>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subValue && (
        <p className={`text-xs mt-0.5 ${
          trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-500'
        }`}>
          {trend === 'up' && '↑ '}{trend === 'down' && '↓ '}{subValue}
        </p>
      )}
    </div>
  );
}
