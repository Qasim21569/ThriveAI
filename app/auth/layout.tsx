'use client';

import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Logo in top left */}
      <div className="absolute left-6 top-6 z-10">
        <Link href="/" aria-label="ThriveAI home">
          <Logo />
        </Link>
      </div>

      {/* Main content */}
      {children}
    </div>
  );
}
