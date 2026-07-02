'use client';

import FitnessLanding from '@/components/modes/fitness/FitnessLanding';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export default function FitnessModePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <FitnessLanding />
      </main>
      <Footer />
    </div>
  );
}
