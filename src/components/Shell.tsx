'use client';

import { ReactNode } from 'react';
import Navbar from './Navbar';

export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-950">
      <Navbar />
      <main className="pt-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
