'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { auth } from '@/lib/firebase/firebaseConfig';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const NAV_LINKS = [
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Features', href: '/#features' },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsLoggedIn(true);
        setUserName(user.displayName ? user.displayName.split(' ')[0] : 'there');
      } else {
        setIsLoggedIn(false);
        setUserName('');
      }
    });

    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b transition-[border-color,background-color,box-shadow] duration-base ease-standard ${
        scrolled
          ? 'border-border bg-background/85 shadow-md backdrop-blur-md'
          : 'border-transparent bg-background/60 shadow-none backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto flex max-w-content items-center justify-between px-6 py-3.5">
        <Link href="/" aria-label="ThriveAI home" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/thriveai-logo.svg" width={168} height={32} alt="ThriveAI" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-sm text-text-muted transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2.5 md:flex">
          <ThemeToggle />
          {isLoggedIn ? (
            <>
              <span className="text-sm text-text-muted">
                Hi, <span className="font-medium text-foreground">{userName}</span>
              </span>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/coach">Coach</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/profile">Profile</Link>
              </Button>
              <Button variant="primary" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/sign-in">Sign in</Link>
              </Button>
              <Button asChild variant="primary" size="sm">
                <Link href="/auth/sign-up">Get started</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="inline-flex size-10 items-center justify-center rounded-md text-foreground hover:bg-muted md:hidden"
          aria-label="Toggle menu"
          onClick={() => setShowMobileMenu((v) => !v)}
        >
          {showMobileMenu ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {showMobileMenu && (
        <div className="border-t border-border bg-surface md:hidden">
          <nav className="mx-auto flex max-w-content flex-col gap-1 px-6 py-4">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="rounded-md px-2 py-2.5 text-sm text-text-body hover:bg-muted"
                onClick={() => setShowMobileMenu(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              <div className="flex items-center gap-2 px-2 py-1">
                <span className="text-xs text-text-muted">Theme</span>
                <ThemeToggle />
              </div>
              {isLoggedIn ? (
                <>
                  <Button asChild variant="secondary" size="default">
                    <Link href="/dashboard" onClick={() => setShowMobileMenu(false)}>
                      Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="default">
                    <Link href="/coach" onClick={() => setShowMobileMenu(false)}>
                      Coach
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="default">
                    <Link href="/profile" onClick={() => setShowMobileMenu(false)}>
                      Profile
                    </Link>
                  </Button>
                  <Button
                    variant="primary"
                    size="default"
                    onClick={() => {
                      handleSignOut();
                      setShowMobileMenu(false);
                    }}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="secondary" size="default">
                    <Link href="/auth/sign-in" onClick={() => setShowMobileMenu(false)}>
                      Sign in
                    </Link>
                  </Button>
                  <Button asChild variant="primary" size="default">
                    <Link href="/auth/sign-up" onClick={() => setShowMobileMenu(false)}>
                      Get started
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
