'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ClientLayout from './client-layout';
import { SafeComponent } from '@/components/ui/safe-component';

// Dynamically import components with SSR disabled to avoid hydration issues
const BackgroundAnimation = dynamic(
  () => import('@/components/landing/background-animation').then(mod => mod.BackgroundAnimation),
  { ssr: false }
);

const StarsBackground = dynamic(
  () => import('@/components/landing/stars-background').then(mod => ({ default: mod.StarsBackground })),
  { ssr: false }
);

const Navbar = dynamic(
  () => import('@/components/landing/navbar').then(mod => mod.Navbar),
  { ssr: false }
);

const HeroSection = dynamic(
  () => import('@/components/landing/hero-section').then(mod => mod.HeroSection),
  { ssr: false }
);

const ModeCards = dynamic(
  () => import('@/components/landing/mode-cards').then(mod => mod.ModeCards),
  { ssr: false }
);

const FeaturesSection = dynamic(
  () => import('@/components/landing/features-section').then(mod => mod.FeaturesSection),
  { ssr: false }
);

const TestimonialsSection = dynamic(
  () => import('@/components/landing/testimonials-section').then(mod => mod.TestimonialsSection),
  { ssr: false }
);

const Footer = dynamic(
  () => import('@/components/landing/footer').then(mod => mod.Footer),
  { ssr: false }
);

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Delay background animations for smoother loading
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500); // Increased delay for safer loading
    
    return () => clearTimeout(timer);
  }, []);

  // Create error-safe loading for component sections
  const renderComponent = (Component: React.ComponentType<any>, fallback: React.ReactNode = null) => {
    if (!isLoaded) return fallback;
    
    return (
      <SafeComponent fallback={
        <div className="p-4 text-center text-white/50">
          Loading component...
        </div>
      }>
        <Component />
      </SafeComponent>
    );
  };

  return (
    <ClientLayout>
      <div className="min-h-screen flex flex-col relative">
        {/* Static background */}
        <div className="fixed inset-0 bg-[#0A0A1F] z-[-2]"></div>
        
        {/* Three.js Stars Background */}
        {isLoaded && (
          <SafeComponent>
            <StarsBackground />
          </SafeComponent>
        )}
        
        {/* Animated background waves */}
        {isLoaded && (
          <SafeComponent>
            <BackgroundAnimation />
          </SafeComponent>
        )}
        
        {/* Navbar */}
        <SafeComponent>
          <Navbar />
        </SafeComponent>

        <main>
          {/* Hero Section */}
          {renderComponent(HeroSection)}
          
          {/* Mode Cards - Main coaching options */}
          {renderComponent(ModeCards)}
          
          {/* Features Section */}
          {renderComponent(FeaturesSection)}
          
          {/* Testimonials Section */}
          {renderComponent(TestimonialsSection)}
        </main>
      
        {/* Footer */}
        {renderComponent(Footer)}
      </div>
    </ClientLayout>
  );
}
