import Link from 'next/link';

interface VehicleCardProps {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  color?: string | null;
  mileage: number;
  equity?: number;
  monthlyPayment?: number;
  marketValue?: number;
}

export default function VehicleCard({
  id, year, make, model, trim, color, mileage, equity, monthlyPayment, marketValue,
}: VehicleCardProps) {
  return (
    <Link href={`/vehicles/${id}`} className="card-hover p-5 block animate-fade-in">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {year} {make} {model}
          </h3>
          {trim && <p className="text-sm text-gray-400">{trim}</p>}
        </div>
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white font-bold text-xs">
          {make.charAt(0)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500">Mileage</span>
          <p className="text-gray-200 font-medium">{mileage.toLocaleString()} mi</p>
        </div>
        {color && (
          <div>
            <span className="text-gray-500">Color</span>
            <p className="text-gray-200 font-medium">{color}</p>
          </div>
        )}
        {marketValue !== undefined && (
          <div>
            <span className="text-gray-500">Market Value</span>
            <p className="text-gray-200 font-medium">${marketValue.toLocaleString()}</p>
          </div>
        )}
        {equity !== undefined && (
          <div>
            <span className="text-gray-500">Equity</span>
            <p className={`font-semibold ${equity >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {equity >= 0 ? '+' : '-'}${Math.abs(equity).toLocaleString()}
            </p>
          </div>
        )}
        {monthlyPayment !== undefined && (
          <div>
            <span className="text-gray-500">Payment</span>
            <p className="text-gray-200 font-medium">${monthlyPayment.toLocaleString()}/mo</p>
          </div>
        )}
      </div>
    </Link>
  );
}
