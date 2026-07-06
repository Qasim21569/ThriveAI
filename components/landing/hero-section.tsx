'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
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

// ─── chat bubble ─────────────────────────────────────────────────────────────

function Bubble({ who, children }: { who: 'coach' | 'me'; children: React.ReactNode }) {
  const me = who === 'me';
  return (
    <div
      className={[
        'max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-snug',
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
              AI life mentor
            </Badge>
          </motion.div>

          {/* step 1 + 1b — headline lines, 60 ms stagger */}
          <h1
            className="mt-5 font-serif leading-[1.05] tracking-[-0.02em] text-foreground"
            style={{ fontSize: 'clamp(40px, 7vw, 64px)', fontWeight: 400 }}
          >
            <motion.span
              className="block"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: STEP, ease: EASE, delay: LINE_BASE_DELAY }}
            >
              Your AI mentor.
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
              It remembers everything.
            </motion.span>
          </h1>

          {/* step 2 — sub */}
          <motion.p
            className="mt-5 max-w-md text-lg leading-relaxed text-text-body"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: STEP, ease: EASE, delay: LINE_BASE_DELAY + LINE_STAGGER + STEP }}
          >
            Tell it about your life once. It builds a persistent memory across career, health,
            finances, mental wellbeing, and relationships — then gives you advice that compounds
            because it actually knows your history.
          </motion.p>

          {/* step 3 — single CTA */}
          <motion.div
            className="mt-8"
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
                  Start your 5-minute interview <ArrowRight className="size-[18px]" />
                </Link>
              </Button>
            )}
          </motion.div>

          {/* step 4 — trust note */}
          <motion.p
            className="mt-3 text-sm text-text-muted"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: STEP,
              ease: EASE,
              delay: LINE_BASE_DELAY + LINE_STAGGER + STEP * 2.5,
            }}
          >
            Free. No credit card. Takes 5 minutes.
          </motion.p>
        </div>

        {/* ── right: hero visual (animate wrapper) — step 5 ── */}
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
                <div className="text-sm font-semibold text-foreground">Thrive Mentor</div>
                <div className="text-xs text-success">● Online now</div>
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <Bubble who="coach">
                Morning, Jordan. You mentioned your sleep has been rough this week — I pushed
                your cardio session to Thursday and added a wind-down reminder tonight.
              </Bubble>
              <Bubble who="me">You remembered that from last check-in?</Bubble>
              <Bubble who="coach">
                Always. That&apos;s the point — your context never resets.
              </Bubble>
            </div>
          </div>
          {/* floating memory indicator */}
          <div className="absolute -bottom-5 -left-5 flex items-center gap-2.5 rounded-lg border border-border bg-surface px-4 py-3 shadow-md">
            <span className="font-serif italic text-accent" style={{ fontSize: '13px' }}>remembers your history</span>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
