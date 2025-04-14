'use client';

import React from 'react';
import FitnessLanding from '@/components/modes/fitness/FitnessLanding';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import BackgroundAnimation from '@/components/landing/background-animation';

export default function FitnessModePage() {
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    // Delay loading of background elements for better performance
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative min-h-screen">
      {/* Static background color */}
      <div className="fixed inset-0 bg-background z-0"></div>

      {/* Animated background (loads after delay) */}
      {isLoaded && (
        <div className="fixed inset-0 z-0">
          <BackgroundAnimation />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        <Navbar />
        <FitnessLanding />
        <Footer />
      </div>
    </main>
  );
} 