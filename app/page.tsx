'use client';

import React, { useState, useEffect, memo } from 'react';
import dynamic from 'next/dynamic';
import ClientLayout from './client-layout';
import { SafeComponent } from '@/components/ui/safe-component';

// Simple loading component
const LoadingFallback = memo(() => (
  <div className="p-4 text-center text-white/50">
    Loading...
  </div>
));

// Static background effect - no animations or Three.js
const StaticBackground = memo(() => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
    {/* Simple gradient background */}
    <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 to-background opacity-50"></div>
    <div className="absolute inset-0" style={{background: 'radial-gradient(circle at center, transparent 40%, rgba(10, 0, 30, 0.4) 100%)', opacity: 0.7}}></div>
    
    {/* Static star field - no animation */}
    <div className="absolute inset-0">
      {Array.from({ length: 50 }).map((_, i) => (
        <div 
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            opacity: Math.random() * 0.5 + 0.1,
          }}
        />
      ))}
    </div>
  </div>
));

// Static components that don't need animations
const Navbar = dynamic(
  () => import('@/components/landing/navbar').then(mod => mod.Navbar),
  { ssr: false, loading: () => <div className="h-16 w-full"></div> }
);

// Lazily load the heavy components
const HeroSection = dynamic(
  () => import('@/components/landing/hero-section').then(mod => mod.HeroSection),
  { ssr: false, loading: () => <LoadingFallback /> }
);

const ModeCards = dynamic(
  () => import('@/components/landing/mode-cards').then(mod => mod.ModeCards),
  { ssr: false, loading: () => <LoadingFallback /> }
);

// Load content in chunks for better performance
const ContentChunk = memo(({ children }: { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (!isVisible) return <LoadingFallback />;
  
  return <>{children}</>;
});

// Lazily load lower priority sections
const FeaturesSection = dynamic(
  () => import('@/components/landing/features-section').then(mod => mod.FeaturesSection),
  { ssr: false, loading: () => <LoadingFallback /> }
);

const Footer = dynamic(
  () => import('@/components/landing/footer').then(mod => mod.Footer),
  { ssr: false, loading: () => <LoadingFallback /> }
);

// Main component with optimizations
export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Basic loading
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);
    
    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <ClientLayout>
      <div className="min-h-screen flex flex-col relative">
        {/* Static background */}
        <div className="fixed inset-0 bg-[#0A0A1F] z-[-2]"></div>
        
        {/* Simple static background */}
        {isLoaded && <StaticBackground />}
        
        {/* Prioritized navbar */}
        <Navbar />

        <main className="flex-1">
          {/* Hero section - always visible */}
          <ContentChunk>
            <HeroSection />
          </ContentChunk>
          
          {/* Mode cards - always visible */}
          <ContentChunk>
            <ModeCards />
          </ContentChunk>
          
          {/* Lower priority sections */}
          {isLoaded && (
            <>
              <ContentChunk>
                <FeaturesSection />
              </ContentChunk>
              
              <ContentChunk>
                <Footer />
              </ContentChunk>
            </>
          )}
        </main>
      </div>
    </ClientLayout>
  );
}
