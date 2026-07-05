'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

// FadeIn primitive uses y=6; guidelines call for 12px on section reveals.
// Using motion.div directly so we hit the spec exactly.
const EASE = [0.4, 0, 0.2, 1] as const;
const DURATION_SLOW = 0.28;

export const CtaSection = () => {
  return (
    <section className="px-6 pb-20">
      <motion.div
        className="mx-auto max-w-content rounded-xl bg-coffee-700 px-8 py-14 text-center md:px-12"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: DURATION_SLOW, ease: EASE }}
      >
        <h2 className="font-serif text-3xl font-semibold tracking-[-0.015em] text-[rgb(251_249_245)] md:text-[2.375rem]">
          Start with a single goal.
        </h2>
        <p className="mx-auto mt-3.5 max-w-md text-lg text-coffee-100">
          Two minutes to set it up. No credit card. Your mentor is ready when you are.
        </p>
        <Button asChild variant="accent" size="lg" className="mt-7">
          <Link href="/auth/sign-up">
            Start free <ArrowRight className="size-[18px]" />
          </Link>
        </Button>
      </motion.div>
    </section>
  );
};
