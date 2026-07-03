'use client';

import Link from 'next/link';
import { ArrowRight, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/firebase/authContext';

const STATS: [string, string][] = [
  ['4-in-1', 'coaching areas'],
  ['24/7', 'always available'],
  ['100%', 'personalized'],
];

function Bubble({ who, children }: { who: 'coach' | 'me'; children: React.ReactNode }) {
  const me = who === 'me';
  return (
    <div
      className={[
        'max-w-[82%] rounded-lg px-3.5 py-2.5 text-sm leading-snug',
        me
          ? 'self-end rounded-br-xs bg-primary text-primary-foreground'
          : 'self-start rounded-bl-xs border border-border bg-surface-sunken text-text-body',
      ].join(' ')}
    >
      {children}
    </div>
  );
}

export const HeroSection = () => {
  const { user } = useAuth();

  return (
    <section id="hero" className="mx-auto max-w-content px-6 pb-16 pt-16 md:pt-20">
      <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <Badge tone="accent" dot>
            AI life coaching
          </Badge>
          <h1 className="mt-5 font-serif text-[2.75rem] font-semibold leading-[1.05] tracking-[-0.02em] text-foreground md:text-[3.5rem]">
            Elevate your potential.
            <br />
            <span className="text-accent">Transform your life.</span>
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-text-body">
            Personalized guidance to help you thrive in fitness, career, finances, and mental
            wellbeing — all in one calm, private place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Button asChild variant="primary" size="lg">
                <Link href="/dashboard">
                  Go to dashboard <ArrowRight className="size-[18px]" />
                </Link>
              </Button>
            ) : (
              <Button asChild variant="primary" size="lg">
                <Link href="/auth/sign-up">
                  Start coaching <ArrowRight className="size-[18px]" />
                </Link>
              </Button>
            )}
            <Button asChild variant="secondary" size="lg">
              <Link href="/#features">See how it works</Link>
            </Button>
          </div>
          <div className="mt-10 flex gap-8">
            {STATS.map(([n, l]) => (
              <div key={l}>
                <div className="font-mono text-2xl font-semibold text-foreground">{n}</div>
                <div className="text-sm text-text-muted">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-lg">
            <div className="mb-4 flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/thriveai-mark.svg" width={34} height={34} alt="" />
              <div>
                <div className="text-sm font-semibold text-foreground">Thrive Coach</div>
                <div className="text-xs text-success">● Online now</div>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <Bubble who="coach">Morning, Jordan. Ready for today&apos;s 30-minute session?</Bubble>
              <Bubble who="me">Yes — but my knee&apos;s a little sore.</Bubble>
              <Bubble who="coach">
                Got it. I&apos;ll swap in low-impact work and keep your streak going. 🔥 Day 12.
              </Bubble>
            </div>
          </div>
          <div className="absolute -bottom-5 -left-5 flex items-center gap-2.5 rounded-lg border border-border bg-surface px-4 py-3 shadow-md">
            <Flame className="size-5 text-mode-fitness" />
            <div>
              <div className="font-mono text-lg font-semibold leading-none text-foreground">
                12-day
              </div>
              <div className="text-xs text-text-muted">streak</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
