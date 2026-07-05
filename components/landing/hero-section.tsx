'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/firebase/authContext';

// ─── constants ───────────────────────────────────────────────────────────────

const EASE = [0.4, 0, 0.2, 1] as const;
const STEP = 0.28; // --duration-slow

/** Each hero element fades in + rises 6 px, 280 ms, staggered 280 ms apart */
function heroVariant(step: number) {
  return {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: STEP, ease: EASE, delay: step * STEP },
  };
}

// Headline stagger: each line is 60 ms after the previous, all starting after eyebrow
const LINE_BASE_DELAY = STEP; // eyebrow is step 0
const LINE_STAGGER = 0.06;

const STATS: { value: string; label: string; numeric: number | null }[] = [
  { value: '1', label: 'mentor for your whole life', numeric: 1 },
  { value: '24/7', label: 'always available', numeric: null },
  { value: '100%', label: 'personalized to you', numeric: 100 },
];

// ─── stat count-up hook ───────────────────────────────────────────────────────

function useCountUp(target: number | null, duration = 600) {
  const [count, setCount] = useState(0);
  const triggered = useRef(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (target === null) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            setCount(Math.round(progress * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

// ─── StatItem ────────────────────────────────────────────────────────────────

function StatItem({ value, label, numeric }: (typeof STATS)[number]) {
  const { count, ref } = useCountUp(numeric);
  const displayValue = numeric !== null ? (numeric === 1 ? '1' : `${count}%`) : value;

  return (
    <div ref={numeric !== null ? ref : undefined}>
      <div className="font-mono text-2xl font-semibold text-foreground">{displayValue}</div>
      <div className="text-sm text-text-muted">{label}</div>
    </div>
  );
}

// ─── chat bubble ─────────────────────────────────────────────────────────────

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

// ─── HeroSection ─────────────────────────────────────────────────────────────

export const HeroSection = () => {
  const { user } = useAuth();

  return (
    <section id="hero" className="mx-auto max-w-content px-6 pb-16 pt-16 md:pt-20">
      <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">

        {/* ── left: copy ── */}
        <div>
          {/* step 0 — eyebrow */}
          <motion.div {...heroVariant(0)}>
            <Badge tone="accent" dot>
              AI life coaching
            </Badge>
          </motion.div>

          {/* step 1 + 1b — headline lines, 60 ms stagger */}
          <h1
            className="mt-5 font-serif font-semibold leading-[1.05] tracking-[-0.02em] text-foreground"
            style={{ fontSize: 'clamp(40px, 7vw, 64px)' }}
          >
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: STEP, ease: EASE, delay: LINE_BASE_DELAY }}
            >
              A mentor that
            </motion.span>
            <motion.span
              className="block text-accent"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: STEP,
                ease: EASE,
                delay: LINE_BASE_DELAY + LINE_STAGGER,
              }}
            >
              actually knows you.
            </motion.span>
          </h1>

          {/* step 2 — sub */}
          <motion.p
            className="mt-5 max-w-md text-lg leading-relaxed text-text-body"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: STEP, ease: EASE, delay: LINE_BASE_DELAY + LINE_STAGGER + STEP }}
          >
            One calm place to grow across every area of life — fitness, focus, relationships,
            sleep — guided by an AI that remembers everything you share with it.
          </motion.p>

          {/* step 3 — CTA */}
          <motion.div
            className="mt-8 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: STEP,
              ease: EASE,
              delay: LINE_BASE_DELAY + LINE_STAGGER + STEP * 2,
            }}
          >
            {user ? (
              <Button asChild variant="primary" size="lg">
                <Link href="/today">
                  Go to today <ArrowRight className="size-[18px]" />
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
          </motion.div>

          {/* stats */}
          <motion.div
            className="mt-10 flex gap-8"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: STEP,
              ease: EASE,
              delay: LINE_BASE_DELAY + LINE_STAGGER + STEP * 2,
            }}
          >
            {STATS.map((s) => (
              <StatItem key={s.label} {...s} />
            ))}
          </motion.div>
        </div>

        {/* ── right: hero visual (animate wrapper, not image) — step 4 ── */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: STEP,
            ease: EASE,
            delay: LINE_BASE_DELAY + LINE_STAGGER + STEP * 3,
          }}
        >
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
              <Bubble who="coach">
                Morning, Jordan. Your knee was sore yesterday — I&apos;ve kept today low-impact so
                you can move without setting it back.
              </Bubble>
              <Bubble who="me">That&apos;s exactly what I needed. Thanks.</Bubble>
              <Bubble who="coach">Day 12. Let&apos;s keep it going.</Bubble>
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
        </motion.div>

      </div>
    </section>
  );
};
