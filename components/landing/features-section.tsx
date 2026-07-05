'use client';

import { Sparkles, Clock, Target, TrendingUp, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

// FadeIn primitive supports y=6 only; guidelines require y=12 for section reveals.
// Using inline motion.div with whileInView + viewport once to meet the spec exactly.
const EASE = [0.4, 0, 0.2, 1] as const;
const DURATION_SLOW = 0.28;

const FEATURES: { Icon: LucideIcon; title: string; desc: string }[] = [
  {
    Icon: Sparkles,
    title: 'Adapts to you',
    desc: 'Guidance evolves with your progress instead of a generic, one-size plan.',
  },
  {
    Icon: Clock,
    title: 'Always available',
    desc: 'Check in whenever you need it — morning, midnight, or between meetings.',
  },
  {
    Icon: Target,
    title: 'Goal tracking',
    desc: 'Set goals, log progress, and watch momentum build across every area.',
  },
  {
    Icon: TrendingUp,
    title: 'Your whole life, one place',
    desc: 'One mentor that sees across every area — coordinated, not scattered.',
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="mx-auto max-w-content px-6 py-20">
      {/* section heading — fade + 12px rise on scroll */}
      <motion.div
        className="mb-11 text-center"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: DURATION_SLOW, ease: EASE }}
      >
        <h2 className="font-serif text-3xl font-semibold tracking-[-0.015em] text-foreground md:text-[2.375rem]">
          A coach that grows with you
        </h2>
      </motion.div>

      {/* cards — stagger 60 ms each, fade + 12px rise */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            className="rounded-lg border border-border bg-surface p-6 shadow-sm transition-[box-shadow,transform] duration-[150ms] ease-standard hover:-translate-y-px hover:shadow-md"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: DURATION_SLOW, ease: EASE, delay: i * 0.06 }}
          >
            <f.Icon className="mb-4 size-6 text-primary" />
            <h4 className="mb-1.5 text-base font-semibold text-foreground">{f.title}</h4>
            <p className="text-sm leading-relaxed text-text-muted">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
