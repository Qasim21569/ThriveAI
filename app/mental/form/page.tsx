'use client';

import dynamic from 'next/dynamic';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

// Client-only form (uses localStorage / hooks)
const MentalWellbeingForm = dynamic(
  () => import('@/components/modes/mental/form/MentalWellbeingForm').then((mod) => mod.MentalWellbeingForm),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="size-12 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
      </div>
    ),
  }
);

export default function MentalWellbeingFormPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-content px-4 py-12 md:py-16">
          <div className="mb-8 text-center">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-accent">
              Mental wellbeing
            </span>
            <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.015em] text-foreground md:text-4xl">
              Wellbeing assessment
            </h1>
          </div>
          <MentalWellbeingForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
