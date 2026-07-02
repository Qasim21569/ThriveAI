'use client';

import MentalLanding from '@/components/modes/mental/MentalLanding';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export default function MentalModePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <MentalLanding />
      </main>
      <Footer />
    </div>
  );
}
