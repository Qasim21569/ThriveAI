'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { User, Settings, LogOut, Menu, X, LayoutDashboard, TrendingUp } from 'lucide-react';
import { auth } from '@/lib/firebase/firebaseConfig';
import { useAuth } from '@/lib/firebase/authContext';
import { Avatar } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const NAV_LINKS = [
  { label: 'Today', href: '/today' },
  { label: 'Coach', href: '/coach' },
  { label: 'Brain', href: '/brain' },
];

/**
 * Persistent top nav for every authenticated app page (dashboard, coach,
 * progress, profile, settings). Distinct from components/landing/navbar.tsx,
 * which is the marketing-site header. Mounted once via app/(app)/layout.tsx
 * so no individual page needs its own back-button/header plumbing.
 */
export function AppNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  const displayName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-content items-center justify-between px-6 py-3">
        <Link href="/today" className="flex items-center" aria-label="ThriveAI home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/thriveai-logo.svg" width={150} height={28} alt="ThriveAI" />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={[
                  'rounded-md px-3.5 py-2 text-sm font-medium transition-colors duration-base ease-standard outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                  active
                    ? 'bg-primary-soft text-primary'
                    : 'text-text-muted hover:bg-muted hover:text-foreground',
                ].join(' ')}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <ThemeToggle />
          <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            aria-label="Account menu"
            aria-expanded={menuOpen}
          >
            <Avatar src={user?.photoURL} fallback={displayName} size="sm" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-border bg-surface p-1.5 shadow-lg animate-fade-in">
              <div className="mb-1 border-b border-border px-3 py-2">
                <p className="truncate text-sm font-medium text-foreground">{user?.displayName || 'Account'}</p>
                <p className="truncate text-xs text-text-muted">{user?.email}</p>
              </div>
              <Link
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text-body transition-colors hover:bg-muted"
              >
                <LayoutDashboard className="size-4" /> Dashboard
              </Link>
              <Link
                href="/progress"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text-body transition-colors hover:bg-muted"
              >
                <TrendingUp className="size-4" /> Progress
              </Link>
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text-body transition-colors hover:bg-muted"
              >
                <User className="size-4" /> Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-text-body transition-colors hover:bg-muted"
              >
                <Settings className="size-4" /> Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive-soft"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          )}
          </div>
        </div>

        <button
          className="inline-flex size-10 items-center justify-center rounded-md text-foreground hover:bg-muted md:hidden"
          aria-label="Toggle menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-surface md:hidden">
          <nav className="mx-auto flex max-w-content flex-col gap-1 px-6 py-4">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className={[
                  'rounded-md px-2 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
                  pathname === l.href ? 'bg-primary-soft text-primary' : 'text-text-body hover:bg-muted',
                ].join(' ')}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-1 border-t border-border pt-3">
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-2 py-2.5 text-sm text-text-body hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                Dashboard
              </Link>
              <Link
                href="/progress"
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-2 py-2.5 text-sm text-text-body hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                Progress
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-2 py-2.5 text-sm text-text-body hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-2 py-2.5 text-sm text-text-body hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="rounded-md px-2 py-2.5 text-left text-sm text-destructive hover:bg-destructive-soft"
              >
                Sign out
              </button>
              <div className="flex items-center gap-2 px-2 py-1">
                <span className="text-xs text-text-muted">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
