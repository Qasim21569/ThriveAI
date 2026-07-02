'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const CtaSection = () => {
  return (
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-content rounded-xl bg-coffee-700 px-8 py-14 text-center md:px-12">
        <h2 className="font-serif text-3xl font-semibold tracking-[-0.015em] text-[rgb(251_249_245)] md:text-[2.375rem]">
          Ready to thrive?
        </h2>
        <p className="mx-auto mt-3.5 max-w-md text-lg text-coffee-100">
          Set your first goal in under two minutes. No credit card.
        </p>
        <Button asChild variant="accent" size="lg" className="mt-7">
          <Link href="/auth/sign-up">
            Start free <ArrowRight className="size-[18px]" />
          </Link>
        </Button>
      </div>
    </section>
  );
};
