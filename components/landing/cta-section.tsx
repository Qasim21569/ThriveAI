'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const EASE = [0.4, 0, 0.2, 1] as const;
const DURATION_SLOW = 0.28;

export const CtaSection = () => {
  return (
    <section className="px-6 pb-20">
      <motion.div
        className="mx-auto max-w-content rounded-xl bg-foreground px-8 py-14 text-center md:px-12"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: DURATION_SLOW, ease: EASE }}
      >
        <h2
          className="font-serif text-3xl tracking-[-0.015em] text-background md:text-[2.375rem]"
          style={{ fontWeight: 400 }}
        >
          Five minutes to a mentor that knows you.
        </h2>
        <p className="mx-auto mt-3.5 max-w-md text-lg text-background/70">
          Answer a short interview. ThriveAI builds your memory and starts giving real advice
          immediately. No credit card. Free to start.
        </p>
        <Button asChild variant="accent" size="lg" className="mt-7">
          <Link href="/auth/sign-up">
            Start your interview <ArrowRight className="size-[18px]" />
          </Link>
        </Button>
      </motion.div>
    </section>
  );
};
