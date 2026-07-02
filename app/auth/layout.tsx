'use client';

import Link from 'next/link';

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/thriveai-logo.svg" width={156} height={30} alt="ThriveAI" />
        </Link>
      </div>

      {/* Main content */}
      {children}
    </div>
  );
}
