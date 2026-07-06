'use client';

import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-content flex-col items-center justify-between gap-4 px-6 py-7 sm:flex-row">
        <Link href="/" aria-label="ThriveAI home">
          <Logo />
        </Link>
        <span className="text-sm text-text-muted">
          © {new Date().getFullYear()} ThriveAI · A mentor that actually knows you.
        </span>
      </div>
    </footer>
  );
};
