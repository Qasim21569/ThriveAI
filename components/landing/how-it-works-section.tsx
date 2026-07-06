'use client';

import { motion } from 'framer-motion';

const EASE = [0.4, 0, 0.2, 1] as const;
const DURATION_SLOW = 0.28;

const STEPS = [
  {
    number: '01',
    title: 'A 5-minute interview seeds your memory',
    desc: 'Answer a short set of questions about your goals, struggles, and context across five life areas: career, health, mental wellbeing, finances, and relationships. ThriveAI turns your answers into a structured memory it will carry forward in every conversation.',
  },
  {
    number: '02',
    title: '2-minute daily check-ins keep it current',
    desc: 'Each day, a quick check-in updates your memory with what actually happened, not just what you planned. Did the workout happen? How was your sleep? Your mentor learns from the real you, not an idealized version.',
  },
  {
    number: '03',
    title: 'Advice that compounds because it remembers',
    desc: "Unlike a generic AI chatbot that forgets you between sessions, ThriveAI's advice gets sharper over time. It connects dots across areas, noticing that your sleep affects your focus or that your stress is tied to a financial deadline, and adjusts accordingly.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="mx-auto max-w-content px-6 py-20">
      {/* section heading */}
      <motion.div
        className="mb-12 text-center"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: DURATION_SLOW, ease: EASE }}
      >
        <p className="ds-label mb-3">How it works</p>
        <h2 className="font-serif text-3xl tracking-[-0.015em] text-foreground md:text-[2.375rem]" style={{ fontWeight: 400 }}>
          Three steps. Then it just knows you.
        </h2>
      </motion.div>

      {/* steps */}
      <div className="flex flex-col gap-6 md:gap-8">
        {STEPS.map((step, i) => (
          <motion.div
            key={step.number}
            className="grid gap-5 rounded-lg border border-border bg-surface p-6 shadow-sm md:grid-cols-[auto_1fr] md:gap-8 md:p-8"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: DURATION_SLOW, ease: EASE, delay: i * 0.08 }}
          >
            {/* number */}
            <div
              className="font-mono text-4xl leading-none tracking-[-0.02em] text-border-strong md:text-5xl"
              aria-hidden
            >
              {step.number}
            </div>
            {/* content */}
            <div>
              <h3 className="font-sans text-lg font-semibold leading-snug text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-text-body">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};
