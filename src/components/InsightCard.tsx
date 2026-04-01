interface InsightCardProps {
  type: 'keep' | 'sell' | 'trade' | 'refinance';
  title: string;
  confidence: number;
  summary: string;
  reasoning: string[];
  metrics: Record<string, string | number>;
}

const typeConfig = {
  keep: { label: 'KEEP', color: 'emerald', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20', text: 'text-emerald-400' },
  sell: { label: 'SELL', color: 'red', bg: 'bg-red-500/10', ring: 'ring-red-500/20', text: 'text-red-400' },
  trade: { label: 'TRADE', color: 'amber', bg: 'bg-amber-500/10', ring: 'ring-amber-500/20', text: 'text-amber-400' },
  refinance: { label: 'REFINANCE', color: 'blue', bg: 'bg-blue-500/10', ring: 'ring-blue-500/20', text: 'text-blue-400' },
};

export default function InsightCard({ type, title, confidence, summary, reasoning, metrics }: InsightCardProps) {
  const cfg = typeConfig[type];

  return (
    <div className="card p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`badge ${cfg.bg} ${cfg.text} ring-1 ${cfg.ring}`}>
            {cfg.label}
          </span>
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        <div className="text-xs text-gray-500">
          {confidence}% confidence
        </div>
      </div>

      <p className="text-sm text-gray-300 mb-4">{summary}</p>

      {/* Metrics */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(metrics).map(([key, val]) => (
          <div key={key} className="bg-surface-800/50 rounded-lg px-3 py-1.5">
            <span className="text-xs text-gray-500 block">{key}</span>
            <span className="text-sm font-medium text-gray-200">{val}</span>
          </div>
        ))}
      </div>

      {/* Reasoning */}
      <details className="group">
        <summary className="text-sm text-brand-400 cursor-pointer hover:text-brand-300 transition-colors">
          Why this recommendation?
        </summary>
        <ul className="mt-2 space-y-1.5 pl-4">
          {reasoning.map((r, i) => (
            <li key={i} className="text-sm text-gray-400 list-disc">
              {r}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
