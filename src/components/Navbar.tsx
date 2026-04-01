'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/vehicles', label: 'Vehicles', icon: '⊙' },
  { href: '/scenario', label: 'Simulator', icon: '⊘' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-950/90 backdrop-blur-md border-b border-surface-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm">
            G
          </div>
          <span className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors hidden sm:block">
            GarageIQ
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? 'bg-brand-600/10 text-brand-400'
                  : 'text-gray-400 hover:text-white hover:bg-surface-800'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {session?.user && (
            <>
              <span className="text-sm text-gray-400 hidden md:block">
                {session.user.name || session.user.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
