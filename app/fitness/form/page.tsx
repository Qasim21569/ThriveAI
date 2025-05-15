'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { SafeComponent } from '@/components/ui/safe-component';

// Dynamically import components to avoid hydration issues
const Navbar = dynamic(
  () => import('@/components/landing/navbar').then(mod => mod.Navbar),
  { ssr: false }
);

const Footer = dynamic(
  () => import('@/components/landing/footer').then(mod => mod.Footer),
  { ssr: false }
);

const BackgroundAnimation = dynamic(
  () => import('@/components/landing/background-animation').then(mod => mod.default),
  { ssr: false }
);

// Create a wrapper component that imports FitnessForm
const DynamicFitnessForm = dynamic(
  () => import('@/components/modes/fitness/form/FitnessFormWrapper'),
  { ssr: false }
);

export default function FitnessFormPage() {
  const router = useRouter();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Delay loading of background elements for better performance
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Static Background */}
      <div className="fixed inset-0 bg-background z-0"></div>
      
      {/* Cosmic dust overlay */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div 
          className="absolute top-0 left-0 w-full h-screen opacity-30"
          style={{
            background: 'radial-gradient(circle at 30% 20%, rgba(142, 81, 255, 0.2), transparent 70%)',
            filter: 'blur(80px)'
          }}
        />
        <div 
          className="absolute bottom-0 right-0 w-full h-screen opacity-30"
          style={{
            background: 'radial-gradient(circle at 70% 80%, rgba(100, 60, 255, 0.3), transparent 60%)',
            filter: 'blur(100px)'
          }}
        />

        {/* Subtle central glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-[60vh] opacity-20"
          style={{
            background: 'radial-gradient(ellipse, rgba(180, 100, 255, 0.4), transparent 70%)',
            filter: 'blur(60px)'
          }}
        />
      </div>
      
      {/* Animated Background (loads after delay) */}
      {isLoaded && (
        <div className="fixed inset-0 z-0">
          <SafeComponent fallback={<div className="bg-background/80" />}>
            <BackgroundAnimation reducedIntensity />
          </SafeComponent>
        </div>
      )}
      
      {/* Navbar */}
      <SafeComponent fallback={<div className="h-16" />}>
        <Navbar />
      </SafeComponent>
      
      {/* Main Content */}
      <main className="flex-1 z-10 container mx-auto px-4 py-12 md:py-20">
        <SafeComponent fallback={
          <div className="h-screen flex items-center justify-center">
            <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-violet-500 border-r-transparent align-[-0.125em]"></div>
            <p className="ml-4 text-lg">Loading Form...</p>
          </div>
        }>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <DynamicFitnessForm />
          </motion.div>
        </SafeComponent>
      </main>
      
      {/* Footer */}
      <SafeComponent fallback={<div className="h-16" />}>
        <Footer />
      </SafeComponent>
    </div>
  );
} 