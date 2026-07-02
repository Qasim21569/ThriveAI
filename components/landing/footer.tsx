'use client';

import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-content flex-col items-center justify-between gap-4 px-6 py-7 sm:flex-row">
        <Link href="/" aria-label="ThriveAI home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/thriveai-logo.svg" width={148} height={28} alt="ThriveAI" />
        </Link>
        <span className="text-sm text-text-muted">
          © {new Date().getFullYear()} ThriveAI · Elevate your potential.
        </span>
      </div>
    </footer>
  );
};
