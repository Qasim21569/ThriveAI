'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';
import ClientLayout from './client-layout';
import { SafeComponent } from '@/components/ui/safe-component';

// Simple loading component
const LoadingFallback = () => (
  <div className="p-4 text-center text-white/50">
    Loading...
  </div>
);

// Always use reducedIntensity for background animations to improve performance
const BackgroundAnimation = dynamic(
  () => import('@/components/landing/background-animation').then(mod => ({
    default: (props) => <mod.BackgroundAnimation {...props} reducedIntensity={true} />
  })),
  { ssr: false, loading: () => <div className="fixed inset-0 bg-[#0A0A1F]"></div> }
);

const StarsBackground = dynamic(
  () => import('@/components/landing/stars-background').then(mod => ({ default: mod.StarsBackground })),
  { ssr: false, loading: () => null }
);

const Navbar = dynamic(
  () => import('@/components/landing/navbar').then(mod => mod.Navbar),
  { ssr: false, loading: () => <div className="h-16 w-full"></div> }
);

const HeroSection = dynamic(
  () => import('@/components/landing/hero-section').then(mod => mod.HeroSection),
  { ssr: false, loading: () => <LoadingFallback /> }
);

const ModeCards = dynamic(
  () => import('@/components/landing/mode-cards').then(mod => mod.ModeCards),
  { ssr: false, loading: () => <LoadingFallback /> }
);

const FeaturesSection = dynamic(
  () => import('@/components/landing/features-section').then(mod => mod.FeaturesSection),
  { ssr: false, loading: () => <LoadingFallback /> }
);

const TestimonialsSection = dynamic(
  () => import('@/components/landing/testimonials-section').then(mod => mod.TestimonialsSection),
  { ssr: false, loading: () => <LoadingFallback /> }
);

const Footer = dynamic(
  () => import('@/components/landing/footer').then(mod => mod.Footer),
  { ssr: false, loading: () => <LoadingFallback /> }
);

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showFullBackground, setShowFullBackground] = useState(false);
  
  useEffect(() => {
    // Staged loading approach for better performance
    const initialTimer = setTimeout(() => {
      setIsLoaded(true);
    }, 300); 
    
    // Delay full background effects even more
    const backgroundTimer = setTimeout(() => {
      setShowFullBackground(true);
    }, 1500);
    
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(backgroundTimer);
    };
  }, []);

  // Create error-safe loading for component sections
  const renderComponent = (Component: React.ComponentType<any>, priority = false) => {
    if (!isLoaded && !priority) return <LoadingFallback />;
    
    return (
      <SafeComponent fallback={<LoadingFallback />}>
        <Component />
      </SafeComponent>
    );
  };

  return (
    <ClientLayout>
      <div className="min-h-screen flex flex-col relative">
        {/* Static background */}
        <div className="fixed inset-0 bg-[#0A0A1F] z-[-2]"></div>
        
        {/* Only show 3D stars when fully loaded */}
        {showFullBackground && (
          <SafeComponent>
            <StarsBackground />
          </SafeComponent>
        )}
        
        {/* Always show background animations but with reduced intensity */}
        {isLoaded && (
          <SafeComponent>
            <BackgroundAnimation />
          </SafeComponent>
        )}
        
        {/* Navbar - prioritized loading */}
        {renderComponent(Navbar, true)}

        <main className="flex-1">
          {/* Hero Section - prioritized */}
          {renderComponent(HeroSection, true)}
          
          {/* Mode Cards - main coaching options */}
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
