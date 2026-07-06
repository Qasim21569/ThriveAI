'use client';

import { Brain, Globe, CheckCircle, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const EASE = [0.4, 0, 0.2, 1] as const;
const DURATION_SLOW = 0.28;

const FEATURES: { Icon: LucideIcon; title: string; desc: string }[] = [
  {
    Icon: Brain,
    title: 'Persistent memory',
    desc: 'ThriveAI remembers what you share — across sessions, across weeks, across life areas. Your context never resets.',
  },
  {
    Icon: Globe,
    title: 'Whole-life view',
    desc: 'Career, health, mental wellbeing, finances, relationships — one mentor that sees all five together, not five separate apps.',
  },
  {
    Icon: CheckCircle,
    title: 'Built-in accountability',
    desc: 'Daily check-ins take 2 minutes and keep your memory current. Your mentor notices when you slip — and helps you recover without judgment.',
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="bg-surface-sunken px-6 py-20">
      <div className="mx-auto max-w-content">
        {/* section heading */}
        <motion.div
          className="mb-11 text-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: DURATION_SLOW, ease: EASE }}
        >
          <p className="ds-label mb-3">Why ThriveAI</p>
          <h2
            className="font-serif text-3xl tracking-[-0.015em] text-foreground md:text-[2.375rem]"
            style={{ fontWeight: 400 }}
          >
            Built around memory, not sessions.
          </h2>
        </motion.div>

        {/* 3-column feature cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="rounded-lg border border-border bg-surface p-6 shadow-sm transition-[box-shadow,transform] duration-fast ease-standard hover:-translate-y-px hover:shadow-md"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: DURATION_SLOW, ease: EASE, delay: i * 0.06 }}
            >
              <f.Icon className="mb-4 size-6 text-accent" />
              <h4 className="mb-1.5 text-base font-semibold text-foreground">{f.title}</h4>
              <p className="text-sm leading-relaxed text-text-muted">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
