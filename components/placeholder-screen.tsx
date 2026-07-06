'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PlaceholderScreenProps {
  eyebrow?: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  /** Tailwind classes for the icon tint + soft background, e.g. "text-mode-career bg-accent-soft" */
  iconClass?: string;
  /** Auto-redirect target and delay (ms). Omit to disable. */
  redirectTo?: string;
  redirectDelay?: number;
}

/**
 * On-brand empty / "coming soon" screen used by placeholder routes.
 * Warm, calm, minimal — a single soft-tinted icon, serif title, muted copy.
 */
export function PlaceholderScreen({
  eyebrow = 'Coming soon',
  title,
  description,
  Icon,
  iconClass = 'text-primary bg-primary-soft',
  redirectTo,
  redirectDelay = 5000,
}: PlaceholderScreenProps) {
  const router = useRouter();

  useEffect(() => {
    if (!redirectTo) return;
    const timer = setTimeout(() => router.push(redirectTo), redirectDelay);
    return () => clearTimeout(timer);
  }, [router, redirectTo, redirectDelay]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className={`mx-auto mb-5 flex size-16 items-center justify-center rounded-full ${iconClass}`}>
          <Icon className="size-7" />
        </div>

        <Badge tone="neutral" className="mx-auto mb-4">
          {eyebrow}
        </Badge>

        <h1 className="font-serif text-2xl font-semibold text-foreground">{title}</h1>
        <p className="mx-auto mt-2 max-w-sm text-text-body">{description}</p>

        <Button asChild variant="primary" className="mt-6">
          <Link href="/">
            <ArrowLeft className="size-4" /> Back to home
          </Link>
        </Button>

        {redirectTo && (
          <p className="mt-4 text-xs text-text-muted">
            Taking you back home in a few seconds…
          </p>
        )}
      </Card>
    </div>
  );
}
