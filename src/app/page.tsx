import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6">
          G
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Garage<span className="gradient-text">IQ</span>
        </h1>
        <p className="text-lg text-gray-400 mb-8">
          The automotive ownership intelligence platform.
          Track your vehicles, loans, maintenance, and get data-driven insights
          on whether to keep, sell, trade, or refinance.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/login" className="btn-primary text-base px-6 py-3">
            Sign In
          </Link>
          <Link href="/register" className="btn-secondary text-base px-6 py-3">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
